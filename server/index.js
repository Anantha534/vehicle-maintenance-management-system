import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ensurePostgres } from './start-pg.js';

// ---------- Password Helpers ----------
const BCRYPT_ROUNDS = 12;

// Detect if a stored password is already a bcrypt hash (starts with $2a$, $2b$, $2x$, $2y$)
function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[abxy]\$\d{2}\$/.test(str);
}

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

async function verifyPassword(plaintext, stored) {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plaintext, stored);
  }
  // Legacy plaintext match — on-the-fly migration will follow
  return plaintext === stored;
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// In-memory session store (simple token-based auth with TTL support)
const sessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours session expiry

app.use(cors());
app.use(express.json());

// Ensure malformed JSON requests return JSON error instead of HTML
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload received in request' });
  }
  next(err);
});

// Force application/json for all /api endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// ---------- Role Normalization & RBAC Helpers ----------
function normalizeRole(role) {
  if (!role) return 'USER';
  const trimmed = String(role).trim().toUpperCase();
  if (trimmed === 'ADMIN') return 'ADMIN';
  return 'USER';
}

// ---------- Auth & RBAC Middleware ----------
function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Authentication required. Please login first.' });
  }

  const session = sessions.get(token);
  const now = Date.now();

  if (session.expiresAt && now > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }

  // Update session activity timestamp and slide expiration window
  session.lastAccessed = now;
  session.expiresAt = now + SESSION_TTL_MS;
  req.user = session;
  next();
}

function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please login first.' });
    }
    const currentRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(currentRole)) {
      return res.status(403).json({
        error: `Forbidden: Administrator privileges required. Current role '${currentRole}' is not authorized to perform this operation.`
      });
    }
    next();
  };
}

const requireAdmin = requireRole('ADMIN');

import {
  validateVehiclePayload,
  validateMaintenancePayload,
  validateSparePartPayload,
  computeServiceState,
  isValidDateString
} from './validation.js';

// Service scheduling helper re-exported for convenience
export { computeServiceState };

// Sync vehicle status helper (supports transactional client tx)
async function syncVehicleStatus(regNo, tx = prisma) {
  const vehicle = await tx.vehicle.findUnique({ where: { regNo } });
  if (!vehicle) return;

  const inProgressCount = await tx.maintenanceLog.count({
    where: { vehicleReg: regNo, status: 'In Progress' }
  });

  let newStatus = 'Active';
  if (inProgressCount > 0) {
    // Under Repair has top priority
    newStatus = 'Under Repair';
  } else if (vehicle.nextServiceDate) {
    const { state } = computeServiceState(vehicle.nextServiceDate);
    if (state === 'Overdue' || state === 'Due') {
      newStatus = 'Service Due';
    } else {
      newStatus = 'Active';
    }
  }

  if (vehicle.status !== newStatus) {
    await tx.vehicle.update({
      where: { regNo },
      data: { status: newStatus }
    });
  }
}

// ---------- Auth Endpoints ----------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // On-the-fly migration: if the stored password is still plaintext, hash it now
    if (!isBcryptHash(user.password)) {
      try {
        const hashed = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashed }
        });
        console.log(`[Auth] Migrated plaintext password to bcrypt for user: ${user.username}`);
      } catch (migrationErr) {
        // Non-fatal: log and continue. Next login will retry migration.
        console.error(`[Auth] Password migration failed for ${user.username}:`, migrationErr.message);
      }
    }

    const token = crypto.randomUUID();
    const normalizedRole = normalizeRole(user.role);
    const now = Date.now();
    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: normalizedRole,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + SESSION_TTL_MS
    };
    sessions.set(token, sessionData);

    const publicUserData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: normalizedRole
    };

    return res.status(200).json({ success: true, token, user: publicUserData });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      role: normalizeRole(req.user.role)
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// ---------- Vehicles CRUD ----------
app.get('/api/vehicles', requireAuth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// ---------- Vehicles CRUD ----------
app.get('/api/vehicles', requireAuth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.post('/api/vehicles', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = validateVehiclePayload(req.body, { isUpdate: false });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    // Check duplicate registration proactively
    const existing = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
    if (existing) {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }

    let initialStatus = data.status || 'Active';
    if (initialStatus !== 'Under Repair' && data.nextServiceDate) {
      const { state } = computeServiceState(data.nextServiceDate);
      if (state === 'Overdue' || state === 'Due') {
        initialStatus = 'Service Due';
      } else {
        initialStatus = 'Active';
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        status: initialStatus
      }
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

app.put('/api/vehicles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid vehicle ID is required' });
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const validation = validateVehiclePayload(req.body, { isUpdate: true });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    // If updating registration, verify it doesn't collide with another vehicle
    if (data.regNo && data.regNo !== existing.regNo) {
      const duplicate = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
      if (duplicate && duplicate.id !== id) {
        return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
      }
    }

    const updatedVehicle = await prisma.$transaction(async (tx) => {
      const inProgressCount = await tx.maintenanceLog.count({
        where: { vehicleReg: existing.regNo, status: 'In Progress' }
      });

      let resolvedStatus = data.status !== undefined ? data.status : existing.status;
      if (inProgressCount > 0) {
        resolvedStatus = 'Under Repair';
      } else if (resolvedStatus !== 'Under Repair') {
        const targetDate = data.nextServiceDate !== undefined ? data.nextServiceDate : existing.nextServiceDate;
        if (targetDate) {
          const { state } = computeServiceState(targetDate);
          resolvedStatus = (state === 'Overdue' || state === 'Due') ? 'Service Due' : 'Active';
        } else {
          resolvedStatus = 'Active';
        }
      }

      const vehicle = await tx.vehicle.update({
        where: { id },
        data: {
          ...data,
          status: resolvedStatus
        }
      });

      // If make or model updated, sync vehicleName on historical maintenance logs
      if (data.make !== undefined || data.model !== undefined) {
        const newName = `${vehicle.make} ${vehicle.model}`;
        await tx.maintenanceLog.updateMany({
          where: { vehicleReg: vehicle.regNo },
          data: { vehicleName: newName }
        });
      }

      return vehicle;
    });

    res.json(updatedVehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

app.delete('/api/vehicles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid vehicle ID is required' });
    }

    // Cascading delete handled by PostgreSQL relations (onDelete: Cascade)
    const vehicle = await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true, deleted: vehicle });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ---------- Maintenance CRUD ----------
app.get('/api/maintenance', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({ orderBy: { serviceDate: 'desc' } });
    res.json(logs);
  } catch (error) {
    console.error('Fetch maintenance error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

app.post('/api/maintenance', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = validateMaintenancePayload(req.body, { isUpdate: false });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    // Verify referenced vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { regNo: data.vehicleReg } });
    if (!vehicle) {
      return res.status(400).json({ error: `No vehicle found with registration ${data.vehicleReg}` });
    }

    const resolvedVehicleName = data.vehicleName || `${vehicle.make} ${vehicle.model}`;

    const log = await prisma.$transaction(async (tx) => {
      const newLog = await tx.maintenanceLog.create({
        data: {
          ...data,
          vehicleName: resolvedVehicleName,
          mileage: data.mileage !== undefined ? data.mileage : vehicle.mileage
        }
      });

      // Update vehicle mileage (if maintenance mileage is higher) and nextServiceDate (if provided)
      const updatedMileage = data.mileage !== undefined ? Math.max(vehicle.mileage, data.mileage) : vehicle.mileage;
      await tx.vehicle.update({
        where: { regNo: data.vehicleReg },
        data: {
          mileage: updatedMileage,
          ...(data.nextServiceDate ? { nextServiceDate: data.nextServiceDate } : {})
        }
      });

      // Sync vehicle status respecting Under Repair priority
      await syncVehicleStatus(data.vehicleReg, tx);

      return newLog;
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

app.put('/api/maintenance/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid maintenance log ID is required' });
    }

    const existingLog = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    const validation = validateMaintenancePayload(req.body, { isUpdate: true });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    // If updating vehicleReg, verify that the new vehicle exists
    const targetReg = data.vehicleReg || existingLog.vehicleReg;
    if (data.vehicleReg && data.vehicleReg !== existingLog.vehicleReg) {
      const targetVehicle = await prisma.vehicle.findUnique({ where: { regNo: data.vehicleReg } });
      if (!targetVehicle) {
        return res.status(400).json({ error: `No vehicle found with registration ${data.vehicleReg}` });
      }
    }

    const updatedLog = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.update({
        where: { id },
        data
      });

      // If nextServiceDate updated, sync with vehicle
      if (data.nextServiceDate) {
        await tx.vehicle.update({
          where: { regNo: targetReg },
          data: { nextServiceDate: data.nextServiceDate }
        });
      }

      // If mileage updated, update vehicle mileage if log mileage > vehicle mileage
      if (data.mileage !== undefined) {
        const v = await tx.vehicle.findUnique({ where: { regNo: targetReg } });
        if (v && data.mileage > v.mileage) {
          await tx.vehicle.update({
            where: { regNo: targetReg },
            data: { mileage: data.mileage }
          });
        }
      }

      await syncVehicleStatus(targetReg, tx);
      if (data.vehicleReg && data.vehicleReg !== existingLog.vehicleReg) {
        await syncVehicleStatus(existingLog.vehicleReg, tx);
      }

      return log;
    });

    res.json(updatedLog);
  } catch (error) {
    console.error('Update maintenance error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
});

app.delete('/api/maintenance/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid maintenance log ID is required' });
    }

    const existing = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    const log = await prisma.$transaction(async (tx) => {
      const deleted = await tx.maintenanceLog.delete({ where: { id } });
      await syncVehicleStatus(deleted.vehicleReg, tx);
      return deleted;
    });

    res.json({ success: true, deleted: log });
  } catch (error) {
    console.error('Delete maintenance error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
});

// ---------- Spare Parts CRUD ----------
app.get('/api/spare-parts', requireAuth, async (req, res) => {
  try {
    const parts = await prisma.sparePart.findMany({ orderBy: { replacementDate: 'desc' } });
    res.json(parts);
  } catch (error) {
    console.error('Fetch spare parts error:', error);
    res.status(500).json({ error: 'Failed to fetch spare parts' });
  }
});

app.post('/api/spare-parts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = validateSparePartPayload(req.body, { isUpdate: false });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    // Verify referenced vehicle exists (foreign key check)
    const vehicle = await prisma.vehicle.findUnique({ where: { regNo: data.vehicleReg } });
    if (!vehicle) {
      return res.status(400).json({ error: `No vehicle found with registration ${data.vehicleReg}` });
    }

    const part = await prisma.sparePart.create({
      data
    });

    res.status(201).json(part);
  } catch (error) {
    console.error('Create spare part error:', error);
    res.status(500).json({ error: 'Failed to create spare part' });
  }
});

app.put('/api/spare-parts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid spare part ID is required' });
    }

    const existing = await prisma.sparePart.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Spare part not found' });
    }

    const validation = validateSparePartPayload(req.body, { isUpdate: true });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const data = validation.data;

    if (data.vehicleReg && data.vehicleReg !== existing.vehicleReg) {
      const vehicle = await prisma.vehicle.findUnique({ where: { regNo: data.vehicleReg } });
      if (!vehicle) {
        return res.status(400).json({ error: `No vehicle found with registration ${data.vehicleReg}` });
      }
    }

    const part = await prisma.sparePart.update({
      where: { id },
      data
    });

    res.json(part);
  } catch (error) {
    console.error('Update spare part error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.status(500).json({ error: 'Failed to update spare part' });
  }
});

app.delete('/api/spare-parts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'Valid spare part ID is required' });
    }

    const part = await prisma.sparePart.delete({ where: { id } });
    res.json({ success: true, deleted: part });
  } catch (error) {
    console.error('Delete spare part error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Spare part not found' });
    }
    res.status(500).json({ error: 'Failed to delete spare part' });
  }
});

// ---------- User Management (ADMIN Only) ----------
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users.map(u => ({ ...u, role: normalizeRole(u.role) })));
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body || {};
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required and cannot be empty' });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must not exceed 128 characters' });
    }

    // Always store new accounts with a hashed password; role defaults to USER
    const assignedRole = normalizeRole(role || 'USER');
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role: assignedRole
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({ ...newUser, role: normalizeRole(newUser.role) });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A user with this username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Catch-all for undefined /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global unhandled error handler (prevents leaking stack traces or internal database errors)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  const safeMessage = status === 500 ? 'Internal server error' : (err.message || 'An error occurred');
  res.status(status).json({ error: safeMessage });
});

// Start server after ensuring PostgreSQL is running
async function bootstrap() {
  try {
    await ensurePostgres();
  } catch (pgErr) {
    console.warn('Note on PostgreSQL startup check:', pgErr.message || pgErr);
  }

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Database: PostgreSQL at ${process.env.DATABASE_URL ? 'configured URL' : 'default'}`);
  });
}

bootstrap();

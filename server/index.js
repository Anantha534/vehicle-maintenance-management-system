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

// Service scheduling helper
function computeServiceState(nextServiceDate) {
  if (!nextServiceDate) return { state: 'None', daysDiff: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(nextServiceDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { state: 'Overdue', daysDiff: diffDays };
  if (diffDays <= 7) return { state: 'Due', daysDiff: diffDays };
  return { state: 'Upcoming', daysDiff: diffDays };
}

// Sync vehicle status helper
async function syncVehicleStatus(regNo) {
  const vehicle = await prisma.vehicle.findUnique({ where: { regNo } });
  if (!vehicle) return;

  const inProgressCount = await prisma.maintenanceLog.count({
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
    await prisma.vehicle.update({
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

app.post('/api/vehicles', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { regNo, type, make, model, year, fuelType, mileage, status, nextServiceDate, purchaseDate, insuranceExpiry } = req.body;
    if (!regNo || !make || !model) {
      return res.status(400).json({ error: 'Registration number, make, and model are required' });
    }

    // Determine initial status based on nextServiceDate if not explicitly Under Repair
    let initialStatus = status || 'Active';
    if (initialStatus !== 'Under Repair' && nextServiceDate) {
      const { state } = computeServiceState(nextServiceDate);
      if (state === 'Overdue' || state === 'Due') {
        initialStatus = 'Service Due';
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        regNo,
        type: type || 'Car',
        make,
        model,
        year: Number(year) || new Date().getFullYear(),
        fuelType: fuelType || 'Petrol',
        mileage: Number(mileage) || 0,
        status: initialStatus,
        nextServiceDate: nextServiceDate || null,
        purchaseDate: purchaseDate || null,
        insuranceExpiry: insuranceExpiry || null
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
    const { regNo, type, make, model, year, fuelType, mileage, status, nextServiceDate, purchaseDate, insuranceExpiry } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if in progress maintenance exists
    const inProgressCount = await prisma.maintenanceLog.count({
      where: { vehicleReg: existing.regNo, status: 'In Progress' }
    });

    let resolvedStatus = status !== undefined ? status : existing.status;
    if (inProgressCount > 0) {
      resolvedStatus = 'Under Repair';
    } else if (resolvedStatus !== 'Under Repair' && nextServiceDate !== undefined) {
      if (nextServiceDate) {
        const { state } = computeServiceState(nextServiceDate);
        resolvedStatus = (state === 'Overdue' || state === 'Due') ? 'Service Due' : 'Active';
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(regNo !== undefined && { regNo }),
        ...(type !== undefined && { type }),
        ...(make !== undefined && { make }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year: Number(year) }),
        ...(fuelType !== undefined && { fuelType }),
        ...(mileage !== undefined && { mileage: Number(mileage) }),
        status: resolvedStatus,
        ...(nextServiceDate !== undefined && { nextServiceDate: nextServiceDate || null }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate || null }),
        ...(insuranceExpiry !== undefined && { insuranceExpiry: insuranceExpiry || null })
      }
    });

    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

app.delete('/api/vehicles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cascading delete handled by Prisma schema relations (onDelete: Cascade)
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
    const { vehicleReg, vehicleName, type, serviceDate, nextServiceDate, mileage, description, cost, status } = req.body;
    if (!vehicleReg || !description) {
      return res.status(400).json({ error: 'Vehicle registration and description are required' });
    }

    let resolvedVehicleName = vehicleName;
    const vehicle = await prisma.vehicle.findUnique({ where: { regNo: vehicleReg } });

    if (!vehicle) {
      return res.status(400).json({ error: `No vehicle found with registration ${vehicleReg}` });
    }

    if (!resolvedVehicleName) {
      resolvedVehicleName = `${vehicle.make} ${vehicle.model}`;
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        vehicleReg,
        vehicleName: resolvedVehicleName,
        type: type || 'Service',
        serviceDate: serviceDate || new Date().toISOString().split('T')[0],
        nextServiceDate: nextServiceDate || null,
        mileage: Number(mileage) || vehicle.mileage,
        description,
        cost: Number(cost) || 0,
        status: status || 'Completed'
      }
    });

    // Update vehicle mileage and nextServiceDate
    const updatedMileage = mileage ? Math.max(vehicle.mileage, Number(mileage)) : vehicle.mileage;
    await prisma.vehicle.update({
      where: { regNo: vehicleReg },
      data: {
        mileage: updatedMileage,
        ...(nextServiceDate ? { nextServiceDate } : {})
      }
    });

    // Sync vehicle status respecting Under Repair priority
    await syncVehicleStatus(vehicleReg);

    res.status(201).json(log);
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

app.put('/api/maintenance/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleName, type, serviceDate, nextServiceDate, mileage, description, cost, status } = req.body;

    const existingLog = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    const log = await prisma.maintenanceLog.update({
      where: { id },
      data: {
        ...(vehicleName !== undefined && { vehicleName }),
        ...(type !== undefined && { type }),
        ...(serviceDate !== undefined && { serviceDate }),
        ...(nextServiceDate !== undefined && { nextServiceDate: nextServiceDate || null }),
        ...(mileage !== undefined && { mileage: Number(mileage) }),
        ...(description !== undefined && { description }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(status !== undefined && { status })
      }
    });

    // If nextServiceDate or status updated, sync with vehicle
    if (nextServiceDate) {
      await prisma.vehicle.update({
        where: { regNo: log.vehicleReg },
        data: { nextServiceDate }
      });
    }

    await syncVehicleStatus(log.vehicleReg);

    res.json(log);
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
    const log = await prisma.maintenanceLog.delete({ where: { id } });
    // Sync vehicle status now that this log is removed
    await syncVehicleStatus(log.vehicleReg);
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
    const { partName, vehicleReg, quantity, replacementDate, cost } = req.body;
    if (!partName || !vehicleReg) {
      return res.status(400).json({ error: 'Part name and vehicle registration are required' });
    }

    // Verify vehicle exists (foreign key check)
    const vehicle = await prisma.vehicle.findUnique({ where: { regNo: vehicleReg } });
    if (!vehicle) {
      return res.status(400).json({ error: `No vehicle found with registration ${vehicleReg}` });
    }

    const part = await prisma.sparePart.create({
      data: {
        partName,
        vehicleReg,
        quantity: Number(quantity) || 1,
        replacementDate: replacementDate || new Date().toISOString().split('T')[0],
        cost: Number(cost) || 0
      }
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
    const { partName, vehicleReg, quantity, replacementDate, cost } = req.body;

    if (vehicleReg !== undefined) {
      const vehicle = await prisma.vehicle.findUnique({ where: { regNo: vehicleReg } });
      if (!vehicle) {
        return res.status(400).json({ error: `No vehicle found with registration ${vehicleReg}` });
      }
    }

    const part = await prisma.sparePart.update({
      where: { id },
      data: {
        ...(partName !== undefined && { partName }),
        ...(vehicleReg !== undefined && { vehicleReg }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(replacementDate !== undefined && { replacementDate }),
        ...(cost !== undefined && { cost: Number(cost) })
      }
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
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must not exceed 128 characters' });
    }

    // Always store new accounts with a hashed password; role defaults to USER regardless of submitted value
    const assignedRole = normalizeRole(role || 'USER');
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
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

// Global unhandled error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
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

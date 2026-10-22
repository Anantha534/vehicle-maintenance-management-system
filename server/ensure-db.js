import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

const initialVehicles = [
  {
    id: 'v1',
    regNo: 'TN01AB1234',
    type: 'Car',
    make: 'Hyundai',
    model: 'i20 Asta',
    year: 2022,
    fuelType: 'Petrol',
    mileage: 28500,
    status: 'Active',
    nextServiceDate: '2026-10-15',
    purchaseDate: '2022-03-10',
    insuranceExpiry: '2027-03-09'
  },
  {
    id: 'v2',
    regNo: 'TN09CD5678',
    type: 'Car',
    make: 'Maruti Suzuki',
    model: 'Swift ZXi',
    year: 2021,
    fuelType: 'Petrol',
    mileage: 42100,
    status: 'Service Due',
    nextServiceDate: '2026-09-20',
    purchaseDate: '2021-08-15',
    insuranceExpiry: '2027-08-14'
  },
  {
    id: 'v3',
    regNo: 'TN14EF9012',
    type: 'Scooter',
    make: 'Honda',
    model: 'Activa 6G',
    year: 2023,
    fuelType: 'Petrol',
    mileage: 14200,
    status: 'Active',
    nextServiceDate: '2026-11-05',
    purchaseDate: '2023-01-20',
    insuranceExpiry: '2028-01-19'
  },
  {
    id: 'v4',
    regNo: 'TN22GH3456',
    type: 'Scooter',
    make: 'TVS',
    model: 'Jupiter 125',
    year: 2022,
    fuelType: 'Petrol',
    mileage: 21800,
    status: 'Under Repair',
    nextServiceDate: '2026-09-25',
    purchaseDate: '2022-06-11',
    insuranceExpiry: '2027-06-10'
  },
  {
    id: 'v5',
    regNo: 'TN07JK7890',
    type: 'Car',
    make: 'Tata',
    model: 'Nexon EV',
    year: 2023,
    fuelType: 'Electric',
    mileage: 31000,
    status: 'Active',
    nextServiceDate: '2026-12-01',
    purchaseDate: '2023-05-04',
    insuranceExpiry: '2026-10-30'
  }
];

const initialMaintenanceLogs = [
  {
    id: 'm1',
    vehicleReg: 'TN09CD5678',
    vehicleName: 'Maruti Suzuki Swift ZXi',
    type: 'Service',
    serviceDate: '2026-03-10',
    nextServiceDate: '2026-09-20',
    mileage: 38000,
    description: 'Routine 40k km periodic service, engine oil change, oil filter replacement, brake pad inspection.',
    cost: 4850,
    status: 'Completed'
  },
  {
    id: 'm2',
    vehicleReg: 'TN22GH3456',
    vehicleName: 'TVS Jupiter 125',
    type: 'Repair',
    serviceDate: '2026-09-15',
    nextServiceDate: '2026-09-25',
    mileage: 21800,
    description: 'Clutch plate slipping issue and rear drum brake cable replacement.',
    cost: 2350,
    status: 'In Progress'
  },
  {
    id: 'm3',
    vehicleReg: 'TN01AB1234',
    vehicleName: 'Hyundai i20 Asta',
    type: 'Service',
    serviceDate: '2026-04-12',
    nextServiceDate: '2026-10-15',
    mileage: 24000,
    description: 'Wheel alignment, balancing, coolant top-up and AC filter cleaning.',
    cost: 3200,
    status: 'Completed'
  },
  {
    id: 'm4',
    vehicleReg: 'TN14EF9012',
    vehicleName: 'Honda Activa 6G',
    type: 'Service',
    serviceDate: '2026-05-18',
    nextServiceDate: '2026-11-05',
    mileage: 11500,
    description: 'Engine oil replacement, spark plug cleaning, drive belt check.',
    cost: 1150,
    status: 'Completed'
  },
  {
    id: 'm5',
    vehicleReg: 'TN07JK7890',
    vehicleName: 'Tata Nexon EV',
    type: 'Repair',
    serviceDate: '2026-06-22',
    nextServiceDate: '2026-12-01',
    mileage: 26500,
    description: '12V auxiliary battery replacement and software diagnostics update.',
    cost: 6500,
    status: 'Completed'
  }
];

const initialSpareParts = [
  {
    id: 'p1',
    partName: 'Synthetic Engine Oil 5W-30 (3.5L)',
    vehicleReg: 'TN09CD5678',
    quantity: 1,
    replacementDate: '2026-03-10',
    cost: 2450
  },
  {
    id: 'p2',
    partName: 'Front Brake Pads Set',
    vehicleReg: 'TN01AB1234',
    quantity: 1,
    replacementDate: '2025-11-14',
    cost: 2100
  },
  {
    id: 'p3',
    partName: 'Clutch Assembly Kit',
    vehicleReg: 'TN22GH3456',
    quantity: 1,
    replacementDate: '2026-09-15',
    cost: 1650
  },
  {
    id: 'p4',
    partName: 'Spark Plug NGK',
    vehicleReg: 'TN14EF9012',
    quantity: 1,
    replacementDate: '2026-05-18',
    cost: 280
  },
  {
    id: 'p5',
    partName: '12V Auxiliary Starter Battery',
    vehicleReg: 'TN07JK7890',
    quantity: 1,
    replacementDate: '2026-06-22',
    cost: 5800
  }
];

let isInitialized = false;
let initPromise = null;

export async function ensureDatabase(prisma) {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await prisma.user.findFirst();
      } catch (err) {
        console.log('[DB Auto-Init] User table not found, creating schema tables...');
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL,
            "username" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'USER',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
          );
          CREATE TABLE IF NOT EXISTS "Vehicle" (
            "id" TEXT NOT NULL,
            "regNo" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "make" TEXT NOT NULL,
            "model" TEXT NOT NULL,
            "year" INTEGER NOT NULL,
            "fuelType" TEXT NOT NULL,
            "mileage" INTEGER NOT NULL,
            "status" TEXT NOT NULL,
            "nextServiceDate" TEXT,
            "purchaseDate" TEXT,
            "insuranceExpiry" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
          );
          CREATE TABLE IF NOT EXISTS "MaintenanceLog" (
            "id" TEXT NOT NULL,
            "vehicleReg" TEXT NOT NULL,
            "vehicleName" TEXT,
            "type" TEXT NOT NULL,
            "serviceDate" TEXT NOT NULL,
            "nextServiceDate" TEXT,
            "mileage" INTEGER,
            "description" TEXT NOT NULL,
            "cost" DOUBLE PRECISION NOT NULL,
            "status" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
          );
          CREATE TABLE IF NOT EXISTS "SparePart" (
            "id" TEXT NOT NULL,
            "partName" TEXT NOT NULL,
            "vehicleReg" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL,
            "replacementDate" TEXT NOT NULL,
            "cost" DOUBLE PRECISION NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
          );
          CREATE TABLE IF NOT EXISTS "Session" (
            "id" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "username" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
          );
          CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
          CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_regNo_key" ON "Vehicle"("regNo");
          CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
        `);

        try {
          await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceLog_vehicleReg_fkey') THEN
                ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_vehicleReg_fkey" FOREIGN KEY ("vehicleReg") REFERENCES "Vehicle"("regNo") ON DELETE CASCADE ON UPDATE CASCADE;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SparePart_vehicleReg_fkey') THEN
                ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_vehicleReg_fkey" FOREIGN KEY ("vehicleReg") REFERENCES "Vehicle"("regNo") ON DELETE CASCADE ON UPDATE CASCADE;
              END IF;
            END $$;
          `);
        } catch (fkErr) {
          console.warn('[DB Auto-Init] FK warning:', fkErr.message);
        }
        console.log('[DB Auto-Init] Tables created successfully.');
      }

      // Check and seed users & initial dataset
      try {
        const adminExists = await prisma.user.findUnique({ where: { username: 'admin@fleet.edu' } });
        if (!adminExists) {
          console.log('[DB Auto-Init] Seeding admin user...');
          const adminHash = await bcrypt.hash('demo123', BCRYPT_ROUNDS);
          await prisma.user.create({
            data: {
              username: 'admin@fleet.edu',
              password: adminHash,
              name: 'System Admin',
              role: 'ADMIN'
            }
          });
          console.log('[DB Auto-Init] Admin user created.');
        }

        const userExists = await prisma.user.findUnique({ where: { username: 'user@fleet.edu' } });
        if (!userExists) {
          console.log('[DB Auto-Init] Seeding standard user...');
          const userHash = await bcrypt.hash('user123', BCRYPT_ROUNDS);
          await prisma.user.create({
            data: {
              username: 'user@fleet.edu',
              password: userHash,
              name: 'Staff Operator',
              role: 'USER'
            }
          });
        }

        const vehicleCount = await prisma.vehicle.count();
        if (vehicleCount === 0) {
          console.log('[DB Auto-Init] Seeding initial vehicle dataset...');
          for (const v of initialVehicles) {
            await prisma.vehicle.upsert({ where: { regNo: v.regNo }, update: v, create: v });
          }
          for (const m of initialMaintenanceLogs) {
            await prisma.maintenanceLog.upsert({ where: { id: m.id }, update: m, create: m });
          }
          for (const p of initialSpareParts) {
            await prisma.sparePart.upsert({ where: { id: p.id }, update: p, create: p });
          }
          console.log('[DB Auto-Init] Initial data seeded.');
        }
      } catch (seedErr) {
        console.error('[DB Auto-Init] Seeding error:', seedErr.message);
      }

      isInitialized = true;
    })();
  }
  return initPromise;
}

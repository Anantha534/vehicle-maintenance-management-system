import embeddedPostgres from 'embedded-postgres';
import net from 'net';

export async function isPgRunning(port = 5432) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

export async function ensurePostgres() {
  const running = await isPgRunning(5432);
  if (running) {
    console.log('PostgreSQL server is active on port 5432.');
    return;
  }

  console.log('Starting Embedded PostgreSQL server...');
  const pg = new embeddedPostgres({
    port: 5432,
    databaseDir: 'C:/Users/anant/.vehicle_pgdata',
    user: 'postgres',
    password: 'postgresPassword123',
    dbName: 'vehicle_db',
    persistent: true
  });

  try {
    await pg.initialise();
  } catch (err) {
    // Initialise note if already initialised
  }

  await pg.start();
  try {
    await pg.createDatabase('vehicle_db');
  } catch (err) {
    // Database may already exist
  }
  console.log('Embedded PostgreSQL running on postgresql://postgres:postgresPassword123@localhost:5432/vehicle_db');
}

// If run directly
if (process.argv[1]?.endsWith('start-pg.js')) {
  ensurePostgres().catch((err) => {
    console.error('Error starting PostgreSQL:', err);
  });
}

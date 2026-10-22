// Local development entry point only.
// On Vercel, api/index.js is used instead.
import app from './app.js';
import { ensurePostgres } from './start-pg.js';

const PORT = process.env.PORT || 5000;

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

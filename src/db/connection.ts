import pgPromise from 'pg-promise';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pgp = pgPromise({});

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Note: For production, consider proper SSL certificate validation
  },
});

export default db;
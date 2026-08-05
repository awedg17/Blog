import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Global pool for the application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Executes a SQL query against the database.
 * @param text The SQL query string.
 * @param params The parameters for the query.
 * @returns A promise that resolves with the query result.
 */
export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Optional: A way to get a client for transactions
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// The main object we'll interact with in other files, 
// keeping it similar to the original `db` object's methods.
const db = {
  query,
  getClient,
};

export default db;

// scripts/apply-schema.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Ensure .env.local is loaded
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function applySchema() {
  // 1. Validate DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('🔴 Error: DATABASE_URL is not set. Please check your .env.local file.');
    process.exit(1);
  }

  // 2. Read the schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  let schemaSql;
  try {
    schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('🔵 Read schema.sql file successfully.');
  } catch (err) {
    console.error(`🔴 Error: Failed to read schema file at ${schemaPath}`, err);
    process.exit(1);
  }

  // 3. Connect and execute
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  console.log('🔵 Connected to PostgreSQL.');

  try {
    console.log('🔵 Applying schema...');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('🔴 Error applying schema:', err);
    // Exit with a non-zero code to indicate failure
    process.exit(1); 
  } finally {
    client.release();
    await pool.end();
    console.log('🔵 Connection closed.');
  }
}

applySchema();

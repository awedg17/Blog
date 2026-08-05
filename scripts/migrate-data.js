// scripts/migrate-data.js
const path = require('path');
const { Pool } = require('pg');
const Database = require('better-sqlite3');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

async function migrate() {
  // --- Connect to SQLite ---
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'blog.db');
  let sqlite;
  try {
    sqlite = new Database(dbPath, { readonly: true });
    console.log('Connected to SQLite database.');
  } catch (err) {
    console.error('Failed to connect to SQLite. Make sure data/blog.db exists.');
    console.error('Error:', err.message);
    process.exit(1);
  }

  // --- Connect to PostgreSQL ---
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please check your .env file.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const pgClient = await pool.connect();
  console.log('Connected to PostgreSQL database.');

  try {
    console.log('\nStarting data migration...');

    // 1. Migrate admin
    console.log('Migrating admin table...');
    const admins = sqlite.prepare('SELECT * FROM admin').all();
    if (admins.length > 0) {
      for (const admin of admins) {
        await pgClient.query(
          'INSERT INTO admin (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = $2, password_hash = $3',
          [admin.id, admin.email, admin.password_hash]
        );
      }
      console.log(`  -> Migrated ${admins.length} admin user(s).`);
    } else {
      console.log('  -> No admin users found in SQLite to migrate.');
    }

    // 2. Migrate profile
    console.log('Migrating profile table...');
    const profile = sqlite.prepare('SELECT * FROM profile WHERE id = 1').get();
    if (profile) {
      await pgClient.query(
        `INSERT INTO profile (id, name, bio, avatar_url, linkedin_url, youtube_url, github_url, x_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         ON CONFLICT (id) DO UPDATE SET 
           name = $2, bio = $3, avatar_url = $4, linkedin_url = $5, youtube_url = $6, github_url = $7, x_url = $8`,
        [
          profile.id,
          profile.name,
          profile.bio,
          profile.avatar_url,
          profile.linkedin_url,
          profile.youtube_url,
          profile.github_url,
          profile.x_url,
        ]
      );
      console.log('  -> Migrated profile data.');
    } else {
      console.log('  -> No profile data found in SQLite to migrate.');
    }

    // 3. Migrate posts
    console.log('Migrating posts table...');
    const posts = sqlite.prepare('SELECT * FROM posts').all();
    if (posts.length > 0) {
      // Check for 'pinned' column, which might not exist in older schema
      const columns = Object.keys(posts[0]);
      const hasPinned = columns.includes('pinned');

      for (const post of posts) {
        await pgClient.query(
          `INSERT INTO posts (id, title, slug, excerpt, content, status, published_at, created_at, updated_at, pinned) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET 
             title = $2, slug = $3, excerpt = $4, content = $5, status = $6, 
             published_at = $7, created_at = $8, updated_at = $9, pinned = $10`,
          [
            post.id,
            post.title,
            post.slug,
            post.excerpt,
            post.content,
            post.status,
            post.published_at,
            post.created_at,
            post.updated_at,
            hasPinned ? !!post.pinned : false, // Convert 0/1 to boolean
          ]
        );
      }
      console.log(`  -> Migrated ${posts.length} post(s).`);
    } else {
      console.log('  -> No posts found in SQLite to migrate.');
    }

    // Reset sequence generators to avoid ID conflicts with new inserts
    await pgClient.query("SELECT setval('admin_id_seq', COALESCE((SELECT MAX(id) FROM admin), 1));");
    await pgClient.query("SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1));");
    console.log('  -> Sequence generators updated.');

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('\nAn error occurred during migration:', err);
  } finally {
    sqlite.close();
    pgClient.release();
    await pool.end();
    console.log('Connections closed.');
  }
}

migrate();

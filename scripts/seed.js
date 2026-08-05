// scripts/seed.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { slugify } = require('../src/lib/slug'); // using the same slugify function
require('dotenv').config();

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please check your .env file.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  console.log('Connected to PostgreSQL database for seeding.');

  try {
    // 1. Seed Admin
    const email = process.env.ADMIN_EMAIL || 'dewa@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'changeme123';
    const hash = bcrypt.hashSync(password, 10);

    const { rows: existingAdmins } = await client.query('SELECT id FROM admin WHERE email = $1', [email]);
    if (existingAdmins.length > 0) {
      await client.query('UPDATE admin SET password_hash = $1 WHERE email = $2', [hash, email]);
      console.log(`Updated admin password for ${email}`);
    } else {
      await client.query('INSERT INTO admin (email, password_hash) VALUES ($1, $2)', [email, hash]);
      console.log(`Created admin ${email}`);
    }

    // 2. Seed Profile (if not exists)
    const { rows: existingProfiles } = await client.query('SELECT id FROM profile WHERE id = 1');
    if (existingProfiles.length === 0) {
      await client.query(
        `INSERT INTO profile (id, name, bio, avatar_url, linkedin_url, youtube_url, github_url, x_url) 
         VALUES (1, 'Dewa', 'Hi, I''m Dewa. Informatics student at UNDIP.\n\nI write about programming, AI, and things I learn while building projects.', '/profile.jpeg', '#', '#', '#', '#')`
      );
      console.log('Created default profile.');
    } else {
      console.log('Profile already exists, skipping.');
    }

    // 3. Seed Posts (if table is empty)
    const { rows: postCountRows } = await client.query('SELECT COUNT(*) as c FROM posts');
    if (parseInt(postCountRows[0].c, 10) === 0) {
      console.log('Seeding demo posts...');
      const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
      const postsToInsert = [
        {
          title: "Making My First Post",
          excerpt: "Welcome to my digital garden.",
          content: "Welcome to my digital garden...",
          status: "published",
          published_at: daysAgo(60),
        },
        {
          title: "How to Use WebSockets in a Redux Application",
          excerpt: "Wiring up real-time updates with Redux middleware.",
          content: "## Introduction\n\nWebSockets pair naturally with Redux...",
          status: "published",
          published_at: daysAgo(30),
        },
        {
            title: "HTML Tables with Horizontal Scroll and Sticky Headers",
            slug: "html-tables-horizontal-scroll-sticky-headers",
            excerpt: "A CSS-only pattern for wide data tables.",
            content: "## Introduction\n\nWide tables need horizontal scroll...",
            status: "published",
            published_at: daysAgo(5),
        },
        {
          title: 'Making 3D Game, "Everwild"',
          excerpt: "",
          content: "## Introduction\n\nEarly notes on a 3D game project. Still a draft.",
          status: "draft",
          published_at: null,
        },
      ];

      for (const post of postsToInsert) {
        await client.query(
          `INSERT INTO posts (title, slug, excerpt, content, status, published_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [post.title, slugify(post.title), post.excerpt, post.content, post.status, post.published_at]
        );
      }
      console.log(`Seeded ${postsToInsert.length} demo posts.`);
    } else {
      console.log('Posts table is not empty, skipping post seeding.');
    }
    
    console.log('\nSeed completed successfully!');

  } catch (err) {
    console.error('\nAn error occurred during seeding:', err);
  } finally {
    client.release();
    await pool.end();
    console.log('Connections closed.');
  }
}

seed();

/* Seeds demo/sample posts only — never touches admin accounts. Run with: npm run seed */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "blog.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const count = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
if (count === 0) {
  const now = new Date().toISOString();
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const insert = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, status, published_at, created_at, updated_at)
    VALUES (@title, @slug, @excerpt, @content, @status, @published_at, @created_at, @updated_at)
  `);
  insert.run({
    title: "Making My First Post",
    slug: "making-my-first-post",
    excerpt: "Welcome to my digital garden.",
    content:
      "Welcome to my digital garden, where I share my journey into the world of software development.\n\n## Introduction\n\nIn this first post, I'll be exploring the fundamental concepts I've learned while navigating the Informatics program.\n\n## The Motivation\n\nThe spark for this blog came from a desire to bridge the gap between abstract academic theory and practical application.\n\n## The Learning Curve\n\nNavigating the core curriculum at Undip has been an intense experience.\n\n## Current Focus\n\nRight now, I am deep-diving into the world of cybersecurity.\n\n## Looking Ahead\n\nMoving forward, I plan to use this space to document the transition from theory to practice.",
    status: "published",
    published_at: daysAgo(60), // oldest of the three published demo posts
    created_at: now,
    updated_at: now,
  });
  insert.run({
    title: "How to Use WebSockets in a Redux Application",
    slug: "websockets-in-a-redux-application",
    excerpt: "Wiring up real-time updates with Redux middleware.",
    content:
      "## Introduction\n\nWebSockets pair naturally with Redux when you treat incoming messages as actions.\n\n## Setting Up the Middleware\n\nA custom middleware owns the socket connection and dispatches actions on message events.",
    status: "published",
    published_at: daysAgo(30),
    created_at: now,
    updated_at: now,
  });
  insert.run({
    title: "HTML Tables with Horizontal Scroll and Sticky Headers",
    slug: "html-tables-horizontal-scroll-sticky-headers",
    excerpt: "A CSS-only pattern for wide data tables.",
    content:
      "## Introduction\n\nWide tables need horizontal scroll without losing context of the header row.\n\n## The CSS\n\nUsing `position: sticky` on both axes keeps row and column headers pinned during scroll.",
    status: "published",
    published_at: daysAgo(5), // most recent of the three published demo posts
    created_at: now,
    updated_at: now,
  });
  insert.run({
    title: 'Making 3D Game, "Everwild",',
    slug: "making-3d-game-everwild",
    excerpt: "",
    content: "## Introduction\n\nEarly notes on a 3D game project. Still a draft.",
    status: "draft",
    published_at: null,
    created_at: now,
    updated_at: now,
  });
  console.log("Seeded demo posts");
}

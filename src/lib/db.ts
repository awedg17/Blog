import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "blog.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT 'Dewa',
    bio TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT NOT NULL DEFAULT '',
    youtube_url TEXT NOT NULL DEFAULT '',
    github_url TEXT NOT NULL DEFAULT '',
    x_url TEXT NOT NULL DEFAULT ''
  );
`);

// Migration: add `pinned` flag to posts created before this column existed.
const postsCols = db.prepare("PRAGMA table_info(posts)").all() as { name: string }[];
if (!postsCols.some((c) => c.name === "pinned")) {
  db.exec("ALTER TABLE posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
}

// ensure a single profile row exists
const profileRow = db.prepare("SELECT id FROM profile WHERE id = 1").get();
if (!profileRow) {
  db.prepare(
    `INSERT INTO profile (id, name, bio, avatar_url, linkedin_url, youtube_url, github_url, x_url)
     VALUES (1, 'Dewa', 'Hi, I''m Dewa. Informatics student at UNDIP.\n\nI write about programming, AI, and things I learn while building projects.', '', '#', '#', '#', '#')`
  ).run();
}

export default db;

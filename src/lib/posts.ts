import db from "./db";
import { slugify } from "./slug";

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  pinned: number; // 0 | 1 (SQLite has no boolean)
};

export function listPosts(): Post[] {
  // Pinned posts always first; within each group, most recently edited first.
  return db
    .prepare("SELECT * FROM posts ORDER BY pinned DESC, updated_at DESC")
    .all() as Post[];
}

export function listPublishedPosts(): Post[] {
  return db
    .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY pinned DESC, published_at DESC")
    .all() as Post[];
}

export function getPostBySlug(slug: string): Post | undefined {
  return db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug) as Post | undefined;
}

export function getPostById(id: number): Post | undefined {
  return db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post | undefined;
}

function uniqueSlug(base: string, ignoreId?: number): string {
  let candidate = base || "post";
  let i = 2;
  while (true) {
    const row = db.prepare("SELECT id FROM posts WHERE slug = ?").get(candidate) as
      | { id: number }
      | undefined;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export function createPost(input: { title: string; excerpt: string; content: string }): Post {
  const now = new Date().toISOString();
  const slug = uniqueSlug(slugify(input.title));
  const info = db
    .prepare(
      `INSERT INTO posts (title, slug, excerpt, content, status, published_at, created_at, updated_at)
       VALUES (@title, @slug, @excerpt, @content, 'draft', NULL, @created_at, @updated_at)`
    )
    .run({ title: input.title, slug, excerpt: input.excerpt, content: input.content, created_at: now, updated_at: now });
  return getPostById(Number(info.lastInsertRowid))!;
}

export function updatePost(
  id: number,
  input: { title: string; excerpt: string; content: string }
): Post | undefined {
  const existing = getPostById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const slug =
    existing.title === input.title ? existing.slug : uniqueSlug(slugify(input.title), id);
  db.prepare(
    `UPDATE posts SET title = @title, slug = @slug, excerpt = @excerpt, content = @content, updated_at = @updated_at
     WHERE id = @id`
  ).run({ id, title: input.title, slug, excerpt: input.excerpt, content: input.content, updated_at: now });
  return getPostById(id);
}

export function setPinned(id: number, pinned: boolean): Post | undefined {
  db.prepare("UPDATE posts SET pinned = @pinned WHERE id = @id").run({ id, pinned: pinned ? 1 : 0 });
  return getPostById(id);
}

export function deletePost(id: number): void {
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}

export function publishPost(id: number): Post | undefined {
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE posts SET status = 'published', published_at = COALESCE(published_at, @now), updated_at = @now WHERE id = @id"
  ).run({ id, now });
  return getPostById(id);
}

export function unpublishPost(id: number): Post | undefined {
  const now = new Date().toISOString();
  db.prepare("UPDATE posts SET status = 'draft', updated_at = @now WHERE id = @id").run({ id, now });
  return getPostById(id);
}

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
  pinned: boolean; // Changed from number to boolean
};

export async function listPosts(): Promise<Post[]> {
  const { rows } = await db.query(
    "SELECT * FROM posts ORDER BY pinned DESC, updated_at DESC"
  );
  return rows;
}

export async function listPublishedPosts(): Promise<Post[]> {
  const { rows } = await db.query(
    "SELECT * FROM posts WHERE status = 'published' ORDER BY pinned DESC, published_at DESC"
  );
  return rows;
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const { rows } = await db.query("SELECT * FROM posts WHERE slug = $1", [slug]);
  return rows[0];
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const { rows } = await db.query("SELECT * FROM posts WHERE id = $1", [id]);
  return rows[0];
}

async function isSlugUnique(slug: string, ignoreId?: number): Promise<boolean> {
    const { rows } = await db.query("SELECT id FROM posts WHERE slug = $1", [slug]);
    const row = rows[0];
    return !row || row.id === ignoreId;
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
    let candidate = base || "post";
    let i = 2;
    while (!(await isSlugUnique(candidate, ignoreId))) {
        candidate = `${base}-${i++}`;
    }
    return candidate;
}

export async function createPost(input: { title: string; excerpt: string; content: string }): Promise<Post> {
  const slug = await uniqueSlug(slugify(input.title));
  const { rows } = await db.query(
    `INSERT INTO posts (title, slug, excerpt, content, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING *`,
    [input.title, slug, input.excerpt, input.content]
  );
  return rows[0];
}

export async function updatePost(
  id: number,
  input: { title: string; excerpt: string; content: string }
): Promise<Post | undefined> {
  const existing = await getPostById(id);
  if (!existing) return undefined;
  
  const slug =
    existing.title === input.title ? existing.slug : await uniqueSlug(slugify(input.title), id);

  const { rows } = await db.query(
    `UPDATE posts SET title = $1, slug = $2, excerpt = $3, content = $4
     WHERE id = $5
     RETURNING *`,
    [input.title, slug, input.excerpt, input.content, id]
  );
  return rows[0];
}

export async function setPinned(id: number, pinned: boolean): Promise<Post | undefined> {
    const { rows } = await db.query(
        "UPDATE posts SET pinned = $1 WHERE id = $2 RETURNING *",
        [pinned, id]
    );
    return rows[0];
}

export async function deletePost(id: number): Promise<void> {
  await db.query("DELETE FROM posts WHERE id = $1", [id]);
}

export async function publishPost(id: number): Promise<Post | undefined> {
  const { rows } = await db.query(
    "UPDATE posts SET status = 'published', published_at = COALESCE(published_at, NOW()) WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0];
}

export async function unpublishPost(id: number): Promise<Post | undefined> {
  const { rows } = await db.query(
    "UPDATE posts SET status = 'draft' WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0];
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createPost, listPosts } from "@/lib/posts";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ posts: await listPosts() });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, excerpt, content } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const post = await createPost({ // Tambahkan 'await' di sini
    title: String(title).trim(),
    excerpt: String(excerpt || "").trim(),
    content: String(content || ""),
  });

  if (!post) { // Tambahkan cek ini
    console.error("Failed to create post in createPost function.");
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
  return NextResponse.json({ post }, { status: 201 });
}

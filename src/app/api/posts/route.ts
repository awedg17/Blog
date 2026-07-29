import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createPost, listPosts } from "@/lib/posts";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ posts: listPosts() });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, excerpt, content } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const post = createPost({
    title: String(title).trim(),
    excerpt: String(excerpt || "").trim(),
    content: String(content || ""),
  });
  return NextResponse.json({ post }, { status: 201 });
}

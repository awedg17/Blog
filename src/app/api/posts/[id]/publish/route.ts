import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { publishPost, unpublishPost } from "@/lib/posts";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({ action: "publish" }));
  const post =
    action === "unpublish" ? unpublishPost(Number(params.id)) : publishPost(Number(params.id));

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { publishPost, unpublishPost } from "@/lib/posts";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({ action: "publish" })); // Ambil action dari body

  let updatedPost = null;
  try {
    updatedPost = action === "unpublish" ? await unpublishPost(Number(params.id)) : await publishPost(Number(params.id));
  } catch (error: any) {
    console.error("Error updating post status:", error); // Log the error on the server
    return NextResponse.json({ error: "Failed to update post status." }, { status: 500 });
  }

  if (!updatedPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ post: updatedPost });
}

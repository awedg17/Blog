import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProfile, updateProfile } from "@/lib/profile";

export async function GET() {
  return NextResponse.json({ profile: getProfile() });
}

export async function PUT(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const profile = updateProfile({
    name: String(body.name || ""),
    bio: String(body.bio || ""),
    avatar_url: String(body.avatar_url || ""),
    linkedin_url: String(body.linkedin_url || "#"),
    youtube_url: String(body.youtube_url || "#"),
    github_url: String(body.github_url || "#"),
    x_url: String(body.x_url || "#"),
  });
  return NextResponse.json({ profile });
}

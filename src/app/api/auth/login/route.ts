import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email) as
    | { id: number; email: string; password_hash: string }
    | undefined;

  // Always compare against a hash (even a dummy one) to avoid timing leaks on unknown emails.
  const hashToCheck = admin?.password_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valid = await bcrypt.compare(password, hashToCheck);

  if (!admin || !valid) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  createSession(admin.id);
  return NextResponse.json({ ok: true });
}

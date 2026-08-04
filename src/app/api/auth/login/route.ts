import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email/username and password are required." }, { status: 400 });
  }

  const adminCount = (db.prepare("SELECT COUNT(*) as c FROM admin").get() as { c: number }).c;
  if (adminCount === 0) {
    return NextResponse.json(
      { error: "No admin account exists yet. Run `npm run create-admin` to create one." },
      { status: 400 }
    );
  }

  // `email` field accepts either an email or a username — same login box either way.
  const admin = db.prepare("SELECT * FROM admin WHERE email = ? OR username = ?").get(email, email) as
    | { id: number; email: string; password_hash: string }
    | undefined;

  // Always compare against a hash (even a dummy one) to avoid timing leaks on unknown accounts.
  const hashToCheck = admin?.password_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valid = await bcrypt.compare(password, hashToCheck);

  if (!admin || !valid) {
    return NextResponse.json({ error: "Incorrect email/username or password." }, { status: 401 });
  }

  createSession(admin.id);
  return NextResponse.json({ ok: true });
}

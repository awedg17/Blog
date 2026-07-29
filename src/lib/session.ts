import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me-in-env";
const COOKIE_NAME = "blog_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const ok =
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}

export function createSession(adminId: number) {
  const payload = JSON.stringify({ adminId, iat: Date.now() });
  const token = sign(Buffer.from(payload).toString("base64url"));
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export function getSession(): { adminId: number } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const value = verify(token);
  if (!value) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (Date.now() - payload.iat > MAX_AGE * 1000) return null;
    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}

/**
 * Middleware only checks that the cookie exists (edge-safe, cheap) — it
 * never verifies the signature/expiry. That let a stale/invalid cookie
 * through to admin pages, where the user could edit freely and only find
 * out on save (a 401 from the API, no redirect, nowhere to go). Call this
 * at the top of every admin server page to redirect to /login immediately
 * instead.
 */
export function requireSession(): { adminId: number } {
  const session = getSession();
  if (!session) redirect("/login");
  return session;
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.replace(searchParams.get("next") || "/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col gap-4"
      >
        <div>
          <h1 className="font-bold text-lg text-ink">Welcome back!</h1>
          <p className="text-sm text-muted mt-1">Sign in to manage your blog</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink">Email:</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-cream/60 px-3 py-2 text-sm outline-none focus:border-olive transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-ink">Password:</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-md border bg-cream/60 px-3 py-2 pr-9 text-sm outline-none transition-colors ${
                error ? "border-danger text-danger" : "border-border focus:border-olive"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {error && <span className="text-danger text-xs">{error}</span>}
        </label>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-cream hover:border-ink transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </main>
  );
}

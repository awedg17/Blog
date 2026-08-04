# Dewa's Blog

Self-hosted blog with a real backend (Next.js + SQLite) so you can create, edit, publish, and delete posts from the `/admin` dashboard — no code changes needed.

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:
- `SESSION_SECRET` — generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Then:

```bash
npm run create-admin   # interactive: username, email, password
npm run seed            # a few demo posts in data/blog.db (never touches admin accounts)
npm run dev              # http://localhost:3000
```

Sign in at `/login` with either your username or your email — both work with the same password.

To change your password later: `npm run reset-password`. Multiple admin accounts are supported — run `create-admin` again for another login.

## Pages

- `/` — public home page (Latest Post list + About me sidebar)
- `/post/[slug]` — public post detail with auto-generated Table of Contents (from `## headings` in your markdown)
- `/login` — admin sign in
- `/admin` — post list: Create New, Edit, Delete, Publish/Save as Draft
- `/admin/new`, `/admin/edit/[id]` — post editor (title, excerpt, markdown content)

## How editing works (the "backend")

Posts live in a SQLite database at `data/blog.db`, not in the code. `/admin` talks to API routes (`/api/posts/*`) that read and write that database, so publishing, editing, or deleting a post updates the live site immediately — nothing to redeploy.

## Design decisions carried over from the Figma file

- **Modals (Delete / Publish) rebuilt with flexbox + gap** instead of fixed-position children, since the original Figma frames for these weren't using auto layout and had inconsistent spacing. This keeps them consistent regardless of text length.
- **Edit/Delete/Publish buttons in the admin list** are icon-only by default and expand to show their label on hover (matches the "logo hover" behavior you asked for) — because they sit in a flex row with `gap`, neighboring buttons shift over automatically as one expands, no manual positioning needed.
- **Social links (LinkedIn/YouTube/GitHub/X)** just switch to the olive-green accent color on hover, per your note that the vertical list didn't need to shift.

## A note on this build

I wrote and reviewed all the source in this project and it type-checks cleanly (`npx tsc --noEmit` passes with zero errors). I wasn't able to get a full `npm run build` to finish inside my sandboxed working environment — repeated `npm install` runs there kept producing corrupted native binaries (Next's SWC compiler crashing with a bus error) due to instability specific to that sandbox, not your machine. This should install and build normally in a regular Node environment; if `npm install` on your machine ever throws an `ENOTEMPTY` error mid-install, just delete `node_modules` and re-run it — that's a known npm hiccup, not something wrong with the project.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · better-sqlite3 · bcryptjs · marked (markdown → HTML)

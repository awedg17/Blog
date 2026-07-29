/**
 * Replaces ALL posts with two rich demo articles that exercise every editor
 * feature: headings (H1-H3), paragraphs, numbered lists, code blocks with
 * filenames, and images.
 *
 * Run: npm run seed:articles
 */
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(process.cwd(), "data", "blog.db"));
db.pragma("journal_mode = WAL");

// Ensure the pinned column exists (same migration as src/lib/db.ts).
const cols = db.prepare("PRAGMA table_info(posts)").all();
if (!cols.some((c) => c.name === "pinned")) {
  db.exec("ALTER TABLE posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
}

const article1 = `Ketika pertama kali membangun REST API dengan Next.js, saya mengira route handler hanyalah pengganti Express yang lebih sederhana. Ternyata ada beberapa perbedaan fundamental yang baru saya sadari setelah beberapa kali tersandung bug yang sama.

Artikel ini merangkum apa yang saya pelajari selama membangun API untuk blog ini: mulai dari struktur folder, autentikasi berbasis cookie, sampai kesalahan umum yang sebaiknya kamu hindari.

## Kenapa Route Handler, Bukan Express?

Next.js App Router memperkenalkan route handler sebagai cara standar membuat endpoint API. Tidak perlu server terpisah, tidak perlu konfigurasi CORS untuk konsumsi internal, dan deployment-nya menyatu dengan aplikasi frontend.

Ada tiga alasan utama saya memilih pendekatan ini:

1. Satu codebase untuk frontend dan backend, jadi tipe data bisa dibagi lewat import biasa tanpa perlu monorepo tooling.

2. Route handler berjalan per-request tanpa state global, sehingga tidak ada masalah memory leak dari middleware yang menumpuk.

3. Deployment sederhana — satu perintah build, satu proses server.

## Struktur Endpoint yang Saya Pakai

Konvensinya sederhana: satu folder per resource, dengan file route.ts di dalamnya. Berikut handler untuk daftar artikel:

\`\`\`typescript:route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createPost, listPosts } from "@/lib/posts";

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ posts: listPosts() });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
\`\`\`

Perhatikan pola yang berulang: cek sesi dulu, validasi input, baru sentuh database. Urutan ini penting — validasi sebelum autentikasi berarti kamu membocorkan informasi struktur API ke pengguna anonim.

### Autentikasi dengan Cookie yang Ditandatangani

Saya tidak memakai library auth eksternal. Untuk blog dengan satu admin, cookie HMAC-signed sudah lebih dari cukup:

\`\`\`typescript:session.ts
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;

function sign(value) {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return value + "." + hmac;
}

function verify(signed) {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const ok = sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}
\`\`\`

Kuncinya ada di timingSafeEqual — perbandingan string biasa bisa dieksploitasi lewat timing attack, di mana penyerang mengukur berapa lama server merespons untuk menebak signature karakter demi karakter.

![](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80)

## Tiga Kesalahan yang Pernah Saya Buat

Bagian ini yang paling penting. Semua kesalahan di bawah pernah benar-benar terjadi di project ini.

1. Lupa memanggil save sebelum publish. Tombol publish saya hanya mengirim aksi publish tanpa menyimpan perubahan konten terlebih dahulu, jadi artikel terbit dengan versi lama.

2. Mengandalkan cache router Next.js. Setelah navigasi kembali ke halaman daftar, data lama masih tampil karena client-side router cache. Solusinya panggil router.refresh() setelah mutasi.

3. Menyimpan secret di source code sebagai fallback. Fallback default untuk SESSION_SECRET terlihat tidak berbahaya saat development, tapi satu kali lupa set environment variable di production, semua cookie bisa dipalsukan.

### Penutup

Route handler Next.js cukup untuk API skala kecil sampai menengah. Kamu kehilangan beberapa kenyamanan Express seperti middleware chaining, tapi mendapat integrasi penuh dengan React Server Components. Untuk blog pribadi, trade-off-nya jelas menguntungkan.`;

const article2 = `Ketika mendesain blog ini, saya menghabiskan waktu paling banyak bukan di React, tapi di Tailwind — mencoba memahami kenapa desain yang sama bisa terasa mahal di satu website dan murahan di website lain. Jawabannya hampir selalu: spacing, typography, dan warna yang konsisten.

## Sistem Warna: Empat Warna Cukup

Blog ini hanya memakai empat warna semantik. Semuanya didefinisikan sebagai token di konfigurasi Tailwind, bukan hardcoded di setiap komponen:

\`\`\`javascript:tailwind.config.js
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F0",
        ink: "#2B2B26",
        olive: "#6B7A3F",
        muted: "#8A8778",
        border: "#DDD8CB",
        danger: "#C0392B",
      },
    },
  },
};
\`\`\`

Manfaat terbesarnya terasa saat refactoring: mengganti satu nilai hex di config mengubah seluruh aplikasi. Tidak ada lagi mencari-ganti #FAF7F0 di puluhan file.

### Kenapa Bukan CSS Variables Langsung?

Tailwind token tetap dikompilasi menjadi CSS biasa, tapi kamu mendapat autocomplete di editor dan pemeriksaan typo gratis. Menulis bg-crem akan langsung terlihat salah karena tidak menghasilkan style apa pun.

![](https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80)

## Typography: Hierarki Lewat Ukuran dan Berat

Saya memakai skala yang ketat untuk heading. Aturannya:

1. Heading 1 hanya untuk judul halaman — text-4xl dengan font-extrabold, satu per halaman.

2. Heading 2 untuk seksi utama artikel — text-2xl dengan font-bold.

3. Heading 3 untuk sub-seksi — text-xl, masih bold tapi jelas subordinat.

4. Body text tetap di text-sm atau text-base dengan line-height longgar untuk kenyamanan membaca artikel panjang.

Konsistensi ini yang membuat halaman terasa dirancang, bukan dirakit.

## Komponen Interaktif: Animasi Kecil, Efek Besar

Detail favorit saya di blog ini adalah tombol aksi yang melebar saat hover. Idle hanya ikon; hover memunculkan label dengan transisi width:

\`\`\`typescriptreact:HoverActionButton.tsx
export default function HoverActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group inline-flex items-center gap-1.5 overflow-hidden
        rounded-md border border-transparent px-2 py-1.5
        transition-colors hover:bg-[#E7E2D9]"
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="max-w-0 whitespace-nowrap text-sm font-medium
        opacity-0 transition-all duration-200
        group-hover:max-w-[6rem] group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
\`\`\`

Triknya: animasikan max-width, bukan width. CSS tidak bisa men-transisikan width dari auto, tapi max-width dari 0 ke nilai tetap berjalan mulus.

### Utility CSS untuk Kasus Khusus

Beberapa hal tetap lebih bersih ditulis sebagai CSS biasa, misalnya placeholder untuk code editor:

\`\`\`css:globals.css
.code-editor-pre textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.code-editor-pre textarea {
  outline: none;
}
\`\`\`

Aturan praktisnya: kalau selector butuh pseudo-element atau menembus library pihak ketiga, tulis CSS biasa. Sisanya, utility class.

## Penutup

Desain yang baik di web bukan soal dekorasi, tapi soal sistem: token warna yang dipaksakan konsisten, skala typography yang tidak dilanggar, dan animasi yang punya alasan. Tailwind tidak otomatis memberimu itu — dia hanya membuat sistemmu lebih mudah ditegakkan.`;

const now = new Date();
const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3); // 3 days ago

const posts = [
  {
    title: "Membangun REST API dengan Next.js Route Handler",
    slug: "membangun-rest-api-dengan-nextjs-route-handler",
    excerpt:
      "Pelajaran dari membangun API blog ini: struktur endpoint, autentikasi cookie HMAC, dan tiga kesalahan yang sebaiknya kamu hindari.",
    content: article1,
    published_at: earlier.toISOString(),
    created_at: earlier.toISOString(),
    updated_at: earlier.toISOString(),
  },
  {
    title: "Desain Sistem Warna dan Typography dengan Tailwind CSS",
    slug: "desain-sistem-warna-dan-typography-dengan-tailwind-css",
    excerpt:
      "Empat warna, skala heading yang ketat, dan animasi max-width: sistem desain kecil yang membuat blog terasa dirancang, bukan dirakit.",
    content: article2,
    published_at: now.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
];

const insert = db.prepare(
  `INSERT INTO posts (title, slug, excerpt, content, status, published_at, created_at, updated_at, pinned)
   VALUES (@title, @slug, @excerpt, @content, 'published', @published_at, @created_at, @updated_at, 0)`
);

const replaceAll = db.transaction(() => {
  db.prepare("DELETE FROM posts").run();
  for (const p of posts) insert.run(p);
});
replaceAll();

console.log("Done. Posts now in database:");
for (const row of db.prepare("SELECT id, title, status FROM posts").all()) {
  console.log(`  [${row.id}] ${row.title} (${row.status})`);
}

/**
 * Adds dummy published articles (without touching existing posts) until the
 * total post count reaches 15 — used to have enough data to test pagination,
 * sort, filter, and search on the homepage.
 *
 * Run: node scripts/seed-more-articles.js
 */
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(process.cwd(), "data", "blog.db"));
db.pragma("journal_mode = WAL");

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const TARGET_TOTAL = 15;

const IMAGES = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
  "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80",
];

const DUMMY_ARTICLES = [
  {
    title: "Migrasi dari Pages Router ke App Router",
    excerpt: "Catatan praktis pindah dari pages/ ke app/: apa yang berubah, apa yang rusak, dan urutan migrasi yang aman.",
    body: "Migrasi bertahap ternyata lebih aman daripada big-bang rewrite. Saya pindahkan satu route sekaligus sambil kedua router hidup berdampingan.\n\n1. Pindahkan halaman statis dulu, baru yang punya data fetching.\n\n2. Ganti getServerSideProps dengan async Server Component.\n\n3. Terakhir baru sentuh API routes, karena itu yang paling banyak dipakai fitur lain.",
  },
  {
    title: "Belajar Server Actions dari Nol",
    excerpt: "Server Actions menghilangkan boilerplate fetch untuk mutasi form, tapi ada beberapa jebakan yang baru saya sadari belakangan.",
    body: "Awalnya saya kira Server Actions cuma syntactic sugar di atas route handler. Ternyata modelnya benar-benar beda soal revalidation dan error handling.\n\n1. progressive enhancement gratis kalau form tetap pakai action prop native.\n\n2. Error dari action tidak otomatis muncul di UI, harus di-throw dan ditangkap manual.",
  },
  {
    title: "Kenapa Saya Pindah dari Prisma ke better-sqlite3",
    excerpt: "Untuk blog pribadi dengan satu admin, ORM besar terasa berlebihan. SQL mentah justru lebih gampang di-debug.",
    body: "Prisma bagus untuk tim besar dengan skema yang sering berubah, tapi untuk proyek kecil generate step-nya jadi friksi tersendiri setiap kali develop.\n\n1. Tidak ada build step tambahan sebelum dev server jalan.\n\n2. Query SQL yang eksplisit lebih gampang di-profile langsung dari log.",
  },
  {
    title: "Menangani Cookie Session Tanpa Library Auth",
    excerpt: "Untuk satu akun admin, HMAC-signed cookie sudah cukup aman — tidak perlu NextAuth atau library sejenis.",
    body: "Kompleksitas library auth kebanyakan untuk menangani multi-provider dan multi-user. Blog dengan satu admin tidak butuh itu semua.\n\n1. Signature HMAC mencegah cookie dipalsukan tanpa tahu secret.\n\n2. timingSafeEqual wajib dipakai supaya perbandingan signature tidak bocor lewat timing attack.",
  },
  {
    title: "Optimasi Gambar di Blog Tanpa next/image",
    excerpt: "Karena gambar disimpan sebagai URL eksternal, saya pilih <img> polos dengan beberapa aturan manual alih-alih next/image.",
    body: "next/image butuh domain gambar didaftarkan di config, yang merepotkan kalau pembaca bisa menempel URL gambar dari mana saja.\n\n1. Lazy-load hanya untuk gambar di luar viewport awal.\n\n2. Ukuran thumbnail dibatasi lewat class Tailwind, bukan resize di server.",
  },
  {
    title: "Struktur Folder untuk Blog Kecil",
    excerpt: "Tidak semua proyek butuh feature-based folder. Untuk blog dengan sedikit fitur, pemisahan per layer justru lebih jelas.",
    body: "Saya sempat coba struktur feature-based, tapi untuk proyek sekecil ini malah lebih sering pindah-pindah folder daripada nulis kode.\n\n1. lib/ untuk semua logic yang tidak bergantung pada request.\n\n2. components/ untuk semua yang render UI, tanpa dipisah per fitur.",
  },
  {
    title: "Debugging Hydration Mismatch di Next.js",
    excerpt: "Error 'text content does not match' hampir selalu berarti ada nilai yang beda antara server dan client — ini cara saya melacaknya.",
    body: "Penyebab paling sering: memakai Date.now() atau Math.random() langsung di render tanpa suppressHydrationWarning.\n\n1. Cek dulu apakah nilainya benar-benar butuh berbeda per render, atau seharusnya stabil.\n\n2. Kalau memang harus beda (misalnya waktu relatif), bungkus dengan suppressHydrationWarning di elemen itu saja.",
  },
  {
    title: "Menulis Markdown Renderer Sendiri vs Pakai Library",
    excerpt: "Saya tetap pakai marked untuk parsing, tapi renderer kustom untuk code block dan heading ID ternyata tidak sesulit dugaan awal.",
    body: "Library markdown umumnya sudah cukup untuk kasus standar, override renderer hanya diperlukan untuk kebutuhan spesifik seperti filename di atas code block.\n\n1. Override renderer.code untuk syntax highlighting dan header filename.\n\n2. Override renderer.heading untuk slug ID yang dipakai table of contents.",
  },
  {
    title: "Pengalaman Pertama Pakai Tailwind di Proyek Production",
    excerpt: "Awalnya skeptis karena class menumpuk panjang, tapi setelah beberapa minggu justru lebih cepat dibanding CSS module.",
    body: "Kekhawatiran utama saya soal keterbacaan class yang panjang ternyata teratasi dengan konsisten memakai urutan: layout, spacing, warna, lalu state.\n\n1. Ekstrak ke komponen begitu sebuah kombinasi class dipakai lebih dari dua kali.\n\n2. Warna dan spacing tetap didefinisikan lewat token config, bukan nilai arbitrary di class.",
  },
  {
    title: "Kapan Harus Pakai Server Component vs Client Component",
    excerpt: "Aturan sederhana yang saya pakai: mulai dari Server Component, baru turun ke Client Component kalau butuh interaktivitas.",
    body: "Kebalikan dari kebiasaan lama di Pages Router yang semuanya client-rendered, App Router lebih enak dipakai kalau defaultnya server dulu.\n\n1. Kalau butuh useState, useEffect, atau event handler browser, baru tambahkan 'use client'.\n\n2. Data fetching sebisa mungkin tetap di Server Component supaya tidak ada waterfall di client.",
  },
  {
    title: "Menangani Error Boundary di App Router",
    excerpt: "File error.tsx per-segment ternyata lebih fleksibel dibanding satu error boundary global di top level.",
    body: "Error boundary per segmen berarti satu bagian halaman bisa gagal tanpa menjatuhkan seluruh aplikasi.\n\n1. error.tsx wajib jadi Client Component karena butuh reset function dari React.\n\n2. Taruh error.tsx di level segmen yang paling mungkin gagal, misalnya dekat data fetching.",
  },
  {
    title: "Menulis Middleware yang Cepat di Next.js",
    excerpt: "Middleware berjalan di Edge Runtime untuk setiap request, jadi logic berat di sana bisa terasa di semua halaman.",
    body: "Saya sempat taruh verifikasi signature penuh di middleware, ternyata itu duplikasi kerja yang sudah dilakukan lagi di setiap halaman admin.\n\n1. Middleware cukup cek keberadaan cookie, bukan verifikasi penuh.\n\n2. Verifikasi signature penuh tetap dilakukan di server page, karena itu yang benar-benar butuh kepastian.",
  },
  {
    title: "Refactor Modal Konfirmasi Jadi Satu Komponen",
    excerpt: "Awalnya tiga modal (delete, publish, unsaved changes) ditulis terpisah dengan logic yang mirip. Saya satukan jadi satu shared shape.",
    body: "Duplikasi paling kentara ada di overlay, animasi buka-tutup, dan tombol cancel/confirm — hanya isi dan warna tombol yang beda.\n\n1. Props action untuk teks dan warna tombol konfirmasi.\n\n2. Overlay dan animasi ditulis sekali di komponen dasar, dipakai ulang oleh ketiganya.",
  },
];

const cols = db.prepare("PRAGMA table_info(posts)").all();
if (!cols.some((c) => c.name === "pinned")) {
  db.exec("ALTER TABLE posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
}

const existing = db.prepare("SELECT COUNT(*) AS n FROM posts").get().n;
const needed = Math.max(0, TARGET_TOTAL - existing);

if (needed === 0) {
  console.log(`Already have ${existing} posts (>= ${TARGET_TOTAL}), nothing to add.`);
  process.exit(0);
}

const insert = db.prepare(
  `INSERT INTO posts (title, slug, excerpt, content, status, published_at, created_at, updated_at, pinned)
   VALUES (@title, @slug, @excerpt, @content, 'published', @published_at, @created_at, @updated_at, @pinned)`
);
const existingSlug = db.prepare("SELECT 1 FROM posts WHERE slug = ?");

const now = Date.now();
const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});

const toInsert = [];
for (let i = 0; i < needed; i += 1) {
  const article = DUMMY_ARTICLES[i % DUMMY_ARTICLES.length];
  const title = i < DUMMY_ARTICLES.length ? article.title : `${article.title} (${Math.floor(i / DUMMY_ARTICLES.length) + 1})`;
  let slug = slugify(title);
  let suffix = 2;
  while (existingSlug.get(slug) || toInsert.some((p) => p.slug === slug)) {
    slug = `${slugify(title)}-${suffix++}`;
  }
  // Spread published dates over the past ~30 days, most recent last.
  const daysAgo = needed - i;
  const publishedAt = new Date(now - daysAgo * 1000 * 60 * 60 * 24).toISOString();
  const image = IMAGES[i % IMAGES.length];
  toInsert.push({
    title,
    slug,
    excerpt: article.excerpt,
    content: `${article.body}\n\n![](${image})`,
    published_at: publishedAt,
    created_at: publishedAt,
    updated_at: publishedAt,
    pinned: i === needed - 1 || i === needed - 4 ? 1 : 0,
  });
}

insertMany(toInsert);

console.log(`Added ${toInsert.length} dummy articles. Posts now in database:`);
for (const row of db.prepare("SELECT id, title, status, pinned FROM posts ORDER BY published_at").all()) {
  console.log(`  [${row.id}]${row.pinned ? " *" : "  "} ${row.title} (${row.status})`);
}

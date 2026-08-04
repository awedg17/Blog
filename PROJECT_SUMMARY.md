# Dewa's Blog — Project Summary

Dokumentasi ringkas hasil analisis source code project "Dewa's Blog": blog personal full-stack yang dibangun dengan Next.js 14 (App Router), TypeScript, Tailwind CSS, dan SQLite.

---

## 1. Tujuan Project

Dewa's Blog dibuat sebagai media belajar full-stack development selama program magang, bukan sebagai produk komersial. Sebelum project ini, penulis belum pernah membuat aplikasi yang punya frontend dan backend sekaligus.

Tujuan utamanya:
- Belajar mengubah desain (Figma) menjadi halaman website yang berfungsi penuh.
- Belajar membangun backend sederhana dan menghubungkannya ke database nyata (bukan data statis di kode).
- Belajar membuat sistem autentikasi (login admin) dari nol.
- Belajar menerapkan CRUD (Create, Read, Update, Delete) secara utuh pada satu entitas (artikel/post).
- Praktik debugging: menemukan bug nyata, menganalisis penyebabnya, dan memperbaikinya.

Fungsionalitas akhirnya: pengunjung publik bisa membaca daftar dan isi artikel, sementara admin (satu akun, login manual) bisa membuat, mengedit, menerbitkan, menghapus, dan menandai (pin) artikel lewat dashboard `/admin` — semua perubahan langsung berlaku tanpa perlu redeploy kode.

---

## 2. Struktur Folder

```
src/
├── app/
│   ├── page.tsx                     # Homepage publik (daftar artikel + about sidebar)
│   ├── layout.tsx                   # Root layout, font, metadata
│   ├── globals.css
│   ├── login/page.tsx               # Halaman login admin
│   ├── post/[slug]/page.tsx         # Halaman baca artikel publik
│   ├── admin/
│   │   ├── page.tsx                 # Redirect ke /admin/posts
│   │   ├── posts/page.tsx           # Daftar artikel (admin)
│   │   ├── posts/new/page.tsx       # Form artikel baru
│   │   └── posts/[id]/edit/page.tsx # Form edit artikel
│   └── api/
│       ├── auth/login/route.ts      # POST login
│       ├── auth/logout/route.ts     # POST logout
│       ├── posts/route.ts           # GET (list), POST (create)
│       ├── posts/[id]/route.ts      # GET, PUT, PATCH, DELETE
│       ├── posts/[id]/publish/route.ts  # POST publish/unpublish
│       └── profile/route.ts         # GET (publik), PUT (auth)
│
├── components/
│   ├── AdminPostList.tsx    # UI daftar artikel admin (search, sort, filter, aksi)
│   ├── PostEditor.tsx       # Wrapper editor: title/excerpt, save/publish, unsaved-changes guard
│   ├── BlockEditor.tsx      # Editor konten berbasis blok (terbesar, ~840 baris)
│   ├── Modal.tsx            # Shell modal generik (flexbox + gap)
│   ├── DeleteModal.tsx      # Konfirmasi hapus artikel
│   ├── PublishModal.tsx     # Konfirmasi terbitkan/simpan draft
│   ├── UnsavedChangesModal.tsx  # Konfirmasi keluar tanpa simpan
│   ├── HoverActionButton.tsx    # Tombol icon-only yang expand saat hover
│   ├── SocialLinks.tsx      # Daftar link sosial (LinkedIn, YouTube, GitHub, X)
│   ├── TableOfContents.tsx  # Sidebar TOC dengan scroll-spy
│   └── icons.tsx            # Kumpulan SVG icon inline
│
└── lib/
    ├── db.ts               # Koneksi SQLite + skema tabel + migrasi inline
    ├── posts.ts            # Semua operasi CRUD & query artikel
    ├── profile.ts           # Get/update profil "About me"
    ├── session.ts           # Signed-cookie session (login, verifikasi, logout)
    ├── slug.ts              # slugify(), formatDate(), timeAgo(), realUrl()
    ├── markdown.ts           # Render markdown → HTML, ekstraksi TOC, syntax highlight
    ├── blocks.ts             # Konversi block array ↔ markdown string
    └── detectLanguage.ts     # Deteksi bahasa pemrograman untuk syntax highlight

scripts/
├── seed.js            # Membuat akun admin + 4 artikel demo awal
└── seed-articles.js   # Mengganti semua artikel dengan 2 artikel demo yang kaya fitur

middleware.ts           # Proteksi rute /admin di level edge (cek keberadaan cookie)
data/blog.db             # File database SQLite
Figma Design/            # Aset desain (PDF/SVG) untuk tiap halaman
```

---

## 3. Flow Aplikasi

**Alur pengunjung (publik):**
1. Buka `/` → Server Component mengambil daftar artikel published (`listPublishedPosts()`) dan data profil (`getProfile()`) langsung dari database.
2. Klik salah satu artikel → masuk ke `/post/[slug]`.
3. Jika artikel tidak ditemukan atau belum published → halaman 404 (`notFound()`).
4. Konten artikel (markdown) dirender jadi HTML, lengkap dengan Table of Contents otomatis dari heading `##`.

**Alur admin:**
1. Buka `/admin/*` tanpa login → `middleware.ts` mengecek keberadaan cookie sesi → jika tidak ada, redirect ke `/login?next=<path>`.
2. Login dengan email & password → `POST /api/auth/login` → password dicocokkan dengan hash di database (bcrypt) → jika valid, cookie sesi dibuat.
3. Setelah login berhasil, diarahkan kembali ke halaman yang tadinya dituju (`next`), lalu `/admin` redirect ke `/admin/posts`.
4. Di `/admin/posts`, admin bisa: cari, sortir, filter status artikel, lalu Create New / Edit / Delete / Publish-Unpublish / Pin.
5. Form artikel (`/admin/posts/new` atau `/admin/posts/[id]/edit`) memakai `PostEditor` + `BlockEditor` untuk menulis konten dalam bentuk blok (heading, paragraf, list, kode, gambar, video).
6. Simpan sebagai draft (PUT/POST ke `/api/posts[/id]`) atau langsung Publish (memicu save dulu, baru memanggil `/api/posts/[id]/publish`).
7. Setiap halaman admin juga memanggil `requireSession()` sebagai lapis verifikasi kedua (lihat bagian Auth).

---

## 4. Database

Database: SQLite (`data/blog.db`), diakses lewat `better-sqlite3` tanpa ORM. Skema dibuat otomatis saat aplikasi start (`CREATE TABLE IF NOT EXISTS`) di `src/lib/db.ts`.

**3 tabel:**

```sql
admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
)

posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'published'
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0        -- ditambahkan via migrasi
)

profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),   -- singleton, hanya 1 baris
  name TEXT NOT NULL DEFAULT 'Dewa',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  x_url TEXT NOT NULL DEFAULT ''
)
```

Catatan penting:
- Tidak ada foreign key antar tabel — desainnya sengaja single-admin & single-profile.
- **Migrasi sederhana**: saat startup, `db.ts` mengecek `PRAGMA table_info(posts)` dan menjalankan `ALTER TABLE posts ADD COLUMN pinned ...` jika kolom itu belum ada. Ini satu-satunya mekanisme migrasi (tidak pakai Prisma/Drizzle atau migration framework).
- `journal_mode = WAL` diaktifkan (terkonfirmasi lewat `db.pragma("journal_mode = WAL")` dan keberadaan file `blog.db-wal` / `blog.db-shm`).
- Akun admin dikelola terpisah dari seed lewat `npm run create-admin` (interaktif: username, email, password) dan `npm run reset-password`. Mendukung banyak admin sekaligus, username dan email sama-sama unique. `npm run seed` sekarang cuma isi 4 artikel demo, tidak pernah menyentuh tabel admin.
- Login di `/login` menerima username ATAU email di field yang sama (`WHERE email = ? OR username = ?`), password sama untuk keduanya. Pesan error tetap generik, tidak membocorkan mana yang salah (email/username vs password).

---

## 5. Autentikasi

Autentikasi dibangun manual, tanpa library seperti NextAuth. Implementasi utama di `src/lib/session.ts`.

**Cara kerja:**
1. Admin login dengan email + password → dicocokkan ke `admin.password_hash` pakai `bcrypt.compare()`.
2. Untuk mencegah kebocoran info lewat waktu respons (timing attack), jika email tidak ditemukan, sistem tetap menjalankan `bcrypt.compare()` terhadap hash dummy — jadi waktu respons tetap konsisten.
3. Jika valid, dibuat **session cookie** berisi `{adminId, iat}` yang di-encode base64url lalu ditandatangani dengan HMAC-SHA256 (`SESSION_SECRET` dari env). Verifikasi tanda tangan pakai `crypto.timingSafeEqual` (bukan `===` biasa) untuk alasan keamanan yang sama.
4. Cookie (`blog_session`) diset `httpOnly`, `sameSite: lax`, `secure` hanya di production, masa berlaku 7 hari.

**Proteksi dua lapis (hasil dari bug yang pernah ditemukan):**
- **Lapis 1 — Middleware** (`middleware.ts`, edge runtime): hanya mengecek *apakah cookie ada*, tidak memverifikasi validitasnya (karena verifikasi HMAC dianggap terlalu berat untuk dijalankan di edge). Kalau tidak ada cookie, redirect ke `/login`.
- **Lapis 2 — `requireSession()`**: dipanggil di setiap halaman admin (server component) untuk benar-benar memverifikasi tanda tangan dan masa berlaku cookie. Jika tidak valid, redirect ke `/login` dari sisi server.
- **Lapis 3 — API routes**: setiap endpoint yang butuh auth (`/api/posts/*`, `PUT /api/profile`) memanggil `getSession()` sendiri dan mengembalikan `401 Unauthorized` jika sesi tidak valid — independen dari middleware maupun halaman.

Desain dua-lapis (middleware + requireSession) ini bukan kebetulan — ini adalah hasil perbaikan dari bug nyata yang ditemukan (lihat bagian Bug).

---

## 6. Fitur CRUD

Seluruh operasi CRUD untuk artikel diimplementasikan di `src/lib/posts.ts` dan diekspos lewat API routes.

| Operasi | Fungsi | Endpoint | Catatan |
|---|---|---|---|
| Create | `createPost()` | `POST /api/posts` | Slug otomatis dari title, dengan penanganan duplikat (`-2`, `-3`, dst) |
| Read | `listPosts()`, `listPublishedPosts()`, `getPostBySlug()`, `getPostById()` | `GET /api/posts`, `GET /api/posts/[id]` | Admin lihat semua status; publik hanya yang `published` |
| Update | `updatePost()` | `PUT /api/posts/[id]` | Slug hanya berubah jika title berubah, supaya link lama tidak rusak untuk perubahan kecil |
| Delete | `deletePost()` | `DELETE /api/posts/[id]` | Hard delete, tanpa konfirmasi di level API (konfirmasi ada di UI lewat `DeleteModal`) |
| Partial Update | `setPinned()` | `PATCH /api/posts/[id]` | Saat ini hanya untuk toggle `pinned` |
| Publish/Unpublish | `publishPost()`, `unpublishPost()` | `POST /api/posts/[id]/publish` | `published_at` memakai `COALESCE` agar tanggal terbit asli tidak berubah saat re-publish |

Validasi: title wajib diisi (dicek di server maupun client sebelum submit); PATCH menolak body yang bukan boolean untuk field `pinned`.

Profil ("About me") hanya mendukung Read + Update (bukan CRUD penuh) karena sifatnya singleton (`CHECK (id = 1)`).

---

## 7. Block Editor

`BlockEditor.tsx` (~840 baris) adalah komponen kustom untuk menulis konten artikel dalam bentuk blok, bukan textarea markdown polos.

**Tipe blok yang didukung** (`src/lib/blocks.ts`): `paragraph`, `heading1/2/3`, `numbered-list`, `code`, `image`, `video`.

**Cara kerja:**
- Setiap blok punya representasi objek `{ id, type, text, language?, filename? }`.
- `markdownToBlocks()` mem-parsing string markdown (dari database) menjadi array blok saat artikel dibuka untuk diedit.
- `blocksToMarkdown()` melakukan kebalikannya saat disimpan — semua blok diserialisasi kembali jadi satu string markdown untuk disimpan ke kolom `content`.
- Blok kode menyimpan bahasa & nama file dalam format khusus di info-string fence markdown: ` ```language:filename `, lalu di-highlight dengan Prism (lewat `detectLanguage.ts` untuk deteksi otomatis bahasa dari isi kode yang di-paste).
- Teks kaya (bold/italic/underline/link) di blok paragraf/heading/list ditangani lewat `contentEditable` + `document.execCommand`, bukan textarea biasa, supaya format terlihat langsung (WYSIWYG) tanpa menampilkan simbol markdown mentah saat mengetik.
- Fitur tambahan: insert link dengan `Ctrl+K`, live preview format inline di bawah tiap blok, drag handle untuk reorder blok.

---

## 8. Testing

**Tidak ada automated test suite.** Tidak ditemukan dependency testing (Jest, Vitest, Playwright, Cypress, React Testing Library) di `package.json`, dan tidak ada file `*.test.*` / `*.spec.*` di project.

Verifikasi kualitas yang dilakukan:
- **Type-checking**: `npx tsc --noEmit` (TypeScript strict mode) digunakan untuk menangkap kesalahan tipe data sebelum runtime.
- **Manual testing**: setiap alur (login, create, edit, publish, delete, pin) dicoba langsung di browser sebelum dianggap selesai.
- **Uji skenario tidak biasa**: menutup halaman saat sedang mengedit tanpa menyimpan (`beforeunload`), menekan tombol back/forward browser saat ada perubahan belum disimpan (`popstate` listener + modal konfirmasi).

Ini adalah gap yang disadari secara sadar — untuk scope project belajar/magang, type-safety + manual testing dianggap cukup, dengan automated testing sebagai catatan pengembangan selanjutnya.

---

## 9. Bug yang Ditemukan & Diperbaiki

Berikut bug nyata yang ditemukan selama pengembangan, berdasarkan komentar kode dan catatan pengerjaan:

### Bug 1 — Sesi Login Tidak Valid Tapi Tetap Bisa Masuk
- **Masalah**: Setelah cookie sesi kedaluwarsa atau tidak valid, halaman admin tetap bisa dibuka dan diedit — baru gagal (401) saat mencoba menyimpan, tanpa redirect otomatis.
- **Penyebab**: Middleware (`middleware.ts`) hanya mengecek *keberadaan* cookie, bukan validitas tanda tangan/masa berlakunya (karena verifikasi berat tidak cocok dijalankan di edge runtime).
- **Solusi**: Ditambahkan `requireSession()` sebagai lapis verifikasi kedua di setiap halaman admin (server component) — memvalidasi sesi sungguhan dan redirect ke `/login` di sisi server jika tidak valid.

### Bug 2 — Format Bold/Italic Tidak Ter-render
- **Masalah**: Teks yang ditulis dengan format `** teks **` (spasi menempel ke tanda bintang) tidak muncul sebagai bold di halaman baca, tetap tampil sebagai teks mentah dengan simbol asterisk.
- **Penyebab**: Ini melanggar aturan CommonMark — delimiter emphasis (`**`/`*`) tidak boleh berdekatan langsung dengan spasi. Editor lama sempat menyimpan format dengan spasi di dalam delimiter.
- **Solusi**: Dibuat fungsi `normalizeEmphasisSpacing()` di `markdown.ts` yang memindahkan spasi ke luar delimiter sebelum diproses oleh parser — sehingga artikel lama yang sudah tersimpan dengan format salah tetap bisa tampil benar, sekaligus memperbaiki cara editor menyimpan format baru.

### Bug 3 — Link/Format di Dalam Heading Tidak Muncul
- **Masalah**: Link atau teks bold/italic yang ditulis di dalam heading (H1–H3) tampil sebagai teks polos tanpa format sama sekali.
- **Penyebab**: Custom renderer heading di `marked` sempat ditulis sebagai arrow function, yang kehilangan binding `this.parser` — sehingga token di dalam heading digabung sebagai teks mentah, bukan diproses lewat parser inline.
- **Solusi**: Renderer heading diubah menjadi regular function (bukan arrow function), sehingga `this.parser.parseInline()` bisa dipanggil dengan benar.

### Bug 4 — Artikel Terbit dengan Isi Versi Lama
- **Masalah**: Saat tombol "Terbitkan" ditekan, perubahan konten terbaru kadang tidak ikut tersimpan — artikel terbit dengan versi lama.
- **Penyebab**: Aksi publish sempat langsung mengubah status tanpa memastikan `save()` dipanggil terlebih dahulu.
- **Solusi**: Alur `handlePublish()` diatur ulang agar selalu memanggil `save()` dulu sebelum memanggil endpoint publish, memastikan konten terbaru tersimpan lebih dulu.

### Bug 5 — Daftar Artikel Menampilkan Data Lama
- **Masalah**: Setelah menyimpan artikel dan kembali ke halaman daftar, perubahan (urutan, judul, status) belum terlihat sampai halaman di-refresh manual.
- **Penyebab**: Next.js melakukan client-side router caching — halaman list tidak otomatis mengambil ulang data terbaru dari server setelah navigasi balik.
- **Solusi**: Dipanggil `router.refresh()` setelah setiap aksi mutasi (save, delete, publish) agar cache di-invalidate dan data terbaru diambil ulang dari server.

### Bug 6 — Stale Closure di Listener Unsaved-Changes
- **Masalah**: Listener untuk mendeteksi tombol back/forward browser (`popstate`) kadang tidak mendeteksi perubahan terbaru dengan benar.
- **Penyebab**: Listener dipasang sekali saat komponen mount (dependency array kosong), sehingga closure-nya "membeku" pada nilai state `isDirty` dari render pertama, bukan nilai terbaru.
- **Solusi**: Ditambahkan `isDirtyRef` yang disinkronkan lewat `useEffect`, dan listener membaca `isDirtyRef.current` (selalu terbaru) alih-alih variabel state yang di-closure.

### Bug 7 (dalam progress) — Modal Spacing Tidak Konsisten
- **Masalah**: Modal Delete/Publish terlihat berantakan spacing-nya kalau isi teks (misal judul artikel) panjang atau pendek.
- **Penyebab**: Desain asli di Figma untuk frame modal tidak menggunakan auto-layout, sehingga posisi elemen anak bersifat fixed/absolute dan tidak menyesuaikan panjang konten.
- **Solusi**: `Modal.tsx` dibangun ulang dengan flexbox + `gap` (tanpa positioning fixed/absolute), sehingga spacing tetap konsisten berapa pun panjang teksnya.

---

## 10. Hal yang Dipelajari

- **Mengubah desain menjadi kode nyata**: menerjemahkan file Figma (Home, Login, Post List, Post Page, Modal) menjadi halaman React yang benar-benar berfungsi, termasuk menyesuaikan detail desain yang tidak konsisten (spacing modal) saat implementasi.
- **Membangun backend dari nol**: memahami cara kerja API route handler di Next.js App Router — cek sesi, validasi input, baru sentuh database — sebagai pola yang berulang di semua endpoint.
- **Menghubungkan aplikasi ke database nyata**: memahami query SQL dasar, desain skema sederhana, dan migrasi kolom secara manual tanpa framework migrasi.
- **Membangun sistem login dari nol**: memahami konsep hashing password, session cookie yang ditandatangani, dan pentingnya verifikasi bertingkat (bukan cukup satu lapis pengecekan saja).
- **Menerapkan CRUD secara utuh**: dari create sampai delete, termasuk state tambahan seperti publish/unpublish dan pin yang tidak selalu masuk kategori CRUD standar.
- **Membangun editor kustom (block editor)**: belajar bagaimana representasi data terstruktur (blok) bisa dikonversi bolak-balik ke format penyimpanan (markdown), dan menangani rich text tanpa library editor pihak ketiga.
- **Debugging sistematis**: setiap bug di atas ditemukan lewat pengamatan perilaku nyata (bukan asumsi), dianalisis akar penyebabnya, baru diperbaiki — pola pikir "masalah → penyebab → solusi" yang lebih berharga daripada sekadar menghasilkan fitur yang tampak berjalan.
- **Kesadaran akan trade-off**: memilih tools sederhana (SQLite tanpa ORM, auth custom tanpa NextAuth) secara sadar karena tujuannya belajar konsep dasar, bukan membangun untuk skala besar — sekaligus jujur pada gap yang masih ada (belum ada automated testing).

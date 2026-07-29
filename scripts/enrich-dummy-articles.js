/**
 * Replaces the CONTENT of the 13 dummy articles added by
 * seed-more-articles.js (ids 12-24) with fuller bodies — each with at least
 * 2-3 real sections instead of a single short paragraph. Title, slug,
 * excerpt, dates, and pinned flag are left untouched.
 *
 * Run: node scripts/enrich-dummy-articles.js
 */
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(process.cwd(), "data", "blog.db"));
db.pragma("journal_mode = WAL");

const IMAGES = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
  "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80",
];

const ARTICLES = {
  "migrasi-dari-pages-router-ke-app-router": {
    intro:
      "Migrasi bertahap ternyata lebih aman daripada big-bang rewrite. Saya pindahkan satu route sekaligus sambil kedua router hidup berdampingan selama beberapa minggu.",
    sections: [
      {
        heading: "Kenapa Tidak Sekaligus",
        body: "Rewrite total terdengar menarik di atas kertas, tapi untuk aplikasi yang sudah punya trafik nyata, itu berarti tidak ada rilis sampai semua halaman selesai dipindah. Pages Router dan App Router bisa berjalan berdampingan di folder pages/ dan app/ yang sama, jadi saya bisa merilis satu halaman migrasi per minggu tanpa membekukan fitur lain.",
      },
      {
        heading: "Urutan yang Saya Pakai",
        body: "Halaman statis tanpa data fetching saya pindahkan lebih dulu karena risikonya paling kecil. Baru setelah itu halaman dengan getServerSideProps, karena perlu ditulis ulang sebagai async Server Component. API routes saya sentuh paling akhir, karena itu yang paling banyak dipakai fitur lain dan paling mahal untuk di-debug kalau salah.",
      },
    ],
    steps: [
      "Pindahkan halaman statis dulu, baru yang punya data fetching.",
      "Ganti getServerSideProps dengan async Server Component.",
      "Terakhir baru sentuh API routes, karena itu yang paling banyak dipakai fitur lain.",
    ],
    closing:
      "Total migrasi memakan waktu sekitar satu setengah bulan untuk aplikasi berukuran menengah. Lebih lama dari perkiraan awal, tapi tidak ada satu hari pun aplikasi dalam keadaan rusak.",
  },
  "belajar-server-actions-dari-nol": {
    intro:
      "Awalnya saya kira Server Actions cuma syntactic sugar di atas route handler. Ternyata modelnya benar-benar beda soal revalidation dan error handling, dan itu baru saya sadari setelah form submit saya diam-diam gagal tanpa pesan error apa pun.",
    sections: [
      {
        heading: "Progressive Enhancement yang Gratis",
        body: "Kalau form tetap memakai atribut action bawaan alih-alih onSubmit dengan preventDefault, form itu tetap berfungsi bahkan sebelum JavaScript selesai dimuat. Ini terasa seperti sihir pertama kali saya coba: matikan JavaScript di devtools, form submit tetap jalan karena browser sendiri yang mengirim request.",
      },
      {
        heading: "Error Tidak Otomatis Muncul di UI",
        body: "Ini yang bikin saya terjebak paling lama. Kalau action melempar error, Next.js tidak otomatis menampilkannya ke pengguna — error itu harus ditangkap manual lewat useFormState atau try/catch di dalam action, lalu dikembalikan sebagai bagian dari return value, bukan di-throw begitu saja.",
      },
    ],
    steps: [
      "progressive enhancement gratis kalau form tetap pakai action prop native.",
      "Error dari action tidak otomatis muncul di UI, harus ditangkap manual lewat return value.",
    ],
    closing:
      "Setelah paham dua hal ini, sisanya terasa jauh lebih mudah dibanding menulis handler fetch manual plus state loading/error sendiri.",
  },
  "kenapa-saya-pindah-dari-prisma-ke-better-sqlite3": {
    intro:
      "Untuk blog pribadi dengan satu admin, ORM besar terasa berlebihan. SQL mentah justru lebih gampang di-debug karena saya bisa menempel query yang sama persis ke SQLite CLI dan langsung lihat hasilnya.",
    sections: [
      {
        heading: "Generate Step yang Mengganggu",
        body: "Prisma bagus untuk tim besar dengan skema yang sering berubah, tapi untuk proyek kecil, generate step sebelum dev server bisa jalan jadi friksi tersendiri. Setiap kali ganti branch atau pull perubahan skema, saya harus ingat menjalankan prisma generate dulu — dan begitu lupa, error yang muncul sama sekali tidak jelas.",
      },
      {
        heading: "Query yang Bisa Di-profile Langsung",
        body: "Dengan better-sqlite3, setiap query adalah string SQL biasa. Kalau ada yang lambat, saya tinggal copy query itu, jalankan EXPLAIN QUERY PLAN di CLI, dan langsung tahu index mana yang kurang. Dengan query builder, langkah ini butuh translasi manual dulu ke SQL sebelum bisa di-debug dengan cara yang sama.",
      },
    ],
    steps: [
      "Tidak ada build step tambahan sebelum dev server jalan.",
      "Query SQL yang eksplisit lebih gampang di-profile langsung dari log.",
    ],
    closing:
      "Trade-off-nya jelas: saya kehilangan type-safety otomatis dari skema, dan harus lebih disiplin menulis tipe return manual. Untuk proyek seukuran ini, itu harga yang saya rela bayar.",
  },
  "menangani-cookie-session-tanpa-library-auth": {
    intro:
      "Untuk satu akun admin, HMAC-signed cookie sudah cukup aman — tidak perlu NextAuth atau library sejenis yang dirancang untuk menangani banyak provider dan banyak pengguna sekaligus.",
    sections: [
      {
        heading: "Kompleksitas yang Tidak Saya Butuhkan",
        body: "Sebagian besar library auth dirancang untuk multi-provider (Google, GitHub, email magic link) dan multi-user dengan role berbeda-beda. Blog dengan satu admin tidak punya kebutuhan itu sama sekali, tapi tetap harus mengonfigurasi semua lapisan abstraksinya kalau memakai library besar.",
      },
      {
        heading: "Kenapa timingSafeEqual Wajib",
        body: "Signature HMAC mencegah cookie dipalsukan tanpa tahu secret-nya. Tapi perbandingan signature itu sendiri harus memakai crypto.timingSafeEqual, bukan operator === biasa — perbandingan string standar berhenti di karakter pertama yang tidak cocok, dan itu bisa dieksploitasi lewat timing attack untuk menebak signature karakter demi karakter.",
      },
    ],
    steps: [
      "Signature HMAC mencegah cookie dipalsukan tanpa tahu secret.",
      "timingSafeEqual wajib dipakai supaya perbandingan signature tidak bocor lewat timing attack.",
    ],
    closing:
      "Total implementasinya kurang dari 70 baris kode, dan saya paham persis setiap baris — sesuatu yang jarang bisa saya klaim soal library auth pihak ketiga.",
  },
  "optimasi-gambar-di-blog-tanpa-nextimage": {
    intro:
      "Karena gambar disimpan sebagai URL eksternal yang pembaca tempel sendiri, saya pilih tag img polos dengan beberapa aturan manual alih-alih next/image.",
    sections: [
      {
        heading: "Masalah Domain yang Harus Didaftarkan",
        body: "next/image mengharuskan setiap domain gambar didaftarkan di next.config.js lewat remotePatterns. Itu masuk akal untuk aplikasi dengan sumber gambar tetap, tapi merepotkan kalau pembaca artikel bisa menempel URL gambar dari domain mana saja — saya tidak mau mengedit config setiap kali ada domain baru.",
      },
      {
        heading: "Aturan Manual Sebagai Gantinya",
        body: "Tanpa optimasi otomatis dari Next.js, saya kompensasi dengan dua aturan sederhana: batasi ukuran tampilan lewat class Tailwind supaya layout tidak melompat, dan pakai loading lazy bawaan browser untuk gambar yang berada di luar viewport awal. Tidak sesempurna next/image, tapi cukup untuk blog dengan trafik kecil.",
      },
    ],
    steps: [
      "Lazy-load hanya untuk gambar di luar viewport awal.",
      "Ukuran thumbnail dibatasi lewat class Tailwind, bukan resize di server.",
    ],
    closing:
      "Kalau suatu saat trafik naik signifikan, ini yang pertama akan saya evaluasi ulang — kemungkinan besar dengan image proxy sendiri, bukan kembali ke next/image.",
  },
  "struktur-folder-untuk-blog-kecil": {
    intro:
      "Tidak semua proyek butuh feature-based folder. Untuk blog dengan sedikit fitur, pemisahan per layer justru lebih jelas dibanding memecah tiap fitur jadi foldernya sendiri.",
    sections: [
      {
        heading: "Kenapa Feature-based Tidak Cocok di Sini",
        body: "Saya sempat coba struktur feature-based, satu folder per fitur berisi komponen, hook, dan util miliknya sendiri. Untuk proyek sekecil blog ini, hasilnya malah lebih sering pindah-pindah folder daripada benar-benar menulis kode, karena batas antar fitur sendiri tidak jelas — apakah komponen modal termasuk fitur posting atau fitur shared UI?",
      },
      {
        heading: "Pemisahan per Layer",
        body: "Sekarang semua logic yang tidak bergantung pada request masuk ke lib/, semua yang merender UI masuk ke components/, tanpa dipecah lagi per fitur. Dengan hanya belasan file di masing-masing folder, mencari sesuatu lebih cepat lewat pencarian nama file daripada lewat navigasi folder bertingkat.",
      },
    ],
    steps: [
      "lib/ untuk semua logic yang tidak bergantung pada request.",
      "components/ untuk semua yang render UI, tanpa dipisah per fitur.",
    ],
    closing:
      "Kalau nanti proyek ini tumbuh jadi puluhan fitur, saya akan revisit struktur ini. Untuk sekarang, sederhana menang.",
  },
  "debugging-hydration-mismatch-di-nextjs": {
    intro:
      "Error 'text content does not match' hampir selalu berarti ada nilai yang beda antara render di server dan render di client — ini cara saya melacaknya tanpa menebak-nebak.",
    sections: [
      {
        heading: "Penyebab Paling Sering",
        body: "Hampir semua kasus yang saya temui berasal dari memakai Date.now(), Math.random(), atau nilai yang bergantung pada locale/timezone browser langsung di dalam render, tanpa membungkusnya. Server merender satu nilai, browser merender nilai lain begitu hydration jalan, dan React memperingatkan ketidakcocokan itu.",
      },
      {
        heading: "Cara Saya Memutuskan Fix-nya",
        body: "Pertanyaan pertama yang saya tanyakan: apakah nilai ini benar-benar harus beda per render, atau seharusnya stabil? Kalau seharusnya stabil, biasanya ada state yang belum di-set dengan benar di server. Kalau memang harus beda — misalnya waktu relatif seperti '3 menit lalu' — saya bungkus elemen itu saja dengan suppressHydrationWarning, bukan menyembunyikan seluruh komponen dari server-side rendering.",
      },
    ],
    steps: [
      "Cek dulu apakah nilainya benar-benar butuh berbeda per render, atau seharusnya stabil.",
      "Kalau memang harus beda, bungkus dengan suppressHydrationWarning di elemen itu saja.",
    ],
    closing:
      "Sejak menerapkan aturan ini secara konsisten, saya nyaris tidak pernah lagi menghabiskan waktu berjam-jam menebak sumber hydration mismatch.",
  },
  "menulis-markdown-renderer-sendiri-vs-pakai-library": {
    intro:
      "Saya tetap pakai marked untuk parsing dasar, tapi renderer kustom untuk code block dan heading ID ternyata tidak sesulit dugaan awal saya.",
    sections: [
      {
        heading: "Override renderer.code",
        body: "Kebutuhan saya spesifik: code block perlu menampilkan nama file di atasnya dan syntax highlighting sesuai bahasa. marked mendukung override renderer.code, jadi saya tinggal parse info string seperti typescript:route.ts, pisahkan bahasa dan nama file, lalu render header terpisah sebelum blok kode Prism.highlight.",
      },
      {
        heading: "Override renderer.heading untuk Table of Contents",
        body: "Table of contents di sisi kanan artikel butuh ID yang bisa dituju lewat anchor link. Saya override renderer.heading untuk men-generate slug dari teks heading H2, sambil tetap memanggil parser inline bawaan supaya bold/italic/link di dalam heading tetap dirender dengan benar, bukan cuma teks polos.",
      },
    ],
    steps: [
      "Override renderer.code untuk syntax highlighting dan header filename.",
      "Override renderer.heading untuk slug ID yang dipakai table of contents.",
    ],
    closing:
      "Menulis parser markdown dari nol jelas berlebihan. Tapi override dua-tiga renderer di atas library yang sudah matang ternyata cukup untuk kebutuhan yang sangat spesifik seperti ini.",
  },
  "pengalaman-pertama-pakai-tailwind-di-proyek-production": {
    intro:
      "Awalnya skeptis karena class menumpuk panjang di setiap elemen, tapi setelah beberapa minggu pemakaian di proyek production, justru terasa lebih cepat dibanding menulis CSS module terpisah.",
    sections: [
      {
        heading: "Mengatasi Class yang Menumpuk",
        body: "Kekhawatiran utama saya soal keterbacaan class yang panjang ternyata teratasi dengan aturan urutan yang konsisten: layout dulu, lalu spacing, lalu warna, baru state seperti hover dan focus paling akhir. Begitu polanya konsisten, mata jadi terbiasa scan urutan itu tanpa harus membaca satu-satu.",
      },
      {
        heading: "Kapan Harus Diekstrak ke Komponen",
        body: "Aturan yang saya pakai: begitu sebuah kombinasi class dipakai lebih dari dua kali di tempat berbeda, itu tanda untuk diekstrak jadi komponen, bukan di-copy-paste lagi. Ini mencegah drift — perubahan style di satu tempat lupa diterapkan di tempat lain yang sebenarnya harus konsisten.",
      },
    ],
    steps: [
      "Ekstrak ke komponen begitu sebuah kombinasi class dipakai lebih dari dua kali.",
      "Warna dan spacing tetap didefinisikan lewat token config, bukan nilai arbitrary di class.",
    ],
    closing:
      "Sekarang saya lebih khawatir kalau harus kembali ke CSS module — jarak antara menulis style dan melihat hasilnya di layar terasa jauh lebih panjang.",
  },
  "kapan-harus-pakai-server-component-vs-client-component": {
    intro:
      "Aturan sederhana yang saya pakai: mulai dari Server Component, baru turun ke Client Component kalau memang butuh interaktivitas. Kebalikan dari kebiasaan lama di Pages Router yang semuanya client-rendered secara default.",
    sections: [
      {
        heading: "Sinyal untuk Pindah ke Client Component",
        body: "Kalau sebuah komponen butuh useState, useEffect, event handler browser seperti onClick, atau mengakses window/document, itu sinyal jelas untuk menambahkan 'use client' di baris paling atas. Di luar itu, saya coba pertahankan sebagai Server Component selama mungkin.",
      },
      {
        heading: "Data Fetching Tetap di Server",
        body: "Godaan terbesar adalah memindahkan data fetching ke Client Component supaya gampang re-fetch. Tapi itu menciptakan request waterfall: HTML kosong dikirim dulu, baru browser fetch data setelah JavaScript jalan. Dengan tetap fetch di Server Component, data sudah ada di HTML pertama yang dikirim ke browser.",
      },
    ],
    steps: [
      "Kalau butuh useState, useEffect, atau event handler browser, baru tambahkan 'use client'.",
      "Data fetching sebisa mungkin tetap di Server Component supaya tidak ada waterfall di client.",
    ],
    closing:
      "Hasil praktisnya: sebagian besar halaman blog ini adalah Server Component murni, dan hanya komponen interaktif kecil seperti editor dan modal yang jadi Client Component.",
  },
  "menangani-error-boundary-di-app-router": {
    intro:
      "File error.tsx per-segment ternyata lebih fleksibel dibanding satu error boundary global di top level — satu bagian halaman bisa gagal tanpa menjatuhkan seluruh aplikasi.",
    sections: [
      {
        heading: "Kenapa Harus Client Component",
        body: "error.tsx wajib jadi Client Component karena butuh reset function yang disediakan React untuk mencoba render ulang segmen yang gagal. Ini kadang mengejutkan pertama kali, karena hampir semua file lain di App Router defaultnya Server Component.",
      },
      {
        heading: "Menentukan Level yang Tepat",
        body: "Saya taruh error.tsx di level segmen yang paling mungkin gagal, biasanya dekat dengan data fetching — misalnya di dalam folder route yang memanggil database. Menaruhnya terlalu tinggi di root berarti error kecil di satu bagian bisa menjatuhkan seluruh layout, termasuk navigasi yang seharusnya tetap berfungsi.",
      },
    ],
    steps: [
      "error.tsx wajib jadi Client Component karena butuh reset function dari React.",
      "Taruh error.tsx di level segmen yang paling mungkin gagal, misalnya dekat data fetching.",
    ],
    closing:
      "Sejak menambahkan error.tsx di level yang tepat, error di satu artikel tidak lagi ikut menjatuhkan sidebar profil atau navigasi.",
  },
  "menulis-middleware-yang-cepat-di-nextjs": {
    intro:
      "Middleware berjalan di Edge Runtime untuk setiap request, jadi logic berat yang ditaruh di sana bisa terasa lambat di semua halaman, bukan cuma satu.",
    sections: [
      {
        heading: "Kesalahan yang Saya Buat",
        body: "Saya sempat taruh verifikasi signature HMAC penuh di middleware, dengan asumsi itu tempat paling awal untuk menolak request tidak sah. Ternyata itu duplikasi kerja yang sudah dilakukan lagi di setiap halaman admin lewat requireSession, dan menambah latency di setiap request termasuk yang tidak menyentuh halaman admin sama sekali.",
      },
      {
        heading: "Pembagian Tugas yang Lebih Masuk Akal",
        body: "Sekarang middleware cukup mengecek keberadaan cookie session — cepat, edge-safe, tidak perlu crypto berat. Verifikasi signature penuh tetap dilakukan di server page lewat requireSession, karena di situlah kepastian sebenarnya dibutuhkan sebelum menampilkan data sensitif.",
      },
    ],
    steps: [
      "Middleware cukup cek keberadaan cookie, bukan verifikasi penuh.",
      "Verifikasi signature penuh tetap dilakukan di server page, karena itu yang benar-benar butuh kepastian.",
    ],
    closing:
      "Latency middleware turun terasa signifikan setelah perubahan ini, terutama untuk halaman publik yang jauh lebih sering diakses dibanding halaman admin.",
  },
  "refactor-modal-konfirmasi-jadi-satu-komponen": {
    intro:
      "Awalnya tiga modal — delete, publish, unsaved changes — ditulis terpisah dengan logic yang mirip. Saya satukan jadi satu shared shape setelah sadar 80% kodenya identik.",
    sections: [
      {
        heading: "Duplikasi yang Paling Kentara",
        body: "Overlay backdrop, animasi buka-tutup, dan struktur tombol cancel/confirm ditulis ulang tiga kali dengan perbedaan yang sebenarnya cuma teks dan warna tombol konfirmasi. Setiap kali ada bug di animasi overlay, saya harus mengingat untuk memperbaikinya di tiga tempat sekaligus.",
      },
      {
        heading: "Bentuk Shared yang Saya Pakai",
        body: "Komponen dasarnya menerima props untuk teks judul, teks body, label tombol, dan warna tombol konfirmasi (danger untuk delete, default untuk publish). Overlay dan animasi ditulis sekali di komponen ini, dipakai ulang oleh ketiga kasus tanpa duplikasi.",
      },
    ],
    steps: [
      "Props action untuk teks dan warna tombol konfirmasi.",
      "Overlay dan animasi ditulis sekali di komponen dasar, dipakai ulang oleh ketiganya.",
    ],
    closing:
      "Bug animasi overlay yang dulu perlu tiga kali fix sekarang cukup satu kali, dan otomatis konsisten di ketiga modal.",
  },
};

function buildContent(article, image) {
  const parts = [article.intro];
  article.sections.forEach((s) => {
    parts.push(`## ${s.heading}`);
    parts.push(s.body);
  });
  parts.push(article.steps.map((s, i) => `${i + 1}. ${s}`).join("\n\n"));
  parts.push(`![](${image})`);
  parts.push(article.closing);
  return parts.join("\n\n");
}

const update = db.prepare("UPDATE posts SET content = @content, updated_at = @updated_at WHERE slug = @slug");
const rows = db.prepare("SELECT id, slug FROM posts WHERE id BETWEEN 12 AND 24").all();

let updated = 0;
const run = db.transaction(() => {
  rows.forEach((row, i) => {
    const article = ARTICLES[row.slug];
    if (!article) {
      console.warn(`No enriched content for slug "${row.slug}", skipping.`);
      return;
    }
    const image = IMAGES[i % IMAGES.length];
    update.run({ content: buildContent(article, image), updated_at: new Date().toISOString(), slug: row.slug });
    updated += 1;
  });
});
run();

console.log(`Enriched ${updated} of ${rows.length} dummy articles.`);

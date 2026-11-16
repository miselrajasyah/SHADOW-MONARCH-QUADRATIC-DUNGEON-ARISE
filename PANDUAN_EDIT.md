# Panduan Mengedit Website (untuk pemula)

Website ini hanya terdiri dari 4 file. Tidak perlu instalasi apa pun.

```
index.html          kerangka halaman (jendela login, kontrol musik)
css/style.css       semua tampilan: warna, ukuran, animasi, versi HP
js/content.js       ISI KONTEN: tulisan landing, daftar dungeon, soal, XP, tautan GeoGebra, tim, FAQ
js/characters.js    KARAKTER: gambar SVG, dialog lucu, teman pendamping, galeri, bar HP musuh
js/extras.js        FITUR TAMBAHAN: misi harian, tema, pengaturan, pengumuman, konfeti, layar pembuka, mode pemilik
manifest.webmanifest, sw.js, icons/   agar website bisa dipasang seperti aplikasi (PWA)
js/app.js           LOGIKA: halaman, alur belajar, skor, audio, raid, forum, form masuk/daftar
js/firebase.js      FIREBASE (module): Auth dan Firestore, konfigurasi proyek
js/cloud.js         SINKRONISASI data akun ke Firestore (push, pull, gabung antar perangkat)
js/math.js          NOTASI MATEMATIKA: merender teks $...$ dengan KaTeX (CDN)
firestore.rules     aturan keamanan Firestore (tempel di Firebase Console)
PANDUAN_FIREBASE.md setelan awal Firebase dan struktur data
```

Menulis rumus: pakai LaTeX di antara tanda dolar, misalnya `'$y = a(x - h)^2 + k$'`. Di file .js tulis garis miring dua kali: `'$\\dfrac{b}{2a}$'`. Detailnya ada di komentar atas `const Q` (content.js) dan js/math.js.

Saran editor: VS Code. Tekan **Ctrl+F** untuk mencari kata, dan **Ctrl+Shift+F** untuk mencari di semua file.
Setelah mengedit, simpan (Ctrl+S) lalu muat ulang browser dengan **Ctrl+F5**.

Aturan penting saat mengedit teks di file .js:
- Teks berada di dalam tanda kutip ('...' atau "..."). Jangan hapus tanda kutip, koma, atau kurung.
- Jika teks memuat tanda petik satu (misalnya Monarch's), tulis dengan tanda kutip ganda "Monarch's" atau tulis \' di dalamnya.
- Jika halaman jadi kosong setelah mengedit, buka Console browser (tekan F12) untuk melihat pesan error dan nomor barisnya.

## 1. Mau mengubah apa? Cari di mana?

| Yang ingin diubah | File | Cari kata ini |
|---|---|---|
| Judul besar, deskripsi, tombol landing page | content.js | `const TXT` |
| Backstory dan tujuan belajar di landing | content.js | `backstory`, `objectives` |
| Langkah Alur Belajar dan daftar Fitur | content.js | `flow:`, `fitur:` |
| Nama dan peran anggota tim | content.js | `const TIM` |
| Pertanyaan FAQ | content.js | `const FAQ` |
| Nama dungeon, XP, tulisan Misi | content.js | `const RK` |
| Soal, opsi jawaban, kunci, pembahasan | content.js | `const Q`, `const EXP` |
| Title hunter dan batas XP | content.js | `const TT` |
| Link GeoGebra Part 1 dan Part 2 | content.js | `const PART` |
| Kode guru | content.js | `TEACHER_CODE` |
| Judul tab browser | index.html | `<title>` |
| Tulisan di jendela Masuk / Daftar | index.html | `id="login"` |
| Warna dan font | style.css | `:root` |
| Tulisan penjelasan Praktik Rank D, C, B, A, S | app.js | `const exHTML` |
| Tulisan dashboard siswa | app.js | `V.dash` |
| Tulisan dashboard guru dan halaman Analisis | app.js | `V.class`, `V.analysis` |
| Tulisan halaman Panduan di dalam aplikasi | app.js | `V.help` |
| Teks sertifikat | app.js | `V.cert` |
| Dialog karakter (ucapan saat benar, salah, dll) | characters.js | `const CHARS`, `say:` |
| Daftar misi harian dan hadiah XP | extras.js | `const DQ` |
| Tema warna pilihan | extras.js | `const THEMES` |
| Kode pemilik, tampilkan nama tim, layar pembuka | content.js | `OWNER_PASS`, `SHOW_TEAM`, `SPLASH` |
| Nama, peran, bio, dan syarat buka karakter | characters.js | `const CHARS`, `unlock:` |
| Warna dan bentuk gambar karakter | characters.js | `const kage`, `noir`, `ratu`, `lumi`, `slime` |
| Judul dan deskripsi bagian karakter di landing | content.js | `charsTitle`, `charsDesc` |
| Menu atas (nama menu) | app.js | `const NAV` |
| Waktu dan jumlah soal Raid awal | app.js | `raidSec` |
| Musik (nada dan tempo) dan efek suara | app.js | `const AU` |

## 2. Mengubah warna dan font

Buka `css/style.css`, lihat blok `:root` di bagian atas:

```css
:root {
  --bg: #070a1c;   /* warna latar halaman */
  --pn: #0e1436;   /* warna kartu */
  --bl: #4d8bff;   /* biru utama */
  --vi: #9a5aff;   /* ungu */
  --cy: #5ee6f2;   /* biru muda */
  --gold: #ffd86b; /* kuning emas */
}
```
Ganti kode hex (contoh `#4d8bff`) dengan warna lain. Cari kode warna di Google dengan kata "color picker".
Font diganti di `index.html` (tautan Google Fonts) dan di `style.css` (cari `font-family`).

## 3. Mengubah dan menambah soal

Semua soal ada di `js/content.js`, di dalam `const Q`. Setiap dungeon punya daftar soal.

Soal pilihan ganda:
```js
{
  t: 'mc',                       // jenis: pilihan ganda
  tag: 'MULTIPLE QUESTION',      // label kecil di atas soal
  q: 'Vertex dari y = (x - 4)² + 1 adalah...',
  o: ['(4, 1)', '(-4, 1)', '(4, -1)', '(1, 4)'],  // opsi jawaban
  a: [0],                        // nomor opsi yang benar (mulai dari 0). a: [0, 2] jika dua jawaban benar (tambahkan multi: 1)
  show: '(4, 1)',                // jawaban yang ditampilkan jika siswa salah
  hint: 'Cari nilai h dan k.',   // petunjuk (opsional)
  exp: 'Bentuk (x - h)² + k, vertex (h, k).' // pembahasan (opsional)
}
```
Opsi diacak otomatis saat tampil, jadi tidak masalah jawaban benar ditaruh di urutan pertama.

Soal isian (dicek memakai pola regex):
```js
{ t: 'fill', tag: 'PEAK QUESTION', q: 'Tentukan nilai y saat x = 3.',
  f: [{ l: 'y =', r: /^-5$/ }],   // r = pola jawaban benar (spasi dihapus dan huruf kecil otomatis)
  show: 'y = -5' }
```
Soal esai: `{ t: 'open', tag: 'REFLECTION', q: 'Tulis pendapatmu...', min: 20 }` (min = jumlah karakter minimal).

Cara menambah soal ke dungeon yang sudah ada: tambahkan objek soal di dalam daftar `Q.E`, `Q.D`, dan seterusnya, atau gunakan baris `Q.E.push(...)` di bagian bawah.
Setelah mengubah jumlah soal, data demo (akun contoh) tidak perlu diubah. Jika tampilan aneh, ganti angka pada `const KEY = 'arise_v5'` di app.js (misalnya jadi `'arise_v6'`) untuk mengosongkan data lama di browser.

## 4. Mengubah XP, title, dan dungeon

- XP dungeon: ubah `xp:` di `const RK`. Total XP maksimum di PPT adalah 1500.
- Title: ubah `const TT` (batas XP minimal dan nama title).
- Menambah dungeon baru: tambahkan satu objek di `RK` (kode unik, nama, xp, topik, warna, part, info), lalu buat soalnya di `Q.KODE = [...]`.
  Dungeon baru otomatis muncul di Peta dan dashboard. Jika ingin ikut masuk grafik spider, tambahkan kodenya ke teks `'EDCBAS'` pada baris `const AX`.

## 5. Mengganti GeoGebra

Di `content.js`, cari `const PART`. Ganti id (bagian setelah `/m/` pada link GeoGebra):
```js
const PART = { 1: 'rxe5muqn', 2: 'czmkunwt' };
```

## 6. Mengganti kode guru dan akun demo

- Kode guru: `const TEACHER_CODE = 'guild';` di content.js.
- Akun demo (Misel, Wildan, dst, dan Guru Demo) dibuat di app.js pada blok `if (!DB.seeded)`. Hapus blok itu bila tidak ingin akun demo, dan hapus juga tombol demo di index.html (cari `class="demo"`).

## 7. Mengatur Raid Waktu

Guru dapat mengubahnya langsung di halaman Analisis (waktu per soal dan jumlah soal). Nilai awalnya ada di fungsi `cfg()` di app.js: `raidSec: 20` dan `raidN: 10`.

## 8. Tampilan HP

Semua aturan ada di bagian paling bawah `style.css` (cari `MOBILE`). Contoh: ubah `@media (max-width: 700px)` jika ingin batas HP yang berbeda.
Menu atas di HP dapat digeser ke samping. Landing page memakai tombol menu ☰. Tabel panjang dapat digeser.

## 9. Menaruh di internet (gratis)

1. Buka app.netlify.com/drop lalu tarik seluruh folder website ke halaman itu.
2. Netlify memberi link publik yang bisa dibagikan.

## 10. Catatan keamanan dan data

- Data akun, progres, dan forum disimpan di browser (localStorage), bukan di server. Setiap perangkat punya data sendiri.
- Siswa dapat menyalin Kode Progres dari Profil, lalu guru menempelnya di halaman Kelas untuk menggabungkan data.
- Password disimpan sebagai hash sederhana. Cocok untuk prototype dan presentasi, bukan untuk data sungguhan.
- Teks buatan pengguna (forum, jawaban) selalu melewati fungsi `esc()` agar aman. Jika kamu menulis kode baru yang menampilkan teks pengguna, pakai `esc()` juga.

## 11. Karakter interaktif

Semua karakter dibuat sebagai gambar SVG di `js/characters.js` (karakter original yang terinspirasi suasana dungeon).

- **Teman pendamping:** muncul di pojok kiri bawah setelah login. Ia berbicara saat jawaban benar atau salah, saat dungeon selesai, saat LEVEL UP, saat Raid, dan saat idle. Klik karakternya untuk mengobrol. Tombol "Teman: ON/OFF" di kontrol musik untuk menyembunyikannya.
- **Galeri Karakter** (menu Karakter): klik karakter untuk berbincang, tombol "Panggil bayangan!", dan pilih teman. Karakter baru terbuka saat dungeon tertentu selesai (Noir di Rank C, Lumi di Rank B, Antoinette di Rank A, Raja Parabola di Rank S).
- **Bar HP musuh:** di langkah Soal, Parabo (atau Raja Parabola di Rank S dan Wrap-up) kehilangan HP setiap jawaban benar.
- **Mata mengikuti kursor:** diatur oleh fungsi `Co.track()`.

Mengubah dialog: cari karakternya di `const CHARS`, lalu ubah teks di `say: { ... }`. Satu baris dipilih acak. Tulis `{nama}` untuk memunculkan nama pemain.
Kejadian yang tersedia: `welcome`, `correct`, `wrong`, `retry`, `clear`, `idle`, `click`. Kejadian lain (`hint`, `levelup`, `raid`, `raidwin`, `raidlose`, `forum`) memakai kalimat umum di `const COMMON`.

Menambah karakter baru:
1. Salin salah satu blok di `CHARS`, beri `id` baru, ubah nama, bio, quote, dan dialog.
2. Pada `svg:` pakai salah satu fungsi gambar yang ada (misalnya `(m) => slime(m, false)`) atau buat fungsi gambar baru dengan pola `wrap(...)`.
3. Atur `unlock:` ({ t: 'start' } atau { t: 'rank', c: 'D' }).

Mengubah warna karakter: di fungsi gambarnya (`kage`, `noir`, `ratu`, `lumi`, `slime`), ganti kode warna hex pada atribut `fill` dan `stroke`.

## 12. Mode pemilik: akun demo disembunyikan dari publik

Akun demo (Misel, Wildan, Zidan, Panji, Hakim, dan Guru Demo) **tidak muncul** untuk pengunjung. Tombol "Demo siswa" dan "Demo guru" juga disembunyikan. Daftar siswa, peringkat, dan forum demo hanya terlihat setelah mode pemilik aktif.

- **Membuka mode pemilik:** tekan **Ctrl+Shift+O** (komputer) atau ketuk logo ARISE **7 kali dengan cepat** (HP), lalu masukkan kode pemilik. Setelah itu tombol demo muncul di jendela Masuk.
- **Mengganti kode pemilik:** ubah `OWNER_PASS` di `js/content.js`. Segera ganti dari nilai bawaan.
- **Mematikan:** Pengaturan, tombol "Matikan mode pemilik".
- **Penting:** ini hanya menyembunyikan tampilan. Siapa pun yang membuka file JavaScript bisa membaca kodenya. Data tiap pengunjung tersimpan di browser mereka sendiri, jadi mereka tidak melihat data demo milikmu. Untuk perlindungan sungguhan perlu server dengan login.
- **Nama anggota tim:** bagian "Tim Pengembang" di landing disembunyikan. Tampilkan lagi dengan `SHOW_TEAM = true` di content.js.

## 13. Fitur tambahan versi 6

- **Layar pembuka:** muncul sekali per sesi, ketukan pertama menutupnya sekaligus menyalakan musik. Matikan dengan `SPLASH = false`.
- **Misi Harian:** di dashboard siswa (jawab 5 soal benar, taklukkan dungeon, selesaikan raid, aktif di forum). Hadiah XP bonus diklaim manual. Ubah daftarnya di `const DQ`.
- **Pasukan Bayangan:** prajurit bangkit tiap dungeon selesai.
- **Podium:** juara 1 sampai 3 di halaman Peringkat.
- **Pengumuman guru:** guru menulis di halaman Kelas, siswa melihatnya di dashboard (tersimpan di browser yang sama).
- **Pengaturan:** tema warna, ukuran teks, kurangi animasi, musik, teman pendamping, unduh cadangan, pasang aplikasi.
- **Karakter baru:** Mochi (buka setelah 1 Raid), Aurel (500 XP), Zeri (1 posting forum), Master Gildan (selesaikan Posttest). Jenis syarat buka: `start`, `rank`, `raid`, `xp`, `forum`.
- **Pintasan keyboard:** angka 1 sampai 9 memilih opsi, Enter memeriksa, panah kiri/kanan pindah soal.
- **Pasang sebagai aplikasi (PWA):** aktif saat website dibuka lewat https (misalnya Netlify). Jika kamu mengedit file, ubah `VERSI` di `sw.js` agar cache diperbarui.


## Tahap 2: yang bisa diubah
- **Materi per rank**: narasi dan ringkasan di `MATERI` (js/content.js). Gambar dan applet di js/materi.js (fungsi `MOD.E` sampai `MOD.S`, dan `INIT.E` sampai `INIT.S`).
- **Skill karakter**: objek `SKILLS` di js/characters.js. Ubah angka (`xp`, `hint`, `raidSec`, `raidPts`, `dq`) untuk menyeimbangkan. Efeknya dihitung oleh objek `Skill` di file yang sama dan dipanggil dari app.js.
- **Istilah**: `GLOS` dan `GLOS_INTRO` di js/content.js. Kata di `a:[...]` otomatis mendapat tooltip.
- **Avatar**: palet warna, gaya rambut, dan aksesori di js/avatar.js (`PAL`, `HSN`, `ACC`).
- **Forum, pengumuman, raid cloud**: js/sync.js. Aturan keamanan di firestore.rules.

## Tambahan v11

- Monster dan damage: `js/monsters.js` (tabel INFO). HP, jumlah panggilan bayangan, persen pemulihan: bagian atas `js/battle11.js`.
- Peta dungeon: `js/gatemap.js` (tabel POS untuk posisi gerbang).
- Menu Arsip Bayangan, Monitor Live, Simulasi landing: `js/menus11.js` (tabel ACH untuk pencapaian, REMEDIAL dan SAFE untuk batas skor).
- Terjemahan: `js/lang2.js`. Tambah satu baris `'teks Indonesia': ['English', '日本語', '한국어']`. Gunakan `{x}` untuk bagian yang berubah-ubah.
  Kalimat yang berisi tag `<b>` ditulis lengkap dengan tagnya. Cek sisa teks: buka halaman, F12, `I18N.untranslated()` dan `I18N.blocks()`.
- Foto tim: `img/team/*.jpeg` (lihat `img/team/README.txt`).
- Panel audio bawah: tombol gir (`js/ui11.js`). Setelah mengedit file, naikkan VERSI di `sw.js`.

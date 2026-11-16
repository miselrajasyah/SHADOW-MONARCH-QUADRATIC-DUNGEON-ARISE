# Panduan Firebase (Tahap 1 dan 2)

Proyek: `quadratic-dungeon-arise`. SDK: Firebase JS v13.3.0 (CDN gstatic), dimuat oleh `js/firebase.js`.

## 1. Setel sekali di Firebase Console
1. **Authentication > Sign-in method**: aktifkan **Email/Password**.
2. **Authentication > Settings > Authorized domains**: tambahkan domain Vercel kamu (misalnya `nama-proyek.vercel.app`) dan domain kustom jika ada. Tanpa ini, link verifikasi/reset dan login bisa ditolak.
3. **Authentication > Templates**: ubah bahasa ke Indonesia dan, jika mau, nama pengirim email.
4. **Firestore Database**: buat database (mode produksi), lalu buka tab **Rules**, tempel isi `firestore.rules`, klik **Publish**.
5. Buat dokumen kode guru: **Firestore > Start collection** `config` > Document ID `app` > field `teacherCode` (string) berisi **kode yang sama dengan `TEACHER_CODE` di `js/content.js`** (bawaan: `guild`). Ganti keduanya dengan kode rahasiamu.

## 2. Alur akun
- **Daftar**: nama hunter (unik) + email + password (min. 6) + peran. Email verifikasi dikirim otomatis.
- **Masuk**: email + password. Sesi tersimpan, jadi tidak perlu login ulang saat membuka lagi.
- **Lupa password**: tautan di jendela Masuk, link reset dikirim ke email.
- **Verifikasi email**: Firebase mengirim *link* (bukan kode angka). Ada pita pengingat dengan tombol "Kirim link verifikasi" dan "Saya sudah verifikasi". Untuk mewajibkannya, ubah `REQUIRE_VERIFIED = true` di `content.js`.

## 3. Data di Firestore
| Koleksi | Isi | Siapa boleh baca |
|---|---|---|
| `users/{uid}` | nama, role, `rank` (E-S: dungeon yang sedang ditantang, S jika tamat), `xp`, `title`, `done`, `st` (jawaban), `co` (karakter), `streak`, `raid`, `dq`, `prefs` | pemilik dan guru |
| `leaderboard/{uid}` | ringkasan siswa tanpa jawaban (untuk halaman Peringkat) | semua akun yang login |
| `names/{kunci}` | penanda nama sudah dipakai | cek ketersediaan saja |
| `config/app` | `teacherCode` | tidak bisa dibaca dari browser |

Sinkronisasi: setiap perubahan disimpan otomatis 1,5 detik setelahnya; perubahan dari perangkat lain masuk otomatis saat halaman terbuka. Penggabungan selalu mengambil progres yang lebih maju. Tombol "Reset progres" menghapus di semua perangkat. Ada cache offline: tanpa internet progres tersimpan dan terkirim saat online lagi.

## 4. Catatan
- Yang sudah di cloud: akun, XP, rank, title, progres dungeon, jawaban, karakter, Raid, misi harian, preferensi.
- Tahap 2: Forum, Pengumuman guru, pengaturan Raid guru, dan avatar kini juga di cloud (lihat bagian 5). Hanya akun demo (mode pemilik) yang tetap lokal.
- Akun demo (mode pemilik) hanya lokal dan tidak masuk Firebase.
- Keamanan setingkat uji coba kelas: XP ditulis dari browser, jadi siswa yang paham teknis bisa mengubah datanya sendiri. Untuk produksi, pindahkan penilaian ke Cloud Functions.
- Akun lokal lama (versi sebelumnya, login nama+password) tidak otomatis pindah; siswa perlu daftar ulang dengan email.

## 5. Tahap 2: koleksi baru (WAJIB Publish ulang firestore.rules)
Buka Firebase Console > Firestore Database > Rules, tempel seluruh isi `firestore.rules` terbaru, lalu **Publish**. Tanpa ini forum, pengumuman, pengaturan Raid, dan avatar akan ditolak server (muncul toast "Ditolak server").

| Koleksi | Isi | Baca | Tulis |
|---|---|---|---|
| `forum/{id}` | topik: judul, isi, `by`, `uid`, `likes[]`, `pin` | semua akun login | pembuat topik; suka oleh siapa saja (hanya namanya sendiri); sematan hanya guru; hapus oleh guru atau penulis |
| `forumReplies/{id}` | balasan: `tid`, isi, `by`, `likes[]`, `best` | semua akun login | pembuat balasan; `best` oleh guru atau penulis topik |
| `announcements/{id}` | pengumuman guru | semua akun login | hanya guru |
| `settings/raid` | `raidSec`, `raidN` | semua akun login | hanya guru |
| `profiles/{uid}` | avatar publik (`av` rakitan, `ph` foto Base64 maks 45 KB), `name`, `role` | semua akun login | pemilik |

Catatan:
- Tidak perlu membuat indeks baru. Semua koleksi dipantau penuh (cocok untuk kelas puluhan siswa).
- Foto avatar dikompres otomatis menjadi JPEG 128 px (sekitar 5 sampai 10 KB) dan disimpan sebagai teks Base64 di dokumen `users/{uid}` dan `profiles/{uid}`. Firebase Storage tidak dipakai.
- Saat keluar dari akun, data forum dan pengumuman dihapus dari perangkat (aman untuk komputer bersama).
- Forum akun demo (mode pemilik) tetap lokal dan dikembalikan setelah akun cloud keluar.

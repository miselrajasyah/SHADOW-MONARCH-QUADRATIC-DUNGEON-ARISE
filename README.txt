Shadow Monarch's Quadratic Dungeon v8 / Tahap 2 (HTML, CSS, JavaScript)

Cara pakai:
1. Ekstrak zip, lalu buka index.html di Chrome atau Edge (HP juga bisa). Butuh internet untuk GeoGebra dan font.
2. Atau tarik folder ke Netlify Drop (app.netlify.com/drop) untuk dapat link publik.
3. Musik: klik di mana saja sekali, atau tekan tombol "Musik" (browser memblokir suara sebelum ada klik).

Akun: daftar sendiri dengan email (Firebase). Baca PANDUAN_FIREBASE.md untuk setelan awal di Firebase Console. Rumus memakai KaTeX (lihat js/math.js).
Akun lama: daftar sendiri. Akun demo dan tombol demo disembunyikan dari publik. Pemilik membukanya dengan Ctrl+Shift+O (atau ketuk logo 7 kali), kode ada di OWNER_PASS (js/content.js). Kode guru: TEACHER_CODE.

Mau mengubah tulisan, soal, warna, atau XP? Baca PANDUAN_EDIT.md. Semua kodenya sudah diberi komentar.
Alur siswa: Pretest > Gerbang > Rank E, D, C, B, A, S > Wrap-up > Posttest > Sertifikat. Tambahan: Raid Waktu, Forum, dan Karakter interaktif (teman pendamping, galeri, bar HP musuh).

TAHAP 2 (baru):
- Forum, pengumuman guru, dan pengaturan Raid tersinkron lewat Firestore (js/sync.js). WAJIB Publish ulang firestore.rules (lihat PANDUAN_FIREBASE.md bagian 5).
- Langkah Materi di Rank E sampai S: ilustrasi SVG interaktif, tabel, diagram aljabar (js/materi.js, narasi di MATERI pada content.js).
- Skill tiap karakter pendamping (SKILLS di js/characters.js).
- Panduan Istilah System dan tooltip: tombol "?" kanan bawah (js/glossary.js, data GLOS di content.js).
- Avatar rakitan atau foto sendiri: klik avatar di header atau menu Pengaturan (js/avatar.js).

==================================================================
TAHAP 3 (v9 Final)
==================================================================
- Ikon SVG Solo Leveling : js/icons.js (gerbang, belati, pedang, perisai, kristal mana, helm, mahkota, dll). Logo: icons/logo.svg.
- 4 bahasa antarmuka     : tombol globe di navbar. Kamus di js/lang.js, mesin di js/i18n.js. Tambah terjemahan = tambah satu baris.
                           Cakupan saat ini: menu, landing, masuk/daftar, audio, pengaturan, tim. Teks yang belum ada di kamus
                           tetap Indonesia (aman). (Sejak v11 materi dan soal ikut diterjemahkan, lihat bagian v11.)
- Audio                  : js/audio3.js. 5 suasana BGM (Web Audio), mute/unmute, Voice Over karakter (Web Speech API,
                           pitch dan kecepatan berbeda per karakter, tabel VOICES). Suara tersedia tergantung browser/perangkat.
- Tim Pengembang         : js/team.js, data di TIM (content.js). Tampil di landing dan menu "Tim".
- Cache service worker naik ke arise-v10.

==================================================================
TAHAP 3 v10 (uji coba kelas)
==================================================================
- lang.js dilengkapi (sekitar 520 entri EN/JA/KO): dashboard, peta, raid, peringkat, forum, profil, karakter, panduan istilah,
  pengaturan, sertifikat, halaman guru. Isi materi dan soal tetap Indonesia.
- Cek teks yang belum diterjemahkan: buka halaman, tekan F12, ketik I18N.untranslated() di Console.
- Pemilih bahasa memakai bendera SVG (ID, EN, JP, KR), tampil sama di semua OS.
- Voice Over: jika perangkat tidak punya suara bahasa target, otomatis memakai suara default browser dengan pitch dan
  kecepatan tiap karakter tetap berbeda; jika masih gagal, diulang sekali tanpa memilih suara.
- Deskripsi tugas tim di TIM (content.js) sudah disesuaikan peran.

==================================================================
V11 FINAL (10 penyempurnaan)
==================================================================
1. Terjemahan penuh ID/EN/JA/KO : js/lang.js (v10) + js/lang2.js (v11, sekitar 700 entri: modul materi tiap Rank, seluruh bank soal,
   opsi jawaban, petunjuk, pembahasan, label applet, Kamus Istilah, menu baru). Mesin i18n.js menerjemahkan kalimat yang
   terpecah tag <b> sebagai satu blok. Saat bahasa diganti, halaman digambar ulang. Cek sisa teks: I18N.untranslated() dan I18N.blocks().
2. Monster unik per Gate (js/monsters.js): Goblin Kurva (Gerbang), Steel-Fanged Lycan (E), Red-Eye Centipede (D), Ice Bear Alpha (C),
   High Orc Shaman (B), Blood-Red Commander Igris (A), Shadow Monarch Sovereign (S), Raja Parabola (Wrap-up).
   HP Player + serangan balik (js/battle11.js). Damage per jawaban salah: tabel INFO di monsters.js (8, 12, 16, 20, 25, 30, 38; Wrap-up 34; Raid 15).
   HP habis: pilih Pulihkan diri (8 detik, HP jadi 50) atau Ulangi pertempuran Gate.
3. Tab peran di Masuk dan Daftar: Hunter (Siswa) atau God / Guild Master (Guru). Jika peran akun berbeda, otomatis diarahkan ke dashboard yang benar.
4. Panggil Bayangan: tiap dungeon selesai mengekstrak satu prajurit bayangan permanen. Di dungeon atau Raid, maksimal 3 panggilan per
   pertempuran, tiap prajurit sekali. Pemulih: pulihkan 25% HP yang hilang. Pengintai: hapus 1 opsi salah. Pelindung: perisai 1 kali salah.
5. Peta Dungeon SVG interaktif (js/gatemap.js): jalur bercabang, gerbang beranimasi, monster penjaga, posisi Hunter, kabut. Posisi node di tabel POS.
6. Menu baru: Landing = Simulasi Sistem & Ranking Hunter; Siswa = Arsip Bayangan & Pencapaian; Guru = Monitor Live & Ekspor Laporan
   (cetak, CSV, HTML). Semua dihitung dari progres, tanpa mengubah aturan Firestore.
7. SFX megah (js/sfx11.js, Web Audio tanpa file): ARISE, serangan, tumbang, gerbang terbuka, level up, plus System Window dan getaran layar.
8. Panel audio bawah bisa diminimize (js/ui11.js): tombol gir. Pilihan diingat; di layar HP otomatis ringkas saat pertama dibuka.
9. Kamus Istilah (tombol ?) tetap tampil di semua bahasa dan seluruh isinya diterjemahkan.
10. Foto Tim: letakkan misel.jpeg, wildan.jpeg, zidan.jpeg, panji.jpeg, hakim.jpeg di folder img/team/ (lihat img/team/README.txt).
    Jika foto belum ada, bingkai perisai otomatis memakai lencana SVG.
Cache service worker: arise-v11.
Catatan: kondisi pertempuran (HP, perisai) tersimpan di browser tiap perangkat (localStorage), pasukan bayangan dihitung dari progres akun.

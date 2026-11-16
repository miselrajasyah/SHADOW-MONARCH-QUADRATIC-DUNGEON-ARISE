/* ==================================================================
   firebase.js : LAYANAN FIREBASE (Authentication + Cloud Firestore)
   ------------------------------------------------------------------
   File ini adalah ES module (dimuat dengan <script type="module"> di index.html).
   Tugasnya HANYA berbicara dengan Firebase. Logika game dan tampilan ada di app.js dan cloud.js.
   Hasilnya dipasang di window.FB, lalu event "fb-ready" dikirim (atau "fb-fail" jika gagal dimuat,
   misalnya saat offline). Website tetap terbuka walaupun Firebase gagal dimuat.

   Struktur Firestore:
     users/{uid}        data lengkap akun (nama, role, rank, xp, title, done, st, co, dst). Hanya pemilik dan guru yang bisa membaca.
     leaderboard/{uid}  ringkasan publik siswa (tanpa jawaban) untuk halaman Peringkat. Semua akun yang login bisa membaca.
     names/{kunci}      daftar nama hunter yang sudah dipakai, agar nama tidak kembar.
     config/app         dokumen pengaturan (isi: teacherCode), dibuat manual di Firebase Console.
   Tahap 2 (dipakai oleh js/sync.js):
     forum/{id}         topik forum (judul, isi, penulis, suka, sematan). Semua akun login bisa membaca.
     forumReplies/{id}  balasan forum (tid = id topik, isi, penulis, suka, jawaban terbaik).
     announcements/{id} pengumuman guru. Semua akun login membaca, hanya guru menulis.
     settings/raid      pengaturan Raid dari guru (raidSec, raidN). Semua akun login membaca, hanya guru menulis.
     profiles/{uid}     avatar publik (hasil rakitan atau foto Base64) agar tampil di forum dan peringkat.
   Aturan keamanan ada di firestore.rules.
   ================================================================== */
const V = '13.3.0';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;

// Konfigurasi proyek Firebase (aman ditaruh di sisi browser, keamanan diatur oleh firestore.rules).
const firebaseConfig = {
  apiKey: 'AIzaSyDYxWdTn1wUk4NeLqIgB5msFmG1FbwJ-xk',
  authDomain: 'quadratic-dungeon-arise.firebaseapp.com',
  projectId: 'quadratic-dungeon-arise',
  storageBucket: 'quadratic-dungeon-arise.firebasestorage.app',
  messagingSenderId: '396577237026',
  appId: '1:396577237026:web:b58192e7a6ed16e21c827b',
};

// Kunci dokumen untuk nama: huruf kecil, spasi dirapikan, karakter khusus di-encode agar aman dijadikan id dokumen.
const nameKey = (n) =>
  'n~' +
  encodeURIComponent(
    String(n || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' '),
  ).replace(/\./g, '%2E');

try {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(CDN + 'firebase-app.js'),
    import(CDN + 'firebase-auth.js'),
    import(CDN + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = 'id'; // email verifikasi dan reset password berbahasa Indonesia
  // Firestore dengan cache offline: data tetap bisa dibaca dan ditulis saat sinyal buruk, lalu otomatis terkirim.
  let db;
  try {
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch (_) {
    db = F.getFirestore(app);
  }
  const { doc, getDoc, setDoc, getDocs, collection, query, where, onSnapshot, writeBatch, updateDoc, deleteDoc, arrayUnion, arrayRemove } = F;

  const FB = {
    auth,
    db,
    nameKey,
    onAuth: (cb) => A.onAuthStateChanged(auth, cb),
    current: () => auth.currentUser,

    // Apakah nama hunter masih kosong? (dicek sebelum membuat akun)
    async nameFree(name) {
      const s = await getDoc(doc(db, 'names', nameKey(name)));
      return !s.exists();
    },

    // Daftar: buat akun Auth, klaim nama, simpan profil awal, lalu kirim email verifikasi.
    // profile = objek pengguna awal (nama, role, done, st, ...). teacherCode hanya untuk role guru.
    async register({ email, password, profile, teacherCode }) {
      const cred = await A.createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      try {
        const b = writeBatch(db);
        b.set(doc(db, 'names', nameKey(profile.name)), { uid: user.uid });
        const full = Object.assign({}, profile, {
          uid: user.uid,
          email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        if (profile.role === 'teacher') full.teacherCode = teacherCode || '';
        b.set(doc(db, 'users', user.uid), full);
        if (profile.role === 'student')
          b.set(doc(db, 'leaderboard', user.uid), FB.slim(full));
        await b.commit();
      } catch (e) {
        // Gagal menyimpan profil (nama sudah dipakai, kode guru salah, dsb.): batalkan akun agar tidak menggantung.
        try {
          await A.deleteUser(user);
        } catch (_) {}
        throw e;
      }
      try {
        await A.updateProfile(user, { displayName: profile.name });
      } catch (_) {}
      let mailed = true;
      try {
        await A.sendEmailVerification(user);
      } catch (_) {
        mailed = false;
      }
      return { user, mailed };
    },

    login: (email, password) => A.signInWithEmailAndPassword(auth, email, password),
    logout: () => A.signOut(auth),
    sendVerification: () => A.sendEmailVerification(auth.currentUser),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email),
    // Muat ulang status akun (untuk mengecek emailVerified setelah siswa mengklik link di emailnya).
    async refreshUser() {
      if (!auth.currentUser) return null;
      await A.reload(auth.currentUser);
      return auth.currentUser;
    },

    // Ringkasan publik untuk leaderboard (tanpa jawaban soal).
    slim: (u) => ({
      uid: u.uid,
      name: u.name,
      role: u.role,
      rank: u.rank || 'E',
      xp: u.xp || 0,
      title: u.title || '',
      done: u.done || {},
      raid: u.raid || null,
      bonus: u.bonus || 0,
      streak: u.streak || 1,
      updatedAt: Date.now(),
    }),

    async getMe(uid) {
      const s = await getDoc(doc(db, 'users', uid));
      return s.exists() ? s.data() : null;
    },
    // Simpan seluruh dokumen pengguna (menimpa) dan ringkasan leaderboard dalam satu operasi atomik.
    async putMe(uid, full, slim) {
      const b = writeBatch(db);
      b.set(doc(db, 'users', uid), full);
      if (slim) b.set(doc(db, 'leaderboard', uid), slim);
      await b.commit();
    },
    // Dokumen profil yang hilang (akun Auth ada tetapi profil belum ada): klaim nama lalu buat profil.
    async createProfile(uid, full, teacherCode) {
      const b = writeBatch(db);
      b.set(doc(db, 'names', nameKey(full.name)), { uid });
      const f = Object.assign({}, full);
      if (f.role === 'teacher') f.teacherCode = teacherCode || '';
      b.set(doc(db, 'users', uid), f);
      if (f.role === 'student') b.set(doc(db, 'leaderboard', uid), FB.slim(f));
      await b.commit();
    },
    // Pantau dokumen sendiri: perubahan dari perangkat lain masuk otomatis.
    watchMe: (uid, cb, err) =>
      onSnapshot(doc(db, 'users', uid), { includeMetadataChanges: false }, (s) => cb(s), err),
    // Guru: semua siswa (data lengkap). Siswa: ringkasan leaderboard.
    async listStudentsFull() {
      const s = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      return s.docs.map((d) => d.data());
    },
    async listLeaderboard() {
      const s = await getDocs(collection(db, 'leaderboard'));
      return s.docs.map((d) => d.data());
    },

    /* ---------- TAHAP 2: koleksi bersama (forum, pengumuman, pengaturan raid, profil) ---------- */
    // Pantau satu koleksi penuh. cb menerima daftar objek (id dokumen ada di properti _id).
    watchCol: (name, cb, err) =>
      onSnapshot(
        collection(db, name),
        (s) => cb(s.docs.map((d) => Object.assign({}, d.data(), { _id: d.id }))),
        err,
      ),
    watchDoc: (name, id, cb, err) => onSnapshot(doc(db, name, id), (s) => cb(s.exists() ? s.data() : null), err),
    setIn: (name, id, data) => setDoc(doc(db, name, id), data),
    updateIn: (name, id, data) => updateDoc(doc(db, name, id), data),
    // Tambah atau cabut satu nama dari array (suka). Aman dari tabrakan antar perangkat.
    arrIn: (name, id, field, val, add) =>
      updateDoc(doc(db, name, id), { [field]: add ? arrayUnion(val) : arrayRemove(val) }),
    delIn: (name, id) => deleteDoc(doc(db, name, id)),
    // Hapus beberapa dokumen sekaligus: [[koleksi, id], ...]
    async delMany(list) {
      const b = writeBatch(db);
      list.forEach(([c, i]) => b.delete(doc(db, c, i)));
      await b.commit();
    },
    // Tandai satu balasan sebagai jawaban terbaik (dan lepas tanda dari balasan lain) dalam satu operasi.
    async setBest(offIds, onId) {
      const b = writeBatch(db);
      offIds.forEach((i) => b.update(doc(db, 'forumReplies', i), { best: false }));
      if (onId) b.update(doc(db, 'forumReplies', onId), { best: true });
      await b.commit();
    },
  };
  window.FB = FB;
  document.dispatchEvent(new Event('fb-ready'));
} catch (e) {
  console.warn('Firebase gagal dimuat:', e);
  window.FB = null;
  document.dispatchEvent(new Event('fb-fail'));
}

'use strict';
/* ==================================================================
   cloud.js : PENGHUBUNG DATA GAME <-> FIREBASE
   ------------------------------------------------------------------
   Dimuat sesudah app.js. Memakai window.FB dari firebase.js (module).
   Isi:
    1. Helper         : id perangkat, rank hunter, sanitasi data dari server, penggabungan data
    2. Cloud.push     : kirim data akun ke Firestore (otomatis tertunda 1,5 detik setelah save())
    3. Cloud.pull     : ambil data akun, gabungkan dengan data di perangkat
    4. Cloud.others   : guru memuat semua siswa, siswa memuat leaderboard
    5. Cloud.watch    : data dari perangkat lain masuk otomatis saat halaman terbuka
    6. Cloud.auth     : daftar, masuk, keluar, kirim verifikasi, lupa password
    7. Status         : tulisan kecil "Tersimpan di cloud" di pojok atas
   Prinsip: localStorage tetap menjadi cache cepat. Firestore adalah sumber kebenaran lintas perangkat.
   Progres tidak pernah hilang karena penggabungan selalu mengambil yang lebih maju (kecuali tombol Reset).
   ================================================================== */
window.Cloud = (() => {
  const DEV = (() => {
    try {
      let d = localStorage.getItem('arise_dev');
      if (!d) localStorage.setItem('arise_dev', (d = Math.random().toString(36).slice(2, 10)));
      return d;
    } catch (_) {
      return 'x' + Math.random().toString(36).slice(2, 8);
    }
  })();
  const C = {
    ready: false, // Firebase berhasil dimuat
    failed: false, // Firebase gagal dimuat (offline atau diblokir)
    uid: null,
    verified: true,
    timer: 0,
    unsub: null,
    lastOthers: 0,
    status: '',
    busy: 0, // true saat proses daftar berjalan, agar onUser tidak membuat profil ganda
  };
  const ok = () => C.ready && window.FB && FB.current() && me() && me().uid === FB.current().uid;

  /* ---------- 1. HELPER ---------- */
  // hunterRank(): rank dungeon yang sedang ditantang (E sampai S). Semua selesai = S.
  const hunterRank = (u) => {
    const n = AX.find((r) => !u.done[r.c]);
    return n ? n.c : 'S';
  };
  const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
  const CODES = RK.map((r) => r.c);
  // sanitize(): membersihkan data dari server sebelum masuk ke aplikasi (mencegah teks berbahaya ditampilkan sebagai HTML).
  const sanitize = (d, self) => {
    if (!d || typeof d.name !== 'string' || !NAME_RE.test(d.name)) return null;
    const u = {
      name: d.name,
      role: d.role === 'teacher' ? 'teacher' : 'student',
      uid: String(d.uid || ''),
      email: self ? String(d.email || '') : '',
      pw: '',
      cloud: 1,
      streak: num(d.streak, 1),
      last: typeof d.last === 'string' ? d.last.slice(0, 10) : today(),
      bonus: num(d.bonus),
      resetAt: num(d.resetAt),
      createdAt: num(d.createdAt),
      done: {},
      st: {},
    };
    CODES.forEach((c) => {
      const x = d.done && d.done[c];
      if (x && typeof x === 'object')
        u.done[c] = { score: num(x.score), xp: num(x.xp), ts: num(x.ts), up: typeof x.up === 'string' ? x.up.slice(0, 40) : undefined };
      if (u.done[c] && u.done[c].up === undefined) delete u.done[c].up;
    });
    if (d.raid && typeof d.raid === 'object') {
      u.raid = {
        best: num(d.raid.best),
        runs: (Array.isArray(d.raid.runs) ? d.raid.runs : []).slice(0, 10).map((r) => ({
          ts: num(r && r.ts),
          ok: num(r && r.ok),
          n: num(r && r.n),
          pts: num(r && r.pts),
          sec: num(r && r.sec),
        })),
      };
    }
    if (d.st && typeof d.st === 'object')
      Object.entries(d.st).forEach(([k, s]) => {
        if (!/^[A-Z0-9]\d{1,2}$/.test(k) || !s || typeof s !== 'object') return;
        const o = { att: num(s.att), done: s.done ? 1 : 0, ok: !!s.ok, score: num(s.score) };
        if (s.hint) o.hint = 1;
        if (typeof s.hp === 'number' && s.hp >= 0 && s.hp <= 10) o.hp = s.hp; // penalti petunjuk (skill karakter, Tahap 2)
        if (s.ex) o.ex = 1; // percobaan ekstra dari skill karakter (Tahap 2)
        if (typeof s.v === 'string') o.v = s.v.slice(0, 2000);
        else if (Array.isArray(s.v)) o.v = s.v.slice(0, 8).map((x) => String(x).slice(0, 200));
        u.st[k] = o;
      });
    if (self) {
      if (typeof d.co === 'string' && CHARS.some((c) => c.id === d.co)) u.co = d.co;
      if (Array.isArray(d.seen)) u.seen = d.seen.filter((x) => CHARS.some((c) => c.id === x));
      if (d.dq && typeof d.dq === 'object')
        u.dq = {
          d: String(d.dq.d || ''),
          p: Object.assign({}, d.dq.p || {}),
          c: Object.assign({}, d.dq.c || {}),
        };
      if (d.prefs && typeof d.prefs === 'object') u.prefs = d.prefs;
      // Avatar (Tahap 2): rakitan (av) atau foto Base64 (ph). Dibersihkan oleh avatar.js.
      if (window.Avatar) {
        const a = Avatar.clean(d.av, d.ph);
        if (a) {
          u.av = a.av;
          if (a.ph) u.ph = a.ph;
        }
      }
    }
    return u;
  };
  // merge(): gabungkan data perangkat (a) dengan data server (b). Mengambil yang lebih maju agar progres tidak hilang.
  // Jika salah satu pernah menekan Reset (resetAt lebih baru), data yang direset itulah yang dipakai.
  const merge = (a, b) => {
    if (b.resetAt > a.resetAt)
      return Object.assign({}, b, { co: b.co || a.co, prefs: b.prefs || a.prefs, av: b.av || a.av, ph: b.ph || a.ph });
    if (a.resetAt > b.resetAt) return a;
    const o = Object.assign({}, a);
    o.done = Object.assign({}, b.done);
    Object.entries(a.done).forEach(([c, x]) => {
      const y = o.done[c];
      if (!y || num(x.ts) > num(y.ts) || (num(x.ts) === num(y.ts) && x.xp >= y.xp)) o.done[c] = x;
    });
    o.st = Object.assign({}, b.st);
    Object.entries(a.st).forEach(([k, x]) => {
      const y = o.st[k];
      if (!y || (x.done && !y.done) || (!!x.done === !!y.done && x.att > y.att)) o.st[k] = x;
    });
    o.bonus = Math.max(a.bonus || 0, b.bonus || 0);
    o.streak = Math.max(a.streak || 1, b.streak || 1);
    o.last = (a.last || '') >= (b.last || '') ? a.last : b.last;
    const ra = a.raid || { best: 0, runs: [] },
      rb = b.raid || { best: 0, runs: [] },
      seen = new Set(),
      runs = [...ra.runs, ...rb.runs]
        .filter((r) => !seen.has(r.ts) && seen.add(r.ts))
        .sort((x, y) => y.ts - x.ts)
        .slice(0, 10);
    if (ra.best || rb.best || runs.length) o.raid = { best: Math.max(ra.best, rb.best), runs };
    // misi harian: ambil yang tanggalnya lebih baru, jika sama gabungkan progres terbesar
    const da = a.dq,
      db_ = b.dq;
    if (da && db_) {
      if (da.d === db_.d) {
        const p = Object.assign({}, db_.p),
          c = Object.assign({}, db_.c);
        Object.entries(da.p || {}).forEach(([k, v]) => (p[k] = Math.max(p[k] || 0, v)));
        Object.assign(c, da.c || {});
        o.dq = { d: da.d, p, c };
      } else o.dq = da.d > db_.d ? da : db_;
    } else o.dq = da || db_;
    // karakter pilihan dan preferensi: ikut perangkat yang terakhir menyimpan (data server dianggap lebih baru bila ada)
    o.co = b.co || a.co;
    o.seen = Array.from(new Set([...(a.seen || []), ...(b.seen || [])]));
    o.prefs = b.prefs || a.prefs;
    // avatar: ambil yang paling baru diubah (av.ts)
    const ta = (a.av && a.av.ts) || 0,
      tb = (b.av && b.av.ts) || 0;
    if (a.av || b.av) {
      const w = ta > tb ? a : b;
      o.av = w.av || a.av || b.av;
      o.ph = w.ph || (w === a ? b.ph : a.ph);
      if (o.av && o.av.k !== 'photo') delete o.ph;
    }
    return o;
  };
  // payload(): dokumen yang disimpan ke Firestore, termasuk field turunan (rank, xp, title).
  const payload = (u) => {
    const xp = xpOf(u),
      full = {
        uid: u.uid,
        email: u.email || '',
        name: u.name,
        role: u.role,
        rank: hunterRank(u),
        xp,
        title: titleOf(xp),
        done: u.done,
        st: u.st,
        streak: u.streak || 1,
        last: u.last || today(),
        bonus: u.bonus || 0,
        raid: u.raid || null,
        dq: u.dq || null,
        co: u.co || null,
        av: u.av || null,
        ph: u.av && u.av.k === 'photo' ? u.ph || null : null,
        seen: u.seen || [],
        prefs: { theme: DB.theme || 'violet', fs: DB.fs || 100, rm: !!DB.rm, coOff: !!DB.coOff },
        resetAt: u.resetAt || 0,
        createdAt: u.createdAt || Date.now(),
        updatedAt: Date.now(),
        dev: DEV,
      };
    if (u.role === 'teacher') full.teacherCode = u.teacherCode || '';
    // JSON bolak-balik membuang nilai undefined (Firestore menolaknya)
    return JSON.parse(JSON.stringify(full));
  };
  const applyPrefsFrom = (u) => {
    if (u.prefs) {
      DB.theme = u.prefs.theme || DB.theme;
      DB.fs = u.prefs.fs || DB.fs;
      DB.rm = u.prefs.rm != null ? u.prefs.rm : DB.rm;
      DB.coOff = u.prefs.coOff != null ? u.prefs.coOff : DB.coOff;
      applyPrefs();
    }
  };

  /* ---------- 7. STATUS ---------- */
  const setStatus = (s, tip) => {
    C.status = s;
    const e = document.getElementById('cst');
    if (!e) return;
    const L = {
      ok: ['Tersimpan di cloud', 'ok'],
      busy: ['Menyimpan...', 'busy'],
      off: ['Offline: tersimpan di perangkat', 'off'],
      err: ['Gagal sinkron, mencoba lagi', 'err'],
      local: ['Mode lokal', 'off'],
    }[s];
    e.hidden = !L;
    if (L) {
      e.textContent = '☁ ' + L[0];
      e.className = 'cs ' + L[1];
      e.title = tip || '';
    }
  };

  /* ---------- 2. PUSH ---------- */
  C.dirty = () => {
    if (!ok()) return;
    clearTimeout(C.timer);
    setStatus('busy');
    C.timer = setTimeout(C.push, 1500);
  };
  C.push = async () => {
    clearTimeout(C.timer);
    if (!ok()) return;
    const u = me(),
      full = payload(u);
    try {
      await FB.putMe(u.uid, full, u.role === 'student' ? FB.slim(full) : null);
      // Tahap 2: avatar publik (profiles/{uid}) hanya ditulis saat avatar berubah.
      if (window.Sync) await Sync.pushProfile(u).catch((e) => console.warn('profil gagal', e));
      setStatus(navigator.onLine === false ? 'off' : 'ok', 'Terakhir: ' + new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.warn('push gagal', e);
      setStatus(navigator.onLine === false ? 'off' : 'err', String(e && e.code || e));
      if (navigator.onLine !== false) C.timer = setTimeout(C.push, 8000);
    }
  };
  // Kirim segera saat halaman ditutup atau tab disembunyikan.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && C.timer) C.push();
  });
  addEventListener('online', () => ok() && C.push());
  addEventListener('offline', () => C.uid && setStatus('off'));

  /* ---------- 3. PULL ---------- */
  // pull(): ambil dokumen sendiri, gabungkan, dan simpan di DB.users[nama].
  C.pull = async (user) => {
    let d = await FB.getMe(user.uid);
    if (!d) {
      // Akun Auth ada tetapi profil belum ada (misal gagal saat mendaftar). Buat profil baru dengan nama dari akun.
      let base = (user.displayName || (user.email || 'hunter').split('@')[0] || 'hunter')
        .replace(/[^\p{L}\p{N} ._-]/gu, '')
        .slice(0, 18);
      if (base.length < 2) base = 'hunter';
      for (let i = 0; i < 4 && !d; i++) {
        const name = i ? base + Math.floor(100 + Math.random() * 900) : base;
        if (!(await FB.nameFree(name))) continue;
        const p = Object.assign(mk(name, 'student', ''), { uid: user.uid, email: user.email, createdAt: Date.now() });
        delete p.pw;
        const f = payload(p);
        await FB.createProfile(user.uid, f);
        d = f;
      }
      if (!d) throw new Error('profil');
    }
    const remote = sanitize(d, true);
    if (!remote) throw new Error('profil-rusak');
    // data teacherCode ikut dibawa agar push berikutnya tidak menghapusnya
    if (remote.role === 'teacher') remote.teacherCode = d.teacherCode || '';
    const old = DB.users[remote.name];
    const local = old && old.cloud && old.uid === remote.uid ? old : null;
    // hapus entri lama dengan nama sama yang bukan akun ini (misal akun demo atau lokal lama)
    const u = local ? Object.assign(merge(local, remote), { uid: remote.uid, email: remote.email, cloud: 1, name: remote.name, role: remote.role, pw: '' }) : remote;
    if (remote.role === 'teacher') u.teacherCode = remote.teacherCode;
    DB.users[u.name] = u;
    DB.me = u.name;
    C.uid = u.uid;
    C.verified = !!user.emailVerified;
    applyPrefsFrom(u);
    localStorage.setItem(KEY, JSON.stringify(DB));
    // jika hasil gabungan berbeda dari server, kirim balik
    const mergedXp = xpOf(u);
    if (mergedXp !== num(d.xp) || Object.keys(u.st).length !== Object.keys(remote.st).length) C.dirty();
    return u;
  };

  /* ---------- 4. OTHERS ---------- */
  // Guru: semua siswa lengkap. Siswa: leaderboard. Hasilnya masuk ke DB.users agar halaman Peringkat dan Kelas bekerja.
  C.others = async (force) => {
    if (!ok()) return false;
    if (!force && Date.now() - C.lastOthers < 15000) return false;
    C.lastOthers = Date.now();
    try {
      const list = me().role === 'teacher' ? await FB.listStudentsFull() : await FB.listLeaderboard();
      const keep = {};
      const sig = () =>
        Object.values(DB.users)
          .filter((x) => x.cloud)
          .map((x) => x.name + ':' + xpOf(x) + ':' + Object.keys(x.st || {}).length + ':' + ((x.raid || {}).best || 0))
          .sort()
          .join('|');
      const before = sig();
      list.forEach((d) => {
        if (d.role !== 'student' || d.uid === C.uid) return;
        const u = sanitize(d, false);
        if (u) keep[u.name] = u;
      });
      // buang siswa cloud lama yang tidak ada lagi, lalu masukkan yang baru
      Object.keys(DB.users).forEach((n) => {
        const x = DB.users[n];
        if (x.cloud && x.uid !== C.uid) delete DB.users[n];
      });
      Object.entries(keep).forEach(([n, u]) => {
        if (!DB.users[n] || DB.users[n].cloud) DB.users[n] = u;
      });
      localStorage.setItem(KEY, JSON.stringify(DB));
      return sig() !== before; // true jika ada yang berubah (perlu gambar ulang)
    } catch (e) {
      console.warn('others gagal', e);
      return false;
    }
  };

  /* ---------- 5. WATCH ---------- */
  const LIVE = ['#/dash', '#/map', '#/profile', '#/board', '#/chars', '#/settings', '#/help'];
  C.watch = () => {
    if (C.unsub) C.unsub();
    C.unsub = FB.watchMe(
      C.uid,
      (s) => {
        if (!s.exists() || s.metadata.hasPendingWrites) return;
        const d = s.data();
        if (d.dev === DEV || !ok()) return;
        const remote = sanitize(d, true);
        if (!remote) return;
        if (remote.role === 'teacher') remote.teacherCode = d.teacherCode || '';
        const u = me(),
          m = Object.assign(merge(u, remote), { uid: u.uid, email: u.email, cloud: 1, name: u.name, role: u.role, pw: '' });
        if (u.role === 'teacher') m.teacherCode = u.teacherCode;
        DB.users[u.name] = m;
        localStorage.setItem(KEY, JSON.stringify(DB));
        applyPrefsFrom(m);
        toast('Data dari perangkat lain tersinkron');
        if (LIVE.includes(location.hash || '#/dash')) route();
      },
      (e) => console.warn('watch error', e),
    );
  };

  // Guru yang membuka halaman kelas: segarkan data siswa tiap 30 detik (pantau uji coba secara langsung).
  setInterval(() => {
    if (!ok() || me().role !== 'teacher' || document.visibilityState !== 'visible') return;
    if (!['#/class', '#/analysis', '#/resp', '#/board'].includes(location.hash || '#/class')) return;
    C.others(true).then((ch) => ch && !typingNow() && route());
  }, 30000);

  /* ---------- 6. AUTH ---------- */
  const MSG = {
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan Masuk.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter).',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/user-not-found': 'Email atau password salah.',
    'auth/wrong-password': 'Email atau password salah.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    'auth/network-request-failed': 'Tidak ada koneksi internet. Coba lagi saat online.',
    'auth/user-disabled': 'Akun ini dinonaktifkan.',
    'auth/missing-password': 'Isi password dulu.',
    'permission-denied': 'Server menolak. Cek kode guru, atau nama sudah dipakai orang lain.',
    unavailable: 'Server tidak terjangkau. Cek koneksi internet.',
  };
  C.msg = (e) => MSG[e && e.code] || 'Terjadi kesalahan (' + ((e && (e.code || e.message)) || '?') + ').';

  C.register = async ({ name, email, pw, role, code }) => {
    if (!window.FB) throw { code: 'unavailable' };
    if (!(await FB.nameFree(name).catch(() => true))) throw { code: 'nama-dipakai' };
    const p = mk(name, role, '');
    delete p.pw;
    p.cloud = 1;
    const prof = JSON.parse(JSON.stringify(payload(Object.assign(p, { uid: '', email }))));
    C.busy = 1;
    try {
      const r = await FB.register({ email, password: pw, profile: prof, teacherCode: code });
      C.busy = 0;
      await C.onUser(r.user, r.mailed);
      return r;
    } finally {
      C.busy = 0;
    }
  };

  // onUser(): dipanggil setiap status login berubah (termasuk saat halaman dibuka kembali dengan sesi tersimpan).
  // onUser(): satu pemanggilan pada satu waktu per akun (login manual dan onAuthStateChanged tidak memuat ganda).
  C.onUser = (user, mailed) => {
    if (C.busy) return Promise.resolve();
    if (user && C.pullP && C.pullUid === user.uid) return C.pullP;
    const p = C._onUser(user, mailed);
    if (user) {
      C.pullP = p;
      C.pullUid = user.uid;
      p.finally(() => {
        if (C.pullP === p) C.pullP = C.pullUid = null;
      });
    }
    return p;
  };
  C._onUser = async (user, mailed) => {
    if (!user) {
      // Keluar atau sesi berakhir. Akun demo (mode pemilik) tidak terpengaruh.
      if (DB.me && me() && me().cloud) cloudSignedOut();
      return;
    }
    try {
      const u = await C.pull(user);
      C.verified = !!user.emailVerified;
      cloudAfterLogin(u, false, mailed);
    } catch (e) {
      console.warn('pull gagal', e);
      // Offline dan punya cache lokal untuk akun ini: lanjut memakai cache.
      const cached = Object.values(DB.users).find((x) => x.cloud && x.uid === user.uid);
      if (cached) {
        DB.me = cached.name;
        C.uid = cached.uid;
        C.verified = !!user.emailVerified;
        setStatus('off');
        cloudAfterLogin(cached, true);
      } else {
        $('#er') && ($('#er').textContent = 'Gagal memuat data akun: ' + C.msg(e));
        try {
          await FB.logout();
        } catch (_) {}
      }
    }
  };
  // Membersihkan data siswa lain dan akun cloud dari perangkat saat keluar (aman untuk komputer bersama).
  C.purge = () => {
    Object.keys(DB.users).forEach((n) => DB.users[n].cloud && delete DB.users[n]);
    DB.me = null;
    save();
  };
  C.logout = async () => {
    clearTimeout(C.timer);
    if (ok()) await C.push().catch(() => {});
    window.Sync && Sync.stop(); // hentikan pantauan forum sebelum keluar (hindari galat izin)
    if (C.unsub) C.unsub();
    C.unsub = null;
    C.uid = null;
    try {
      FB && (await FB.logout());
    } catch (_) {}
    C.purge();
  };

  // Dipanggil app.js: pastikan Firebase siap atau gagal.
  C.init = () => {
    const go = () => {
      C.ready = true;
      FB.onAuth(C.onUser);
    };
    if (window.FB) go();
    else if (window.FB === null) C.failed = true;
    else {
      document.addEventListener('fb-ready', go, { once: true });
      document.addEventListener('fb-fail', () => (C.failed = true), { once: true });
    }
  };
  Object.assign(C, { hunterRank, sanitize, merge, payload, setStatus, DEV, ok });
  return C;
})();
Cloud.init();

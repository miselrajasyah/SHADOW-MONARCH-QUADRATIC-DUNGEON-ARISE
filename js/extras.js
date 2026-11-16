/* ==================================================================
   extras.js : FITUR TAMBAHAN
   ------------------------------------------------------------------
   1. THEMES / applyPrefs : tema warna, ukuran teks, kurangi animasi
   2. DQ                  : Misi Harian (daily quest) dan klaim XP
   3. dashExtras          : kartu Misi Harian, Pasukan Bayangan, dan Pengumuman di dashboard
   4. podium              : podium juara 1 sampai 3 di halaman Peringkat
   5. annForm / annWire   : pengumuman dari guru
   6. burst               : ledakan konfeti saat jawaban benar atau dungeon selesai
   7. splashInit          : layar pembuka bergaya sistem (juga memulai musik pada ketukan pertama)
   8. settingsView        : halaman Pengaturan
   9. Mode pemilik        : akun demo disembunyikan dari publik, hanya muncul setelah kode pemilik dimasukkan
   10. Pintasan keyboard  : angka 1 sampai 9 memilih opsi, Enter memeriksa, panah kiri/kanan pindah soal
   File ini dimuat sebelum app.js dan memakai fungsi app.js saat dijalankan (me, DB, save, toast, route, dll).
   ================================================================== */

/* ---------- 1. TEMA DAN PREFERENSI ---------- */
// Tambah tema baru dengan menambah satu baris. v = variabel warna CSS yang diganti.
const THEMES = {
  violet: { n: 'Violet (bawaan)', v: { '--bl': '#4d8bff', '--vi': '#9a5aff', '--cy': '#5ee6f2' } },
  crimson: { n: 'Crimson', v: { '--bl': '#ff5a7a', '--vi': '#c93a8a', '--cy': '#ffb86b' } },
  emerald: { n: 'Emerald', v: { '--bl': '#2fd6a0', '--vi': '#4d8bff', '--cy': '#b8ffd9' } },
  gold: { n: 'Gold', v: { '--bl': '#ffb84d', '--vi': '#ff7a45', '--cy': '#ffe28a' } },
};
const applyPrefs = () => {
  const t = THEMES[DB.theme] || THEMES.violet;
  Object.entries(t.v).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  document.documentElement.style.setProperty('--fs', (DB.fs || 100) / 100);
  document.body.classList.toggle('rm', !!DB.rm);
  document.body.classList.toggle('owner', !!DB.owner);
};

/* ---------- 2. MISI HARIAN ----------
   id: kunci progres, t: tulisan misi, n: target, xp: hadiah XP bonus.
   Progres bertambah lewat dq('id') yang dipanggil di app.js (jawaban benar, dungeon selesai, raid, forum). */
const DQ = [
  { id: 'ans', t: 'Jawab 5 soal dengan benar', n: 5, xp: 20 },
  { id: 'rank', t: 'Taklukkan 1 dungeon', n: 1, xp: 40 },
  { id: 'raid', t: 'Selesaikan 1 Raid Waktu', n: 1, xp: 30 },
  { id: 'forum', t: 'Berdiskusi di forum 1 kali', n: 1, xp: 15 },
];
const dqState = (u) => {
  const t = today();
  if (!u.dq || u.dq.d !== t) u.dq = { d: t, p: {}, c: {} };
  return u.dq;
};
const dq = (id, n = 1) => {
  if (!DB.me || !me() || me().role !== 'student') return;
  const s = dqState(me());
  s.p[id] = (s.p[id] || 0) + n;
  save();
};

/* ---------- 3. KARTU DASHBOARD ---------- */
const armyHTML = (u) => {
  const n = RK.filter((r) => u.done[r.c]).length;
  return `<div class="armyrow">${RK.map((r) => `<div class="sol ${u.done[r.c] ? 'on' : ''}" data-sol="${r.n}" title="${esc(r.n)}"><i></i><b>${RI(r.c)}</b></div>`).join('')}</div><p class="mut sm">${n} dari ${RK.length} prajurit bangkit. Taklukkan dungeon untuk merekrut prajurit baru. Klik prajurit untuk memberi hormat.</p>`;
};
const annHTML = () => {
  const a = (DB.ann || []).slice(0, 3);
  return a.length
    ? `<div class="card rv"><small class="tag">[ SYSTEM ] PENGUMUMAN GURU</small>${a.map((x) => `<p><b>${esc(x.by)}</b> <span class="mut sm">${ago(x.ts)}</span><br>${esc(x.text)}</p>`).join('')}</div>`
    : '';
};
const dashExtras = (u) => {
  const s = dqState(u),
    mid = new Date();
  mid.setHours(24, 0, 0, 0);
  const hrs = Math.max(1, Math.round((mid - Date.now()) / 36e5));
  const q = DQ.map((d) => {
    const p = Math.min(d.n, s.p[d.id] || 0),
      done = p >= d.n;
    return `<div class="dq ${done ? 'ok' : ''}"><div style="flex:1"><b>${d.t}</b> <small class="mut">+${d.xp} XP</small><div class="pb" style="width:100%"><i style="width:${(p / d.n) * 100}%"></i></div></div>${s.c[d.id] ? '<span class="tagc">Diklaim</span>' : done ? `<button class="btn" data-dq="${d.id}">Klaim</button>` : `<span class="mut sm">${p}/${d.n}</span>`}</div>`;
  }).join('');
  return `<div class="grid2"><div class="card rv"><small class="tag">[ SYSTEM ] MISI HARIAN</small><h3>Daily Quest</h3>${q}<p class="mut sm">Reset dalam sekitar ${hrs} jam.</p></div><div class="card rv"><small class="tag">[ SYSTEM ] PASUKAN BAYANGAN</small><h3>Pasukan Bayanganmu</h3>${armyHTML(u)}</div></div>${annHTML()}`;
};

/* ---------- 4. PODIUM ---------- */
const podium = (all) => {
  if (!all.length) return '';
  const o = [1, 0, 2].filter((i) => all[i]);
  return `<div class="podium rv">${o.map((i) => `<div class="pod p${i + 1}"><span class="podav" style="border-color:${['#ffd86b', '#cfd8ff', '#ff9a5a'][i]}">${Avatar.html(all[i].name, 52)}</span><b>${esc(all[i].name)}</b><small>${xpOf(all[i])} XP</small><div class="blk"><i>${IC(['crown', 'crystal', 'shield'][i])}</i></div></div>`).join('')}</div>`;
};

/* ---------- 5. PENGUMUMAN GURU ---------- */
const annForm = () =>
  `<div class="card rv"><small class="tag">[ SYSTEM ] PENGUMUMAN KE SISWA</small><textarea id="annt" rows="2" maxlength="300" placeholder="Tulis pengumuman untuk siswa..."></textarea><p style="margin-top:10px"><button class="btn" id="annb">Kirim pengumuman</button></p>${(DB.ann || []).map((x, i) => `<p class="sm"><span class="mut">${ago(x.ts)}</span> ${esc(x.text)} <a class="mut" data-andel="${i}" style="cursor:pointer">[hapus]</a></p>`).join('')}</div>`;
const annWire = () => {
  const b = $('#annb');
  if (b)
    b.onclick = () => {
      const t = $('#annt').value.trim();
      if (t.length < 3) return toast('Pengumuman terlalu pendek');
      if (window.Sync && Sync.isOn()) Sync.annAdd(t);
      else (DB.ann = DB.ann || []).unshift({ text: t, by: DB.me, ts: Date.now() });
      save();
      toast(window.Sync && Sync.isOn() ? 'Pengumuman terkirim ke semua siswa' : 'Pengumuman terkirim');
      route();
    };
};

/* ---------- 6. KONFETI ---------- */
// burst(elemen, jumlah): ledakan partikel dari elemen (atau tengah layar).
const burst = (el, n = 40) => {
  if (DB.rm || !$('#cf')) return;
  const c = $('#cf'),
    x = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  let X = innerWidth / 2,
    Y = innerHeight / 3;
  if (el && el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    X = r.left + r.width / 2;
    Y = r.top;
  }
  const cols = ['#9a5aff', '#4d8bff', '#5ee6f2', '#ffd86b', '#f472a8'];
  const P = Array.from({ length: n }, () => ({
    x: X,
    y: Y,
    vx: (Math.random() - 0.5) * 10,
    vy: -Math.random() * 10 - 3,
    s: Math.random() * 5 + 3,
    c: cols[Math.floor(Math.random() * 5)],
    l: 60 + Math.random() * 30,
  }));
  cancelAnimationFrame(burst.r);
  (function f() {
    x.clearRect(0, 0, c.width, c.height);
    let alive = 0;
    P.forEach((p) => {
      if (p.l <= 0) return;
      alive++;
      p.l--;
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      x.globalAlpha = Math.min(1, p.l / 30);
      x.fillStyle = p.c;
      x.fillRect(p.x, p.y, p.s, p.s);
    });
    x.globalAlpha = 1;
    if (alive) burst.r = requestAnimationFrame(f);
    else x.clearRect(0, 0, c.width, c.height);
  })();
};

/* ---------- 7. LAYAR PEMBUKA ---------- */
// Tampil sekali per sesi. Ketukan atau tombol Enter menutupnya dan sekaligus memulai musik. Matikan lewat SPLASH = false di content.js.
const splashInit = () => {
  const s = $('#splash');
  if (!s) return;
  if (!SPLASH || sessionStorage.getItem('ad_splash') || DB.rm) {
    s.hidden = true;
    return;
  }
  const L = [
    '[SYSTEM] Memindai hunter...',
    '[SYSTEM] Dungeon fungsi kuadrat terdeteksi.',
    '[SYSTEM] Kamu terpilih sebagai pemain.',
  ].map((x) => (window.I18N ? I18N.t(x) : x)); // Tahap 3: mengikuti bahasa pilihan
  let i = 0;
  const t = $('#splt');
  const next = () => {
    if (i >= L.length) {
      $('#splk').hidden = false;
      return;
    }
    const line = L[i++],
      p = document.createElement('p');
    t.append(p);
    let k = 0;
    const iv = setInterval(() => {
      p.textContent = line.slice(0, ++k);
      if (k >= line.length) {
        clearInterval(iv);
        setTimeout(next, 350);
      }
    }, 28);
  };
  next();
  const close = () => {
    if (s.hidden) return;
    sessionStorage.setItem('ad_splash', '1');
    s.classList.add('out');
    setTimeout(() => (s.hidden = true), 700);
    if (!AU.mus && !AU.manual) {
      AU.manual = 1;
      AU.start();
      sync();
    }
  };
  s.onclick = close;
  document.addEventListener('keydown', (e) => {
    if (!s.hidden && ['Enter', ' ', 'Escape'].includes(e.key)) close();
  });
};

/* ---------- 8. PENGATURAN ---------- */
const settingsView =
  () => `<div class="sys rv"><small class="tag">[ SYSTEM ] PENGATURAN</small><h2>Pengaturan</h2></div>
<div class="grid2"><div class="card rv"><h3>Tampilan</h3><label>Tema warna<select id="sth">${Object.entries(
    THEMES,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${k === (DB.theme || 'violet') ? 'selected' : ''}>${v.n}</option>`,
    )
    .join(
      '',
    )}</select></label><label>Ukuran teks: <b id="sfv">${DB.fs || 100}%</b><input id="sfs" type="range" min="85" max="130" value="${DB.fs || 100}"></label><label class="chk"><input id="srm" type="checkbox" ${DB.rm ? 'checked' : ''}> Kurangi animasi</label></div>
<div class="card rv"><h3>Avatar dan istilah</h3><p style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${Avatar.html(me().name, 54)}<button class="btn ghost" data-go="#/avatar">Ubah avatar</button><button class="btn ghost" data-gl="open">Panduan Istilah System</button></p></div>
<div class="card rv"><h3>Suara dan teman</h3><p><button class="btn ghost" id="smu">Musik: ${AU.mus ? 'ON' : 'OFF'}</button> <button class="btn ghost" id="ssf">SFX: ${AU.sfxOn ? 'ON' : 'OFF'}</button></p><p style="margin-top:10px"><button class="btn ghost" id="sco">Teman pendamping: ${Co.on() ? 'ON' : 'OFF'}</button></p>${window.Aud ? Aud.settingsHTML() : ''}</div>
<div class="card rv"><h3>Bahasa</h3><p class="mut sm">Mengganti bahasa antarmuka (menu, tombol, dan keterangan). Materi dan soal tetap berbahasa Indonesia.</p><div class="lgsw lgset" data-lgslot="set"></div></div>
<div class="card rv"><h3>Data</h3><p class="mut sm">${me().cloud ? 'Akun: ' + esc(me().email || '-') + '. Progresmu tersimpan di cloud dan ikut ke perangkat mana pun yang kamu pakai masuk.' : 'Akun demo: data hanya tersimpan di browser ini.'}</p>${me().cloud ? '<p><button class="btn ghost" id="ssy">Sinkronkan sekarang</button></p>' : ''}<p><button class="btn ghost" data-act="code">Salin kode progres</button> <button class="btn ghost" id="sex">Unduh cadangan</button></p>${me().role === 'teacher' ? '' : '<p style="margin-top:10px"><button class="btn ghost" data-act="reset">Reset progres</button></p>'}</div>
<div class="card rv"><h3>Aplikasi</h3><p class="mut sm">Pasang website ini di layar utama HP atau komputer agar terbuka seperti aplikasi.</p><p><button class="btn" id="sin" ${window.__pwa ? '' : 'disabled'}>Pasang aplikasi</button></p><p class="mut sm">${window.__pwa ? '' : 'Aktif jika browser mendukung dan website dibuka lewat https (misalnya di Netlify).'}</p>${DB.owner ? '<p style="margin-top:10px"><button class="btn ghost" id="sow">Matikan mode pemilik</button></p>' : ''}</div></div>`;
const settingsPost = () => {
  $('#sth').onchange = (e) => {
    DB.theme = e.target.value;
    save();
    applyPrefs();
  };
  $('#sfs').oninput = (e) => {
    DB.fs = +e.target.value;
    $('#sfv').textContent = DB.fs + '%';
    save();
    applyPrefs();
  };
  $('#srm').onchange = (e) => {
    DB.rm = e.target.checked;
    save();
    applyPrefs();
  };
  window.Aud && Aud.settingsWire(); // Tahap 3: pilihan suasana musik dan Voice Over
  window.I18N && I18N.mount();
  $('#smu').onclick = () => {
    $('#bm').click();
    $('#smu').textContent = 'Musik: ' + (AU.mus ? 'ON' : 'OFF');
  };
  $('#ssf').onclick = () => {
    $('#bs').click();
    $('#ssf').textContent = 'SFX: ' + (AU.sfxOn ? 'ON' : 'OFF');
  };
  $('#sco').onclick = () => {
    $('#bc').click();
    $('#sco').textContent = 'Teman pendamping: ' + (Co.on() ? 'ON' : 'OFF');
  };
  if ($('#ssy'))
    $('#ssy').onclick = async () => {
      await Cloud.push();
      await Cloud.others(true);
      toast('Sinkronisasi selesai');
    };
  $('#sex').onclick = () => {
    const u = Object.assign({}, me());
    delete u.pw;
    const a = document.createElement('a');
    a.href =
      'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(u, null, 2));
    a.download = 'cadangan_' + u.name + '.json';
    a.click();
  };
  $('#sin').onclick = () => {
    if (window.__pwa) window.__pwa.prompt();
  };
  if ($('#sow'))
    $('#sow').onclick = () => {
      DB.owner = 0;
      save();
      applyPrefs();
      toast('Mode pemilik dimatikan');
      route();
    };
};
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwa = e;
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
  navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- 9. MODE PEMILIK ----------
   Akun demo (Misel, dst, dan Guru Demo) TIDAK tampil untuk publik. Tombol demo hanya muncul setelah kode pemilik dimasukkan.
   Cara membuka: tekan Ctrl+Shift+O (komputer), atau ketuk logo ARISE 7 kali dengan cepat (HP).
   Kode ada di OWNER_PASS (content.js). Catatan: ini hanya penyembunyi tampilan, bukan keamanan sungguhan, karena kode ada di file JavaScript. */
const ownerAsk = () => {
  const p = prompt('Kode pemilik:');
  if (p === null) return;
  if (p === OWNER_PASS) {
    DB.owner = 1;
    seedDemo();
    save();
    applyPrefs();
    toast('Mode pemilik aktif. Tombol demo muncul di jendela Masuk.');
  } else toast('Kode salah.');
};
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    ownerAsk();
  }
});
let _ot = 0,
  _oc = 0;
document.addEventListener('click', (e) => {
  if (e.target.closest('.brand')) {
    const n = Date.now();
    _oc = n - _ot < 2000 ? _oc + 1 : 1;
    _ot = n;
    if (_oc >= 7) {
      _oc = 0;
      ownerAsk();
    }
  }
  const d = e.target.closest('[data-dq]');
  if (d) {
    const s = dqState(me()),
      q = DQ.find((x) => x.id === d.dataset.dq);
    if (q && !s.c[q.id] && (s.p[q.id] || 0) >= q.n) {
      s.c[q.id] = 1;
      const gx = Math.round(q.xp * Skill.dqMul()); // skill karakter bisa menambah hadiah misi harian
      me().bonus = (me().bonus || 0) + gx;
      save();
      toast('+' + gx + ' XP bonus!');
      burst(d);
      AU.sfx('up');
      route();
    }
  }
  const sol = e.target.closest('.sol.on');
  if (sol) {
    AU.sfx('hit');
    sol.classList.remove('hop');
    void sol.offsetWidth;
    sol.classList.add('hop');
    toast(sol.dataset.sol + ': siap, Tuan!');
  }
  const ad = e.target.closest('[data-andel]');
  if (ad) {
    const ax = DB.ann[+ad.dataset.andel];
    if (ax && ax.id && window.Sync && Sync.isOn()) Sync.annDel(ax.id);
    DB.ann.splice(+ad.dataset.andel, 1);
    save();
    route();
  }
});

/* ---------- 10. PINTASAN KEYBOARD ---------- */
document.addEventListener('keydown', (e) => {
  if (!DB.me || e.ctrlKey || e.metaKey || e.altKey) return;
  const el = e.target,
    typing =
      /INPUT|TEXTAREA|SELECT/.test(el.tagName) && el.type !== 'radio' && el.type !== 'checkbox';
  const it = $('#rq') || $('.item');
  if (!it || (typing && e.key !== 'Enter')) return;
  if (/^[1-9]$/.test(e.key)) {
    const l = $$('.opts label', it)[+e.key - 1],
      i = l && l.querySelector('input');
    if (i && !i.disabled) {
      i.click();
      e.preventDefault();
    }
  } else if (e.key === 'Enter' && el.tagName !== 'TEXTAREA') {
    const b = $('#rk2') || $('.chk', it) || $('[data-act=finish]') || $('.nav2 .btn:not(.ghost)');
    if (b && !b.hidden && !b.disabled) b.click();
  } else if (e.key === 'ArrowRight') {
    const n = $('.nav2 .btn:not(.ghost)');
    if (n) n.click();
  } else if (e.key === 'ArrowLeft') {
    const p = $('.nav2 .btn.ghost');
    if (p) p.click();
  }
});

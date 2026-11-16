'use strict';
/* ==================================================================
   monsters.js : MONSTER PENJAGA SETIAP GATE (v11)
   ------------------------------------------------------------------
   Tiap Gate / Rank punya monster SVG sendiri (bukan Parabo terus-menerus):
     0 Gerbang : Goblin Kurva            E : Steel-Fanged Lycan        D : Red-Eye Centipede
     C         : Ice Bear Alpha          B : High Orc Shaman           A : Blood-Red Commander Igris
     S         : Shadow Monarch Sovereign
   Wrap-up (R) tetap dijaga Raja Parabola dari characters.js.
   Mon.svg(kode, mood)  : gambar SVG. mood = 'idle' | 'atk' | 'hurt' | 'ko'
   Mon.info(kode)       : { n: nama, dmg: damage ke Player tiap jawaban salah, role, col }
   Mon.dmg(kode)        : damage monster. Mau menyeimbangkan? Ubah angka dmg di tabel INFO di bawah.
   Mon.shadow(kode, s)  : prajurit bayangan (versi siluet monster yang sudah ditaklukkan, dipakai Arsip dan peta).
   ================================================================== */
window.Mon = (() => {
  let uid = 0;
  /* dmg = pengurangan HP Player (maks 100) setiap jawaban salah. Makin tinggi Rank makin besar. */
  const INFO = {
    0: { n: 'Goblin Kurva', role: 'Penjaga Gerbang', dmg: 8, col: '#6bbf59', buff: 'Pengintai' },
    E: { n: 'Steel-Fanged Lycan', role: 'Serigala Taring Baja', dmg: 12, col: '#4d8bff', buff: 'Pemulih' },
    D: { n: 'Red-Eye Centipede', role: 'Kelabang Mata Merah', dmg: 16, col: '#4cc38a', buff: 'Pengintai' },
    C: { n: 'Ice Bear Alpha', role: 'Beruang Es Alfa', dmg: 20, col: '#ffd86b', buff: 'Pelindung' },
    B: { n: 'High Orc Shaman', role: 'Dukun Orc Tinggi', dmg: 25, col: '#f472a8', buff: 'Pemulih' },
    A: { n: 'Blood-Red Commander Igris', role: 'Komandan Ksatria Merah', dmg: 30, col: '#b03fd6', buff: 'Pelindung' },
    S: { n: 'Shadow Monarch Sovereign', role: 'Penguasa Bayangan', dmg: 38, col: '#ffffff', buff: 'Pengintai' },
  };
  const KEYS = ['0', 'E', 'D', 'C', 'B', 'A', 'S'];
  const eye = (x, y, r, col, mood, glow) => {
    if (mood === 'ko')
      return `<path d="M${x - r} ${y - r}l${2 * r} ${2 * r}M${x + r} ${y - r}l${-2 * r} ${2 * r}" stroke="#222" stroke-width="2.6" stroke-linecap="round"/>`;
    const sq = mood === 'hurt' ? `<path d="M${x - r - 1} ${y - r}h${2 * r + 2}" stroke="#111" stroke-width="2.4"/>` : '';
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" ${glow ? `filter="url(#g${uid})"` : ''}/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#111"/>${sq}`;
  };
  const defs = (c) =>
    `<defs><filter id="g${uid}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="a${uid}" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><ellipse cx="80" cy="96" rx="74" ry="66" fill="url(#a${uid})" class="maura"/>`;

  const ART = {
    /* 0: Goblin Kurva, goblin hijau bertelinga runcing dengan belati melengkung seperti parabola */
    0: (m) => `${defs('#6bbf59')}
      <g class="mbody">
        <path d="M30 118q-10-18 6-32q14 8 20 20z" fill="#4b8a3d"/><path d="M130 118q10-18-6-32q-14 8-20 20z" fill="#4b8a3d"/>
        <path d="M56 146q-6-34 24-34t24 34z" fill="#7a5532"/><path d="M62 146l8-22 10 8 10-8 8 22z" fill="#5d3f23"/>
        <path d="M34 66q-30-6-26-34q22 6 38 22z" fill="#6bbf59"/><path d="M126 66q30-6 26-34q-22 6-38 22z" fill="#6bbf59"/>
        <ellipse cx="80" cy="76" rx="42" ry="40" fill="#79cf63"/>
        <path d="M44 56q36-30 72 0" fill="none" stroke="#4b8a3d" stroke-width="3"/>
        ${eye(64, 70, 8, '#ffe14d', m, 1)}${eye(96, 70, 8, '#ffe14d', m, 1)}
        <path d="M76 78l4 10 4-10z" fill="#4b8a3d"/>
        <path d="M58 92q22 ${m === 'hurt' ? -6 : 18} 44 0" fill="#2a1a1a" stroke="#2a1a1a" stroke-width="2"/>
        <path d="M64 93l4 8 4-7M80 95l4 8 4-8M94 93l3 7 4-6" fill="#fff"/>
        <path d="M140 150q40-70 6-118" fill="none" stroke="#cfe2ff" stroke-width="7" stroke-linecap="round"/>
        <path d="M140 150q40-70 6-118" fill="none" stroke="#5ee6f2" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
        <circle cx="140" cy="150" r="6" fill="#5d3f23"/>
      </g>`,
    /* E: Steel-Fanged Lycan, serigala abu baja bermata amber */
    E: (m) => `${defs('#4d8bff')}
      <g class="mbody">
        <path d="M28 126q-6-60 22-80l-6-30 28 22q8-4 16-4t16 4l28-22-6 30q28 20 22 80z" fill="#5a6577"/>
        <path d="M44 126q-4-40 16-58h40q20 18 16 58z" fill="#7b879b"/>
        <path d="M56 70l-12-52 30 26M104 70l12-52-30 26" fill="#434c5c"/>
        <path d="M58 70q22-12 44 0l6 40q-28 26-56 0z" fill="#8a96aa"/>
        <path d="M70 96h20l-10 34z" fill="#2b2f3a"/>
        <path d="M62 112l5 24 7-20M98 112l-5 24-7-20" fill="#e8f1ff" stroke="#9cc4ff" stroke-width="1.5"/>
        <path d="M68 108l4 14 5-12M92 108l-4 14-5-12" fill="#fff"/>
        <path d="M60 100q20 ${m === 'hurt' ? 2 : 10} 40 0" fill="none" stroke="#1c1f27" stroke-width="3"/>
        ${eye(66, 84, 7, '#ffb020', m, 1)}${eye(94, 84, 7, '#ffb020', m, 1)}
        <path d="M58 76l16 6M102 76l-16 6" stroke="#1c1f27" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M38 100l-8 10M44 110l-10 8M122 100l8 10M116 110l10 8" stroke="#9cc4ff" stroke-width="2.4" stroke-linecap="round"/>
      </g>`,
    /* D: Red-Eye Centipede, tubuh bersegmen melengkung seperti parabola */
    D: (m) => {
      let seg = '';
      for (let i = 0; i < 9; i++) {
        const t = i / 8,
          x = 18 + t * 124,
          y = 132 - 4 * 76 * t * (1 - t) * 0.95 * (1 - 0.15 * Math.abs(t - 0.5)) + 6;
        const r = 17 - Math.abs(t - 0.5) * 8;
        seg += `<g><path d="M${x - 9} ${y + r - 2}l-9 14M${x + 9} ${y + r - 2}l9 14" stroke="#3a1a1a" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#8a2d2d' : '#a93a32'}" stroke="#2a0f0f" stroke-width="2"/><path d="M${x - r * 0.6} ${y - r * 0.4}q${r * 0.6} -${r * 0.5} ${r * 1.2} 0" stroke="#e86a5a" stroke-width="2" fill="none"/></g>`;
      }
      return `${defs('#ff3b3b')}<g class="mbody">${seg}
        <path d="M24 80l-14-10 8 20zM46 84l-2 22 14-12z" fill="#2a0f0f"/>
        <path d="M30 66q-14 -22 -2 -38M18 78q-18 -14 -12 -36" stroke="#cfd6e8" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M22 96l-10 10 14 0z" fill="#cfd6e8"/><path d="M38 104l-4 12 12-6z" fill="#cfd6e8"/>
        ${eye(26, 82, 5.5, '#ff2020', m, 1)}${eye(40, 76, 5.5, '#ff2020', m, 1)}
      </g>`;
    },
    /* C: Ice Bear Alpha */
    C: (m) => `${defs('#7fe3ff')}
      <g class="mbody">
        <circle cx="36" cy="40" r="17" fill="#dff4ff"/><circle cx="124" cy="40" r="17" fill="#dff4ff"/>
        <circle cx="36" cy="40" r="8" fill="#9fd6ee"/><circle cx="124" cy="40" r="8" fill="#9fd6ee"/>
        <path d="M26 140q-8-50 26-70h56q34 20 26 70z" fill="#e9f8ff"/>
        <ellipse cx="80" cy="72" rx="50" ry="44" fill="#f2fbff"/>
        <path d="M18 112l-10-34 18 14zM142 112l10-34-18 14zM30 132l-14-26 20 8zM130 132l14-26-20 8z" fill="#8fe8ff" stroke="#4aa3c2" stroke-width="1.6"/>
        <path d="M58 40l-8-28 14 16zM100 40l8-28-14 16z" fill="#8fe8ff" stroke="#4aa3c2" stroke-width="1.4"/>
        <ellipse cx="80" cy="92" rx="23" ry="17" fill="#cdeaf8"/>
        <path d="M72 84h16l-8 9z" fill="#23394a"/>
        <path d="M80 93v8M66 102q14 ${m === 'hurt' ? 0 : 10} 28 0" fill="none" stroke="#23394a" stroke-width="2.8" stroke-linecap="round"/>
        ${eye(62, 66, 6.5, '#35c8ff', m, 1)}${eye(98, 66, 6.5, '#35c8ff', m, 1)}
        <path d="M52 58l18 5M108 58l-18 5" stroke="#23394a" stroke-width="3" stroke-linecap="round"/>
        <path d="M70 104q-8 10 0 20M90 104q8 10 0 20" stroke="#bff3ff" stroke-width="2" fill="none" opacity=".8" class="mbreath"/>
      </g>`,
    /* B: High Orc Shaman */
    B: (m) => `${defs('#b36bff')}
      <g class="mbody">
        <path d="M30 150q-4-44 30-56h40q34 12 30 56z" fill="#3b2a55"/>
        <path d="M58 94l22 30 22-30" fill="#6b4a98"/>
        <path d="M32 44q-18-26 6-34q8 18 26 24zM128 44q18-26-6-34q-8 18-26 24z" fill="#e8dcc0" stroke="#a8996f" stroke-width="2"/>
        <ellipse cx="80" cy="70" rx="40" ry="38" fill="#7a9a5a"/>
        <path d="M44 46q36-22 72 0q-6 10-36 8t-36-8z" fill="#5a3f2a"/><path d="M52 46l4 8M68 44l2 9M92 44l-2 9M108 46l-4 8" stroke="#e8dcc0" stroke-width="3"/>
        <path d="M46 70q34 -14 68 0" stroke="#e8dcc0" stroke-width="2.4" fill="none" stroke-dasharray="4 4" opacity=".0"/>
        ${eye(64, 68, 7, '#ff5ad0', m, 1)}${eye(96, 68, 7, '#ff5ad0', m, 1)}
        <path d="M54 60l18 5M106 60l-18 5" stroke="#22301a" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M60 88q20 ${m === 'hurt' ? -2 : 10} 40 0" fill="#1c1410" stroke="#1c1410" stroke-width="2"/>
        <path d="M62 90l-4-16 9 12zM98 90l4-16-9 12z" fill="#fff4d6" stroke="#a8996f" stroke-width="1.4"/>
        <path d="M70 62l-6-6M90 62l6-6" stroke="#e8dcc0" stroke-width="0"/>
        <path d="M136 156V30" stroke="#6b4a2a" stroke-width="6" stroke-linecap="round"/>
        <circle cx="136" cy="26" r="13" fill="#9a5aff" filter="url(#g${uid})" class="morb"/><circle cx="136" cy="26" r="6" fill="#e9d6ff"/>
        <path d="M122 40l-8 8M150 40l8 8" stroke="#6b4a2a" stroke-width="4" stroke-linecap="round"/>
      </g>`,
    /* A: Blood-Red Commander Igris */
    A: (m) => `${defs('#ff2a4a')}
      <g class="mbody">
        <path d="M20 150q-6-60 24-86l36 14 36-14q30 26 24 86z" fill="#7a0f1e"/>
        <path d="M40 148q-2-48 40-56q42 8 40 56z" fill="#b3182c" stroke="#40060f" stroke-width="2"/>
        <path d="M56 100h48M52 116h56M50 132h60" stroke="#40060f" stroke-width="3"/>
        <circle cx="42" cy="96" r="13" fill="#8c1224" stroke="#40060f" stroke-width="2"/><circle cx="118" cy="96" r="13" fill="#8c1224" stroke="#40060f" stroke-width="2"/>
        <path d="M80 6q10 12 8 30h-16q-2-18 8-30z" fill="#ff2a4a"/><path d="M80 6q-26 0 -36 28M80 6q26 0 36 28" stroke="#ff2a4a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M46 84q-4-44 34-48q38 4 34 48l-6 10h-56z" fill="#c21d36" stroke="#40060f" stroke-width="2.4"/>
        <path d="M54 66h52v14h-52z" fill="#12020a"/>
        ${m === 'ko' ? '<path d="M62 68l8 10M70 68l-8 10M90 68l8 10M98 68l-8 10" stroke="#ff2a4a" stroke-width="2.6"/>' : `<path d="M60 70h14v8h-14zM86 70h14v8h-14z" fill="#ff2a4a" filter="url(#g${uid})"/>`}
        <path d="M78 36v58" stroke="#40060f" stroke-width="3"/>
        <path d="M142 150l-6-92" stroke="#dfe6f5" stroke-width="7" stroke-linecap="round"/><path d="M142 150l-6-92" stroke="#ff2a4a" stroke-width="2" stroke-linecap="round"/>
        <path d="M128 112h28" stroke="#40060f" stroke-width="5" stroke-linecap="round"/>
      </g>`,
    /* S: Shadow Monarch Sovereign */
    S: (m) => `${defs('#9a5aff')}
      <g class="mbody">
        <path d="M18 156q2-40 22-60q-12-20 4-44q14 6 22 20q14-14 28-14t28 14q8-14 22-20q16 24 4 44q20 20 22 60z" fill="#0c0618" stroke="#6a2fd0" stroke-width="2.4"/>
        <path d="M30 150q10-20 22-26M130 150q-10-20-22-26" stroke="#9a5aff" stroke-width="2.4" fill="none" opacity=".7"/>
        <path d="M44 38l10-32 14 22 12-26 12 26 14-22 10 32z" fill="#1b0b3a" stroke="#c9a6ff" stroke-width="2.4"/>
        <path d="M54 30q26-6 52 0" stroke="#ffd86b" stroke-width="3" fill="none"/>
        <path d="M56 96q-6-46 24-50q30 4 24 50q-12 14-24 14t-24-14z" fill="#150a2c" stroke="#6a2fd0" stroke-width="2"/>
        ${m === 'ko' ? '<path d="M62 70l10 10M72 70l-10 10M88 70l10 10M98 70l-10 10" stroke="#c9a6ff" stroke-width="3"/>' : `<path d="M60 70q8-8 16 2q-8 6-16-2zM84 72q8-10 16-2q-8 8-16 2z" fill="#d6b8ff" filter="url(#g${uid})"/>`}
        <path d="M66 94q14 ${m === 'hurt' ? -2 : 8} 28 0" stroke="#c9a6ff" stroke-width="2.6" fill="none"/>
        <path d="M20 120q-10-30 6-52M140 120q10-30-6-52" stroke="#9a5aff" stroke-width="3" fill="none" class="mwisp"/>
        <path d="M32 130q-18-8-20-30M128 130q18-8 20-30" stroke="#6a2fd0" stroke-width="3" fill="none" class="mwisp"/>
        <path d="M76 6q4-14 8 0" stroke="#c9a6ff" stroke-width="2" fill="none"/>
      </g>`,
  };

  /* Versi siluet (prajurit bayangan hasil ekstraksi): bentuk monster diwarnai ungu gelap dengan mata menyala. */
  const shadowSvg = (c, size = 80) => {
    const m = String(c);
    return `<svg class="mon-svg shadowsol" viewBox="0 0 160 160" width="${size}" height="${size}" role="img" aria-label="Shadow ${(INFO[m] || {}).n || ''}"><g style="filter:brightness(.18) saturate(.2) drop-shadow(0 0 5px #9a5aff)">${(ART[m] || ART.E)('idle').replace(/filter="url\(#g\d+\)"/g, '')}</g></svg>`;
  };

  return {
    KEYS,
    INFO,
    has: (c) => !!INFO[String(c)],
    info: (c) => INFO[String(c)] || null,
    dmg: (c) => (INFO[String(c)] || { dmg: 15 }).dmg,
    svg(c, mood = 'idle', size) {
      const k = String(c),
        f = ART[k];
      if (!f) return '';
      uid++;
      const sz = size ? ` width="${size}" height="${size}"` : '';
      return `<svg class="mon-svg mon-${k} mood-${mood}" viewBox="0 0 160 160"${sz} role="img" aria-label="${INFO[k].n}">${f(mood)}</svg>`;
    },
    // inner(): isi SVG saja (tanpa tag <svg>) agar bisa ditaruh di dalam SVG lain, misalnya peta dungeon.
    inner(c, mood = 'idle') {
      const f = ART[String(c)];
      if (!f) return '';
      uid++;
      return f(mood);
    },
    shadow: (c, size) => (INFO[String(c)] ? (uid++, shadowSvg(c, size)) : ''),
  };
})();

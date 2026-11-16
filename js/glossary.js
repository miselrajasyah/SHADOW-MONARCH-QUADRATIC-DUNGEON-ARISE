'use strict';
/* ==================================================================
   glossary.js : PANDUAN ISTILAH SYSTEM (TAHAP 2)
   ------------------------------------------------------------------
   Membantu siswa yang belum pernah menonton Solo Leveling. Isi istilah ada di GLOS (content.js).
   1. Tombol melayang "?" (kanan bawah) membuka jendela Panduan Istilah dengan kolom cari.
   2. Gloss.apply(elemen): kata penting (Gate, Rank, Raid, XP, dst) di dalam elemen diberi garis titik-titik.
      Arahkan kursor (komputer) atau ketuk (HP) untuk membaca penjelasan singkat. Ketuk lagi untuk penjelasan lengkap.
   3. Elemen apa pun dengan atribut data-gl="open" atau data-gl="id-istilah" ikut membuka jendela ini.
   ================================================================== */
window.Gloss = (() => {
  const G = {};
  const SKIP = 'A,BUTTON,INPUT,TEXTAREA,SELECT,SCRIPT,STYLE,SVG,svg,CANVAS,CODE,H1,H2,H3,H4,LABEL,.katex,.tag,.tagc,.tip,.badge,.mat-svg,.no-gl,#glm';
  const esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // Satu pola besar dari semua kata; kata terpanjang dicoba lebih dulu.
  const build = () => {
    const map = {};
    GLOS.forEach((g) => g.a.forEach((w) => (map[w.toLowerCase()] = g)));
    const words = Object.keys(map).sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return { map, re: new RegExp('(?<![\\p{L}\\p{N}])(' + words.join('|') + ')(?![\\p{L}\\p{N}])', 'giu') };
  };
  let B = null;
  G.apply = (root) => {
    if (!root || !root.isConnected) return;
    B = B || build();
    const seen = new Set();
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim().length < 2 || n.nodeValue.indexOf('$') >= 0 || (n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => {
      const txt = n.nodeValue;
      B.re.lastIndex = 0;
      let m,
        last = 0,
        out = '',
        hit = 0;
      while ((m = B.re.exec(txt))) {
        const g = B.map[m[1].toLowerCase()];
        if (!g || seen.has(g.id)) continue; // satu tooltip per istilah per halaman agar tidak ramai
        seen.add(g.id);
        out += esc2(txt.slice(last, m.index)) + `<span class="tip" tabindex="0" data-gl="${g.id}" data-tip="${esc2(g.s)}">${esc2(m[1])}</span>`;
        last = m.index + m[1].length;
        hit = 1;
      }
      if (!hit) return;
      out += esc2(txt.slice(last));
      const sp = document.createElement('span');
      sp.innerHTML = out;
      n.replaceWith(...sp.childNodes);
    });
  };

  /* ---------- Jendela Panduan Istilah ---------- */
  const card = (g) =>
    `<article class="gcard" id="gl-${g.id}"><h3>${esc2(g.t)}</h3><p class="gs"><b>Di cerita:</b> ${esc2(g.story)}</p><p class="gs"><b>Di website ini:</b> ${esc2(g.game)}</p></article>`;
  const ensure = () => {
    let m = document.getElementById('glm');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'glm';
    m.hidden = true;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', 'Panduan Istilah System');
    m.innerHTML = `<div class="glbox"><button type="button" class="x" id="glx" aria-label="Tutup">×</button><small class="tag">[ SYSTEM ] PANDUAN ISTILAH</small><h2>Panduan Istilah System</h2><p class="mut">Belum pernah nonton Solo Leveling? Tenang. Ini kamus singkat supaya kamu tetap paham cara belajar dan bermain.</p><h3>Jalur cepat untuk pemula</h3><ol class="gflow">${GLOS_INTRO.map((x, i) => `<li>${IC(['hunter', 'gate', 'book', 'dagger', 'crown'][i] || 'star')}<b>${esc2(x[1])}</b><span>${esc2(x[2])}</span></li>`).join('')}</ol><label class="gsearch">Cari istilah<input id="gls" placeholder="Contoh: raid, mana, title" autocomplete="off"></label><div id="glc">${GLOS.map(card).join('')}</div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('#glx')) G.close();
    });
    m.querySelector('#gls').oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      m.querySelectorAll('.gcard').forEach((c) => (c.hidden = !!q && !c.textContent.toLowerCase().includes(q)));
    };
    return m;
  };
  G.open = (id) => {
    const m = ensure();
    m.hidden = false;
    m.querySelector('#gls').value = '';
    m.querySelectorAll('.gcard').forEach((c) => (c.hidden = false, c.classList.remove('hl')));
    const t = id && id !== 'open' && m.querySelector('#gl-' + id);
    if (t) {
      t.classList.add('hl');
      setTimeout(() => t.scrollIntoView({ block: 'center' }), 30);
    } else m.querySelector('.glbox').scrollTop = 0;
  };
  G.close = () => {
    const m = document.getElementById('glm');
    if (m) m.hidden = true;
  };
  // Tombol "?" melayang, tampil juga di landing page.
  G.mountButton = () => {
    if (document.getElementById('glf')) return;
    const b = document.createElement('button');
    b.id = 'glf';
    b.type = 'button';
    b.title = 'Panduan Istilah System';
    b.setAttribute('aria-label', 'Panduan Istilah System');
    b.dataset.gl = 'open';
    b.textContent = '?';
    document.body.appendChild(b);
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.tip');
    if (t) {
      // ketukan pertama membuka tooltip, ketukan kedua membuka penjelasan lengkap
      if (t.classList.contains('show')) {
        t.classList.remove('show');
        return G.open(t.dataset.gl);
      }
      document.querySelectorAll('.tip.show').forEach((x) => x.classList.remove('show'));
      t.classList.add('show');
      return;
    }
    document.querySelectorAll('.tip.show').forEach((x) => x.classList.remove('show'));
    const o = e.target.closest('[data-gl]');
    if (o) G.open(o.dataset.gl);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      G.close();
      document.querySelectorAll('.tip.show').forEach((x) => x.classList.remove('show'));
    }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('tip')) G.open(e.target.dataset.gl);
  });
  addEventListener('DOMContentLoaded', G.mountButton);
  if (document.readyState !== 'loading') G.mountButton();
  return G;
})();

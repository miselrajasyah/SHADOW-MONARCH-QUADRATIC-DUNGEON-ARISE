'use strict';
/* ==================================================================
   mobile11.js : PENDAMPING RESPONSIVE MOBILE (v11.1-mobile-clean)
   1. Di layar <= 768px, menu #nav dipindah ke bawah header (supaya header tetap 56px) dan dikembalikan di desktop.
   2. Tombol "?" (#glf) dipindah ke header saat login (tidak menutupi apa pun), kembali melayang di landing.
   3. Semua <table> dibungkus div.tblw (overflow-x: auto) setiap kali halaman berganti.
   4. Panel audio otomatis ringkas di HP setiap kali dibuka.
   5. Maskot (#co) disembunyikan saat mengetik (input/textarea/select) dan di arena soal.
   ================================================================== */
(() => {
  const mq = window.matchMedia('(max-width:768px)');
  const $ = (s) => document.querySelector(s);
  const app = $('#app'), nav = $('#nav'), top = app && app.querySelector('.top');

  // 1 + 2: tata letak header
  const layout = () => {
    if (!app || !nav || !top) return;
    const me = top.querySelector('.me'), glf = $('#glf');
    if (mq.matches) {
      if (nav.parentElement !== app) top.after(nav);
      if (glf && !app.hidden && me && glf.parentElement !== me) {
        me.prepend(glf);
        glf.classList.add('inhdr');
      } else if (glf && app.hidden && glf.parentElement !== document.body) {
        document.body.appendChild(glf);
        glf.classList.remove('inhdr');
      }
    } else {
      if (nav.parentElement !== top) (top.querySelector('.me') ? top.insertBefore(nav, top.querySelector('.me')) : top.appendChild(nav));
      if (glf && glf.parentElement !== document.body) {
        document.body.appendChild(glf);
        glf.classList.remove('inhdr');
      }
    }
  };

  // 3: bungkus tabel
  const wrapTables = () => {
    document.querySelectorAll('#view table, #site table').forEach((t) => {
      const p = t.parentElement;
      if (!p || p.classList.contains('tblw') || p.classList.contains('scrl')) return;
      const w = document.createElement('div');
      w.className = 'tblw';
      p.insertBefore(w, t);
      w.appendChild(t);
    });
  };

  // 5: status "arena soal"
  const arena = () => {
    const h = location.hash || '';
    document.body.classList.toggle('arena', mq.matches && (/^#\/rank\//.test(h) || /^#\/raid/.test(h)) && !!document.querySelector('#view .opts, #view .battle'));
  };
  const typing = (on) => document.body.classList.toggle('typing', on && mq.matches);
  const isField = (e) => e && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) && !['range', 'checkbox', 'radio', 'button'].includes(e.type);
  document.addEventListener('focusin', (e) => isField(e.target) && typing(true));
  document.addEventListener('focusout', () => setTimeout(() => typing(isField(document.activeElement)), 120));

  let t = 0;
  const refresh = () => {
    clearTimeout(t);
    t = setTimeout(() => { layout(); wrapTables(); arena(); }, 30);
  };
  const view = $('#view');
  if (view) new MutationObserver(refresh).observe(view, { childList: true, subtree: true });
  if (app) new MutationObserver(refresh).observe(app, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('hashchange', refresh);
  addEventListener('resize', refresh);
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(refresh);
  document.addEventListener('langchange', refresh);

  // 4: panel audio ringkas otomatis di HP (setiap dibuka)
  const audio = $('#audio');
  if (audio && mq.matches) {
    audio.classList.add('min');
    const b = $('#abx');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  refresh();
})();

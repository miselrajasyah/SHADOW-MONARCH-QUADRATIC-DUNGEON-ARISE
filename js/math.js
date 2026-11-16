/* ==================================================================
   math.js : NOTASI MATEMATIKA (KaTeX)
   ------------------------------------------------------------------
   KaTeX dan auto-render dimuat dari CDN (lihat index.html). File ini membuat semua teks yang
   ditulis di antara tanda dolar otomatis menjadi rumus yang rapi:
       $y = a(x - h)^2 + k$       rumus di dalam kalimat
       $$x = \frac{-b}{2a}$$      rumus di baris sendiri (jarang dipakai)
   Cukup tulis rumus dengan sintaks LaTeX di teks soal, misi, opsi, pembahasan, dan sebagainya.
   Di file .js (tanda kutip biasa) garis miring terbalik harus ditulis dua kali:  '$\\frac{1}{2}$'

   Cara kerja: sebuah MutationObserver memantau halaman. Setiap kali ada teks baru yang memuat tanda $
   (halaman berpindah, soal baru, jawaban muncul, applet berubah), bagian itu dirender otomatis.
   Jadi tidak perlu memanggil apa pun setelah mengubah isi halaman.
   Untuk memaksa render: renderMath(elemen).
   ================================================================== */
(function () {
  const OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false, // rumus yang salah ditulis tampil apa adanya, bukan membuat halaman error
    strict: 'ignore',
    trust: false,
    ignoredClasses: ['no-math', 'katex'],
  };
  let obs = null,
    queue = new Set(),
    scheduled = false;

  // renderMath(el): render semua rumus di dalam elemen (default: seluruh halaman).
  function renderMath(root) {
    if (!window.renderMathInElement) return;
    const el = root || document.body;
    if (!el || !el.isConnected) return;
    if (el.closest && el.closest('.katex')) return;
    if ((el.textContent || '').indexOf('$') < 0) return;
    obs && obs.disconnect();
    try {
      window.renderMathInElement(el, OPTS);
    } catch (e) {
      console.warn('KaTeX:', e);
    }
    watch();
  }
  window.renderMath = renderMath;

  function flush() {
    scheduled = false;
    const list = [...queue];
    queue.clear();
    list.forEach((n) => {
      const el = n.nodeType === 1 ? n : n.parentElement;
      if (el) renderMath(el);
    });
  }
  function watch() {
    if (!obs) {
      obs = new MutationObserver((ms) => {
        ms.forEach((m) => {
          if (m.type === 'characterData') queue.add(m.target);
          else m.addedNodes.forEach((n) => (n.nodeType === 1 || n.nodeType === 3) && queue.add(n));
        });
        if (queue.size && !scheduled) {
          scheduled = true;
          // microtask: rumus sudah rapi sebelum browser menggambar, jadi tidak ada kedipan teks mentah
          Promise.resolve().then(flush);
        }
      });
    }
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  // Render pertama. Script ini defer, jadi KaTeX sudah termuat (urutan di index.html).
  renderMath(document.body);
  watch();
  // Cadangan jika KaTeX baru selesai dimuat setelah script ini (koneksi lambat).
  addEventListener('load', () => renderMath(document.body));
})();

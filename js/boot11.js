'use strict';
/* boot11.js : dijalankan paling akhir. Menggambar ulang halaman aktif agar modul v11 (peta, menu baru, simulasi) ikut tampil
   saat halaman dibuka ulang dalam keadaan sudah login, dan menggambar ulang konten saat bahasa diganti
   (supaya isi modul, soal, dan kamus ikut berubah penuh). */
(() => {
  const app = document.getElementById('app'),
    site = document.getElementById('site');
  if (app && !app.hidden && DB.me && me()) route();
  else if (site && !site.hidden) showSite();
  document.addEventListener('langchange', () => {
    try {
      if (app && !app.hidden && DB.me && me()) {
        if (!typingNow()) route();
      } else if (site && !site.hidden) showSite();
      window.I18N && I18N.mount();
    } catch (e) {
      console.warn('langchange:', e);
    }
  });
})();

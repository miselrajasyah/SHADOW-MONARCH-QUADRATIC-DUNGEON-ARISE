/* sw.js : service worker agar website bisa dipasang sebagai aplikasi dan tetap terbuka saat offline.
   Strategi: ambil dari jaringan dulu, jika gagal pakai salinan tersimpan. GeoGebra tetap butuh internet.
   Ubah VERSI jika kamu mengedit file agar cache lama diganti. */
const VERSI = 'arise-v11';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'css/v11.css',
  'js/icons.js',
  'js/content.js',
  'js/team.js',
  'js/characters.js',
  'js/extras.js',
  'js/materi.js',
  'js/glossary.js',
  'js/avatar.js',
  'js/sync.js',
  'js/lang.js',
  'js/lang2.js',
  'js/i18n.js',
  'js/app.js',
  'js/audio3.js',
  'js/monsters.js',
  'js/sfx11.js',
  'js/battle11.js',
  'js/gatemap.js',
  'js/menus11.js',
  'js/ui11.js',
  'js/boot11.js',
  'js/math.js',
  'js/cloud.js',
  'js/firebase.js',
  'icons/logo.svg',
  'icons/icon-192.png',
  'manifest.webmanifest',
];
self.addEventListener('install', (e) =>
  e.waitUntil(
    caches
      .open(VERSI)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((k) => Promise.all(k.filter((x) => x !== VERSI).map((x) => caches.delete(x))))
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // KaTeX dari CDN disimpan agar rumus tetap tampil saat offline (cache dulu, jaringan untuk memperbarui).
  if (e.request.method === 'GET' && u.hostname === 'cdn.jsdelivr.net' && u.pathname.includes('/katex@')) {
    e.respondWith(
      caches.open(VERSI).then((c) =>
        c.match(e.request).then(
          (m) =>
            m ||
            fetch(e.request).then((r) => {
              if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
              return r;
            }),
        ),
      ),
    );
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const cp = r.clone();
        caches.open(VERSI).then((c) => c.put(e.request, cp));
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('index.html'))),
  );
});

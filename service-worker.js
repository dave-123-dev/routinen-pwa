const CACHE = 'routinen-cache-v35';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './styles/app.css?v=35',
  './styles/v27-task-buttons.css?v=35',
  './styles/modular.css?v=35',
  './src/app.js?v=35',
  './src/version.js',
  './src/emoji-map.js',
  './src/emoji.js',
  './src/pull-refresh.js',
  './src/notifications-v31.js',
  './src/domain/dates.js',
  './src/domain/tasks.js',
  './src/i18n/messages.js',
  './src/storage/task-store.js',
  './src/ui/dom.js',
  './src/ui/task-card.js',
  './src/views/task-list-view.js',
  './src/views/task-form-view.js',
  './src/views/history-view.js',
  './src/views/import-view.js',
  './src/views/settings-view.js',
  './src/views/past-view.js',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
        return response;
      })),
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

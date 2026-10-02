const CACHE_NAME = 'schoolmanager-v1';
const ASSETS = [
    '/',
    '/assets/css/offline-sync.css',
    '/assets/js/offline-sync.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => 
            Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => console.warn('Failed to cache:', url))))
        )
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
});

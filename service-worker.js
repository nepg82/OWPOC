const CACHE_NAME = 'openworld-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/ui.js',
  './js/world.js',
  './js/entities.js',
  './js/player.js',
  './js/main.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
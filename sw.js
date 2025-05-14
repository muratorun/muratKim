// Service Worker - Basit Cache ve Offline Desteği
const CACHE_NAME = 'murat-orun-cache-v1';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js',
  '/favicon.ico'
];

// Önbelleğe alma stratejisi: Cache First, Network Fallback
self.addEventListener('install', event => {
  // Eski service worker'ı beklemeden hemen aktifleştir
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbellek açıldı');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Önbelleğe alma hatası:', error);
      })
  );
});

// Ağ isteklerini yakalama ve önbellekten yanıtlama
self.addEventListener('fetch', event => {
  // Yalnızca GET isteklerini işle
  if (event.request.method !== 'GET') return;
  
  // CORS isteklerini atla (cdnjs gibi kaynaklara yapılan istekler)
  if (event.request.mode === 'cors') {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // HTML sayfaları için: Ağ, sonra önbellek (network-first)
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Yanıtın bir kopyasını önbelleğe kaydet
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Ağ bağlantısı yoksa önbellekten al
          return caches.match(event.request)
            .then(cachedResponse => {
              // Önbellekte varsa döndür, yoksa offline sayfasını göster
              return cachedResponse || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Diğer kaynaklar (CSS, JS, resimler) için: Önce önbellek, sonra ağ (cache-first)
  event.respondWith(cacheFirst(event.request));
});

// Cache-First Stratejisi
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    // Yalnızca başarılı yanıtları önbelleğe al
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Önbellekte olmayan ve ağdan alınamayan kaynaklar için fallback
    // Resimler için varsayılan bir resim gösterebilirsiniz
    const url = new URL(request.url);
    if (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg')) {
      return caches.match('/icons/icon-192x192.png');
    }
    
    // Diğer kaynaklar için bir şey yapma
    return new Response('İçerik yüklenemedi', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Network-First Stratejisi
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('İçerik yüklenemedi', { 
      status: 503, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }
}

// Eski önbellekleri temizle
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  // Yeni service worker'ı hemen aktifleştir
  self.clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Eski önbellekler temizlendi, Service Worker şimdi aktif');
      })
  );
});

// Push Notification almayı işleme
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Yeni bir bildirim geldi',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100], // Titreşim deseni
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Murat ÖRÜN', 
      options
    )
  );
});

// Bildirime tıklama işlemi
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
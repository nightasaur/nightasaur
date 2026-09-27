// Nightasaur Service Worker: public offline resources only.
// Never persist application HTML, authenticated responses or API requests.
const CACHE_PREFIX = 'nightasaur-';
const CACHE_NAME = 'nightasaur-public-v2';
const PUBLIC_FILES = ['/offline.html', '/manifest.json', '/nightasaur.svg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PUBLIC_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Let the browser handle API traffic without reading or writing Cache Storage.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  // Every document comes from the server. Offline fallback is generic public UI.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/offline.html') || new Response('Offline', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }));
    return;
  }

  // Only these public files are eligible for service-worker caching.
  // Bundled scripts/styles and all other requests use normal HTTP semantics.
  if (!url.search && PUBLIC_FILES.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(url.pathname) || fetch(request);
    })());
  }
});

// 處理推送通知
self.addEventListener('push', event => {
  console.log('📨 接收到推送通知:', event);

  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '你的精靈在等你！',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: '開啟'
      },
      {
        action: 'close',
        title: '關閉'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nightasaur', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', event => {
  console.log('🖱️ 通知被點擊:', event.notification.tag);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // 檢查是否已有開啟的窗口
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 如果沒有，開啟新窗口
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 處理同步事件 (背景同步)
self.addEventListener('sync', event => {
  console.log('🔄 背景同步:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 背景同步函數
async function syncData() {
  try {
    console.log('🔄 開始背景同步...');
    // 這裡可以實作數據同步邏輯
    // 例如：同步離線時的操作到伺服器
    return Promise.resolve();
  } catch (error) {
    console.error('❌ 背景同步失敗:', error);
    return Promise.reject(error);
  }
}

// 處理定期同步 (Periodic Sync)
self.addEventListener('periodicsync', event => {
  console.log('⏰ 定期同步:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// 定期更新內容
async function updateContent() {
  try {
    console.log('⏰ 定期更新內容...');
    // 這裡可以實作定期更新邏輯
    // 例如：更新精靈數據、下載新內容等
    return Promise.resolve();
  } catch (error) {
    console.error('❌ 定期更新失敗:', error);
    return Promise.reject(error);
  }
}

console.log('🦖 Nightasaur Service Worker 已載入');
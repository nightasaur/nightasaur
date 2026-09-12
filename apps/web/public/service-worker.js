// Nightasaur Service Worker
// 版本: 1.0.0

const CACHE_NAME = 'nightasaur-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/nightasaur.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('🦖 Service Worker 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 快取檔案:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker 安裝完成');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker 安裝失敗:', error);
      })
  );
});

// 啟用 Service Worker
self.addEventListener('activate', event => {
  console.log('🦖 Service Worker 啟用中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker 啟用完成');
      return self.clients.claim();
    })
  );
});

// 攔截請求
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  // 對於 API 請求，使用網絡優先策略
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 複製響應以用於快取
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // 網絡失敗時從快取中獲取
          return caches.match(event.request);
        })
    );
    return;
  }

  // 對於靜態資源，使用快取優先策略
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 從快取提供:', event.request.url);
          return cachedResponse;
        }

        // 如果快取中沒有，從網絡獲取
        return fetch(event.request)
          .then(response => {
            // 檢查是否為有效的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製響應以用於快取
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('🌐 網絡請求失敗:', error);
            
            // 對於 HTML 頁面，返回離線頁面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // 對於其他資源，返回預設圖標
            if (event.request.destination === 'image') {
              return caches.match('/nightasaur.svg');
            }
            
            return new Response('離線模式', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
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
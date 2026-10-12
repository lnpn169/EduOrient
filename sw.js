const CACHE_NAME = 'eduorient-v20261012-2302';

// Cache riêng cho thư viện CDN: KHÔNG bị xóa mỗi lần deploy (update-sw.js chỉ đổi CACHE_NAME),
// nhờ vậy người dùng không phải tải lại React/Firebase sau mỗi lần cập nhật.
const CDN_CACHE = 'eduorient-cdn-v1';

// Cache riêng cho JS/CSS của app đã đóng dấu nội dung (?v=hash). Mỗi URL gắn với đúng 1 nội dung nên
// dùng Cache First (mở app là có ngay, không chờ mạng). Chỉ giữ các URL còn nằm trong VERSIONED_ASSETS,
// nên file không đổi giữa hai lần deploy sẽ không phải tải lại.
const ASSET_CACHE = 'eduorient-assets-v1';

// Chờ mạng tối đa bao nhiêu mili-giây trước khi trả bản đã lưu trong cache
const NETWORK_TIMEOUT_MS = 3000;

// Trang HTML + file nhỏ không đóng dấu phiên bản (cache theo từng lần deploy, luôn lấy mạng trước)
const APP_SHELL = [
  '/',
  '/index.html',
  '/hocsinh.html',
  '/manifest.webmanifest',
  '/icon-192.png'
];

// JS/CSS của app kèm hash nội dung. DANH SÁCH NÀY DO update-sw.js TỰ GHI mỗi lần deploy.
// <VERSIONED-ASSETS> (tự động ghi bởi update-sw.js - đừng sửa tay)
const VERSIONED_ASSETS = [
  '/app.min.js?v=ce9949f4cb',
  '/tailwind.min.css?v=23b4fc27b6',
  '/edu-common.js?v=0ec7397c40',
  '/index.css?v=e58cb98fc0',
  '/hocsinh.min.js?v=f66d5e3972',
  '/hocsinh.min.css?v=d2e2af1d88'
];
// </VERSIONED-ASSETS>

// Thư viện CDN cần có sẵn khi offline. URL phải KHỚP CHÍNH XÁC với thẻ <script>/<link> trong HTML.
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11.14.5',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
].map((u) => new URL(u).href);

// Các URL không gắn phiên bản cố định -> được tải lại mỗi lần deploy (lúc install) để luôn mới
const FLOATING_CDN = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
].map((u) => new URL(u).href);

// ---------------------------------------------------------------------------
// Phân loại request
// ---------------------------------------------------------------------------

// Lưu lượng API của Firebase/Google: tuyệt đối không can thiệp
// (lưu ý: file SDK nằm ở www.gstatic.com/firebasejs/ là thư viện tĩnh, KHÔNG thuộc nhóm này)
function isFirebaseApi(url) {
  const h = url.hostname;
  return (
    url.pathname.startsWith('/__/') || // Firebase Hosting: /__/auth/handler, /__/firebase/init.js
    h.endsWith('firebaseio.com') ||
    h.endsWith('firebaseapp.com') ||
    h === 'apis.google.com' ||
    (h.endsWith('googleapis.com') && h !== 'fonts.googleapis.com')
  );
}

// JS/CSS cùng domain có tham số ?v=hash (file tĩnh đã đóng dấu phiên bản)
function isVersionedAsset(url) {
  return url.origin === self.location.origin && url.searchParams.has('v') && /\.(js|css)$/.test(url.pathname);
}

// Thư viện tĩnh trên CDN
function isCdn(url) {
  const h = url.hostname;
  return (
    h === 'cdnjs.cloudflare.com' ||
    h === 'cdn.jsdelivr.net' ||
    h === 'fonts.googleapis.com' ||
    h === 'fonts.gstatic.com' ||
    (h === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
  );
}

// ---------------------------------------------------------------------------
// Tải + lưu 1 file CDN. Ưu tiên chế độ CORS để response không bị "opaque"
// (opaque bị Chrome tính ~7MB mỗi file vào quota lưu trữ). Nếu CDN không cho CORS thì dùng no-cors.
// ---------------------------------------------------------------------------
async function fetchAndStore(cache, url) {
  let res;
  try {
    res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  } catch (e) {
    res = await fetch(url, { mode: 'no-cors', credentials: 'omit' });
  }
  if (res.ok || res.type === 'opaque') {
    await cache.put(url, res.clone());
  }
  return res;
}

// ---------------------------------------------------------------------------
// INSTALL: tải sẵn app shell + thư viện CDN. Dùng allSettled nên 1 file lỗi không làm hỏng cả bản cài.
// ---------------------------------------------------------------------------
async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    APP_SHELL.map(async (path) => {
      // cache:'reload' -> bỏ qua HTTP cache của trình duyệt để lấy đúng bản mới vừa deploy
      const res = await fetch(new Request(path, { cache: 'reload' }));
      if (res.ok) await cache.put(path, res);
    })
  );
}

// Tải sẵn JS/CSS của app. File đã có trong cache (cùng hash = cùng nội dung) thì bỏ qua.
async function precacheAssets() {
  const cache = await caches.open(ASSET_CACHE);
  await Promise.allSettled(
    VERSIONED_ASSETS.map(async (path) => {
      if (await cache.match(path)) return;
      const res = await fetch(path);
      if (res.ok) await cache.put(path, res);
    })
  );
}

async function precacheCdn() {
  const cache = await caches.open(CDN_CACHE);
  await Promise.allSettled(
    CDN_ASSETS.map(async (url) => {
      // File đã có và có gắn phiên bản cố định -> không tải lại
      if (!FLOATING_CDN.includes(url) && (await cache.match(url, { ignoreVary: true }))) return;
      await fetchAndStore(cache, url);
    })
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.all([precacheShell(), precacheAssets(), precacheCdn()]));
});

// ---------------------------------------------------------------------------
// ACTIVATE: xóa cache HTML của các phiên bản cũ, giữ lại cache CDN và cache file tĩnh (chỉ dọn bản hash cũ)
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith('eduorient-') && n !== CACHE_NAME && n !== CDN_CACHE && n !== ASSET_CACHE)
            .map((n) => caches.delete(n))
        )
      )
      // Dọn các file tĩnh có hash cũ (không còn được trang HTML mới tham chiếu)
      .then(() =>
        caches.open(ASSET_CACHE).then(async (c) => {
          const keep = new Set(VERSIONED_ASSETS);
          for (const req of await c.keys()) {
            const u = new URL(req.url);
            if (!keep.has(u.pathname + u.search)) await c.delete(req);
          }
        })
      )
      // Dọn bản Tailwind CDN cũ (đã chuyển sang tailwind.min.css)
      .then(() => caches.open(CDN_CACHE).then((c) => c.delete('https://cdn.tailwindcss.com/')))
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// CDN: Cache First (CDN thường rất nhanh và file đã gắn phiên bản nên không đổi)
// ---------------------------------------------------------------------------
async function cdnCacheFirst(request) {
  const cache = await caches.open(CDN_CACHE);
  const hit = await cache.match(request.url, { ignoreVary: true });
  if (hit) return hit;
  try {
    return await fetchAndStore(cache, request.url);
  } catch (e) {
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// JS/CSS có ?v=hash: Cache First. URL đã đổi khi nội dung đổi nên bản trong cache không bao giờ cũ.
// Chưa có trong cache (vd. HTML mới tham chiếu hash mới trước khi SW kịp cập nhật) -> lấy mạng rồi lưu lại.
// ---------------------------------------------------------------------------
async function assetCacheFirst(event) {
  const req = event.request;
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.status === 200 && res.type === 'basic') {
    event.waitUntil(cache.put(req.url, res.clone()));
  }
  return res;
}

// ---------------------------------------------------------------------------
// HTML và file nhỏ không đóng dấu: Network First có TIMEOUT
//  - Mạng trả lời trong 3s -> dùng bản mới nhất và cập nhật cache.
//  - Quá 3s mà đã có bản trong cache -> trả bản cache ngay (mạng vẫn chạy ngầm để cập nhật cache cho lần sau).
//  - Quá 3s nhưng CHƯA có cache (lần đầu) -> vẫn chờ mạng, vì không có gì khác để hiển thị.
//  - Mất mạng hẳn -> trả cache; trang điều hướng mà không có cache thì trả index.html.
// ---------------------------------------------------------------------------
function networkFirstWithTimeout(event) {
  const req = event.request;
  const isNav = req.mode === 'navigate';
  const fromCache = () => caches.match(req, { ignoreSearch: isNav });

  const network = fetch(req).then((res) => {
    if (res && res.status === 200 && res.type === 'basic') {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(req, copy)));
    }
    return res;
  });
  // Giữ Service Worker sống đến khi mạng xong để cập nhật cache, kể cả khi đã trả bản cache
  event.waitUntil(network.catch(() => {}));

  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };

    const timer = setTimeout(async () => {
      const hit = await fromCache();
      if (hit) finish(hit);
    }, NETWORK_TIMEOUT_MS);

    network
      .then(async (res) => {
        if (res.status >= 500) {
          // Server lỗi -> ưu tiên bản cache nếu có
          const hit = await fromCache();
          return finish(hit || res);
        }
        finish(res);
      })
      .catch(async () => {
        const hit = await fromCache();
        finish(hit || (isNav && (await caches.match('/index.html'))) || Response.error());
      });
  });
}

// ---------------------------------------------------------------------------
// FETCH
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Chỉ xử lý GET; bỏ qua request Range (video/audio) và scheme lạ (chrome-extension:...)
  if (req.method !== 'GET' || req.headers.has('range')) return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Firestore / Auth / Firebase API: để trình duyệt tự xử lý
  if (isFirebaseApi(url)) return;

  // Thư viện CDN
  if (isCdn(url)) {
    event.respondWith(cdnCacheFirst(req));
    return;
  }

  // JS/CSS đã đóng dấu phiên bản: Cache First
  if (isVersionedAsset(url)) {
    event.respondWith(assetCacheFirst(event));
    return;
  }

  // HTML và file khác cùng domain với app
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstWithTimeout(event));
  }
  // Domain khác (API AI, backend riêng...): không can thiệp
});

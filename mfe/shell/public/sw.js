/**
 * NexaForge ERP — Service Worker (S-17D Mobile PWA)
 *
 * Strategy:
 *  - App shell (HTML/CSS/JS chunks): Cache-first, update in background
 *  - API GET requests: Network-first with 3s timeout fallback to cache
 *  - API POST/PATCH (weld joints, ITP sign-offs): Queue in IndexedDB if offline,
 *    replay via Background Sync when connection returns
 *  - Push notifications: QC hold alerts, MRP shortages, NCR raised
 */

const SHELL_CACHE   = "nexaforge-shell-v1";
const API_CACHE     = "nexaforge-api-v1";
const SYNC_QUEUE_DB = "nexaforge-sync-queue";

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => k !== SHELL_CACHE && k !== API_CACHE)
            .map(k => caches.delete(k))
        )
      ),
    ])
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin or API requests
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/api/")) return;

  // Skip non-GET mutations — handled by background sync
  if (request.method !== "GET") return;

  // Navigation: Shell cache-first
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then(cached => cached || fetch(request))
    );
    return;
  }

  // API GET: Network-first with 3s timeout, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithTimeout(request, 3000));
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(c => c.put(request, clone));
        }
        return response;
      });
    })
  );
});

async function networkFirstWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const clone = response.clone();
      caches.open(API_CACHE).then(c => c.put(request, clone));
    }
    return response;
  } catch (_) {
    clearTimeout(timer);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline — cached data unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-Nexaforge-Offline": "1" },
    });
  }
}

// ── Background Sync — offline mutation queue ─────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "nexaforge-mutation-queue") {
    event.waitUntil(replayMutationQueue());
  }
});

async function openSyncDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_QUEUE_DB, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("mutations", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

async function enqueueMutation(method, url, body, headers) {
  const db    = await openSyncDb();
  const store = db.transaction("mutations", "readwrite").objectStore("mutations");
  store.add({ method, url, body, headers, queued_at: Date.now() });
  db.close();
  // Register background sync
  if ("sync" in self.registration) {
    await self.registration.sync.register("nexaforge-mutation-queue");
  }
}

async function replayMutationQueue() {
  const db    = await openSyncDb();
  const tx    = db.transaction("mutations", "readwrite");
  const store = tx.objectStore("mutations");

  const all = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });

  for (const mutation of all) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json", ...mutation.headers },
        body: JSON.stringify(mutation.body),
      });

      if (response.ok) {
        store.delete(mutation.id);
        // Notify open clients that a queued mutation was replayed
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach(client => client.postMessage({
          type: "SYNC_REPLAYED",
          url:  mutation.url,
          method: mutation.method,
        }));
      }
    } catch (_) {
      // Keep in queue — will retry on next sync
    }
  }
  db.close();
}

// ── Push notifications ────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (_) {
    payload = { title: "NexaForge", body: event.data.text() };
  }

  const iconMap = {
    qc_hold:     "/icons/icon-192.png",
    ncr_raised:  "/icons/icon-192.png",
    mrp_shortage:"/icons/icon-192.png",
  };

  const options = {
    body:    payload.body  || "",
    icon:    iconMap[payload.type] || "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    tag:     payload.tag   || payload.type || "nexaforge",
    data:    payload.data  || {},
    actions: payload.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: payload.priority === "high",
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "NexaForge ERP", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const match = clients.find(c => c.url.includes(self.location.origin));
      if (match) {
        match.focus();
        match.postMessage({ type: "NAVIGATE", url });
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});

const CACHE_NAME = "chess-game-v1"
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/pieces/white_king.svg",
  "/pieces/black_king.svg",
  "/pieces/white_queen.svg",
  "/pieces/black_queen.svg",
  "/pieces/white_rook.svg",
  "/pieces/black_rook.svg",
  "/pieces/white_bishop.svg",
  "/pieces/black_bishop.svg",
  "/pieces/white_knight.svg",
  "/pieces/black_knight.svg",
  "/pieces/white_pawn.svg",
  "/pieces/black_pawn.svg"
]

// Install event: cache initial shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    }).then(() => self.skipWaiting())
  )
})

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event: serve from cache if available, fallback to network
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and avoid chrome extensions
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Bypass service worker for Stockfish engine assets
  const url = new URL(event.request.url)
  if (url.pathname.includes("stockfish.wasm") || url.pathname.includes("stockfish.worker.js")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse)
            })
          }
        }).catch(() => {/* Ignore network update errors offline */})
        
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse
        }

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return networkResponse
      })
    })
  )
})

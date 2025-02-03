self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("pals-cache-v1")
      .then((cache) => {
        return cache.addAll([
          "/",
          "/index.html",
          "/manifest.json"
        ]).catch(error => {
          console.warn('Some assets failed to cache:', error);
          // Continue with installation even if some assets fail to cache
          return Promise.resolve();
        });
      })
  );
});

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body,
    icon: data.icon || "/icon.png",
    badge: data.badge || "/badge.png",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // Return a fallback response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Let other requests fail normally
          return Promise.reject('Failed to fetch');
        })
      );
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("https://pals-chat.vercel.app/"));
});

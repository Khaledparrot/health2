const C = "gutcare-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== C).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { caches.open(C).then((c) => c.put("./index.html", r.clone())); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});

/* tapping a reminder opens the app */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const key = (e.notification.data && e.notification.data.key) || "";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { try { c.postMessage({ type: "notif-click", key: key }); } catch (err) {} return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});

/* the page can ask the worker to post a notification */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "notify") {
    self.registration.showNotification(d.title, d.opts || {});
  }
});

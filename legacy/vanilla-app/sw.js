/* EduSaas service worker (F3): shows alerts pushed by the server and opens the app when tapped.
   No offline caching yet; that comes with F4. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'EduSaas', {
    body: d.body || '', icon: '/icon.svg', badge: '/icon.svg', tag: 'edusaas-' + (d.title || 'alert'),
    renotify: true, data: { url: d.url || '/' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL(e.notification.data && e.notification.data.url || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.location.origin) === 0 && 'focus' in list[i]) {
        list[i].navigate(url);
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});

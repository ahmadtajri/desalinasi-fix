// Self-unregistering service worker
// This file exists so that browsers with cached SW references
// will load this and unregister themselves automatically
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    self.registration.unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
            clients.forEach((client) => client.navigate(client.url));
        });
});

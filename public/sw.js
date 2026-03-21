self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : { title: "European Hockey Signal Engine", body: "New alert available." };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "European Hockey Signal Engine", {
      body: payload.body ?? "New alert available.",
      data: payload.url ?? "/member",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data ?? "/member"));
});

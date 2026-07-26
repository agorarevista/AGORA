/* global self, clients */

self.addEventListener(
  'push',
  event => {
    let payload = {
      title:
        'Agorá Revista',

      body:
        'Hay nuevo contenido disponible.',

      icon:
        '/android-chrome-192x192.png',

      badge:
        '/android-chrome-192x192.png',

      url:
        '/',

      data: {
        url:
          '/',
      },
    };

    if (event.data) {
      try {
        payload =
          {
            ...payload,
            ...event.data.json(),
          };
      } catch {
        payload.body =
          event.data.text();
      }
    }

    const options = {
      body:
        payload.body,

      icon:
        payload.icon ||
        '/android-chrome-192x192.png',

      badge:
        payload.badge ||
        '/android-chrome-192x192.png',

      image:
        payload.image ||
        undefined,

      tag:
        payload.tag ||
        'agora-notification',

      renotify:
        Boolean(
          payload.renotify
        ),

      requireInteraction:
        Boolean(
          payload
            .requireInteraction
        ),

      data: {
        ...payload.data,

        url:
          payload.url ||
          payload.data?.url ||
          '/',
      },

      actions:
        Array.isArray(
          payload.actions
        )
          ? payload.actions
          : [],
    };

    event.waitUntil(
      self.registration
        .showNotification(
          payload.title ||
          'Agorá Revista',
          options
        )
    );
  }
);

self.addEventListener(
  'notificationclick',
  event => {
    event.notification.close();

    const targetUrl =
      event.notification
        ?.data
        ?.url ||
      '/';

    event.waitUntil(
      clients
        .matchAll({
          type:
            'window',

          includeUncontrolled:
            true,
        })
        .then(
          windowClients => {
            for (
              const client
              of windowClients
            ) {
              const clientUrl =
                new URL(
                  client.url
                );

              const target =
                new URL(
                  targetUrl,
                  self.location
                    .origin
                );

              if (
                clientUrl.origin ===
                target.origin
              ) {
                return client
                  .focus()
                  .then(() =>
                    client.navigate(
                      target.href
                    )
                  );
              }
            }

            return clients.openWindow(
              targetUrl
            );
          }
        )
    );
  }
);

self.addEventListener(
  'notificationclose',
  () => {
    /*
     * El evento se conserva para poder
     * agregar analítica posteriormente.
     */
  }
);
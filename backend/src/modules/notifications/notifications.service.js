const webPush =
  require('web-push');

const supabase =
  require('../../config/supabase');

const SITE_URL =
  String(
    process.env.PUBLIC_SITE_URL ||
    'https://agorarevista.mx'
  ).replace(
    /\/+$/,
    ''
  );

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  '';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:contactoagorarevista@gmail.com';

let vapidConfigured =
  false;

const configureWebPush = () => {
  if (vapidConfigured) {
    return;
  }

  if (
    !VAPID_PUBLIC_KEY ||
    !VAPID_PRIVATE_KEY
  ) {
    throw new Error(
      'Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en el archivo .env'
    );
  }

  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  vapidConfigured =
    true;
};

const normalizeBoolean = (
  value,
  fallback = true
) => {
  if (
    typeof value ===
    'boolean'
  ) {
    return value;
  }

  return fallback;
};

const normalizeSubscription =
  subscription => {
    const endpoint =
      String(
        subscription?.endpoint ||
        ''
      ).trim();

    const p256dh =
      String(
        subscription?.keys
          ?.p256dh ||
        ''
      ).trim();

    const auth =
      String(
        subscription?.keys
          ?.auth ||
        ''
      ).trim();

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      const error =
        new Error(
          'La suscripción Push no es válida'
        );

      error.status = 400;

      throw error;
    }

    return {
      endpoint,
      p256dh,
      auth,

      expiration_time:
        Number.isFinite(
          Number(
            subscription
              ?.expirationTime
          )
        )
          ? Number(
              subscription
                .expirationTime
            )
          : null,
    };
  };

const getPublicKey = () => {
  if (!VAPID_PUBLIC_KEY) {
    const error =
      new Error(
        'Las notificaciones todavía no están configuradas'
      );

    error.status = 503;

    throw error;
  }

  return {
    publicKey:
      VAPID_PUBLIC_KEY,
  };
};

const saveSubscription =
  async ({
    subscription,
    preferences = {},
    userAgent = null,
  }) => {
    const normalized =
      normalizeSubscription(
        subscription
      );

    const row = {
      endpoint:
        normalized.endpoint,

      p256dh:
        normalized.p256dh,

      auth:
        normalized.auth,

      expiration_time:
        normalized
          .expiration_time,

      user_agent:
        typeof userAgent ===
          'string'
          ? userAgent.slice(
              0,
              1000
            )
          : null,

      notifications_articles:
        normalizeBoolean(
          preferences.articles,
          true
        ),

      notifications_galleries:
        normalizeBoolean(
          preferences.galleries,
          true
        ),

      notifications_convocatorias:
        normalizeBoolean(
          preferences.convocatorias,
          true
        ),

      is_active:
        true,

      last_error:
        null,

      last_error_at:
        null,
    };

    const {
      data,
      error,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .upsert(
        row,
        {
          onConflict:
            'endpoint',
        }
      )
      .select(
        `
          id,
          endpoint,
          notifications_articles,
          notifications_galleries,
          notifications_convocatorias,
          is_active,
          created_at,
          updated_at
        `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

const removeSubscription =
  async endpointValue => {
    const endpoint =
      String(
        endpointValue ||
        ''
      ).trim();

    if (!endpoint) {
      const error =
        new Error(
          'El endpoint es obligatorio'
        );

      error.status = 400;

      throw error;
    }

    const {
      error,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .delete()
      .eq(
        'endpoint',
        endpoint
      );

    if (error) {
      throw error;
    }

    return {
      removed: true,
    };
  };

const getPreferenceColumn =
  contentType => {
    if (
      contentType ===
      'article'
    ) {
      return (
        'notifications_articles'
      );
    }

    if (
      contentType ===
      'gallery'
    ) {
      return (
        'notifications_galleries'
      );
    }

    if (
      contentType ===
      'convocatoria'
    ) {
      return (
        'notifications_convocatorias'
      );
    }

    throw new Error(
      `Tipo de notificación no soportado: ${contentType}`
    );
  };

const buildNotification =
  ({
    contentType,
    content,
  }) => {
    const typeData = {
      article: {
        title:
          'Nuevo artículo en Agorá',

        path:
          `/articulos/${content.slug}`,
      },

      gallery: {
        title:
          'Nueva galería en Agorá',

        path:
          `/galeria/${content.slug}`,
      },

      convocatoria: {
        title:
          'Nueva convocatoria en Agorá',

        path:
          `/convocatoria/${content.id}`,
      },
    };

    const currentType =
      typeData[
        contentType
      ];

    if (!currentType) {
      throw new Error(
        'Tipo de notificación no reconocido'
      );
    }

    const contentTitle =
      String(
        content?.social_title ||
        content?.title ||
        'Nuevo contenido'
      ).trim();

    const description =
      String(
        content
          ?.social_description ||
        content?.excerpt ||
        content?.subtitle ||
        content?.description ||
        contentTitle
      )
        .replace(
          /\s+/g,
          ' '
        )
        .trim()
        .slice(
          0,
          180
        );

    const imageUrl =
      content
        ?.social_image_url ||
      content
        ?.cover_image_url ||
      null;

    const url =
      `${SITE_URL}${currentType.path}`;

    return {
      title:
        currentType.title,

      body:
        contentTitle,

      secondaryBody:
        description,

      /*
       * Icono principal grande de la notificación.
       */
      icon:
        `${SITE_URL}/android-chrome-192x192.png`,

      /*
       * No enviamos badge porque Android lo mostraba
       * como un segundo icono en la esquina superior.
       */
      badge:
        null,

      image:
        imageUrl,

      url,

      tag:
        `agora-${contentType}-${content.id}`,

      renotify:
        false,

      requireInteraction:
        false,

      data: {
        url,
        contentType,
        contentId:
          content.id,
      },

      actions: [
        {
          action:
            'open',

          title:
            'Leer ahora',
        },
      ],
    };
  };

const removeExpiredSubscription =
  async subscriptionId => {
    const {
      error,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .delete()
      .eq(
        'id',
        subscriptionId
      );

    if (error) {
      console.error(
        'No se pudo eliminar una suscripción Push vencida:',
        error
      );
    }
  };

const markSubscriptionSuccess =
  async subscriptionId => {
    const {
      error,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .update({
        last_success_at:
          new Date()
            .toISOString(),

        last_error:
          null,

        last_error_at:
          null,
      })
      .eq(
        'id',
        subscriptionId
      );

    if (error) {
      console.error(
        'No se pudo actualizar el estado exitoso de la suscripción:',
        error
      );
    }
  };

const markSubscriptionError =
  async (
    subscriptionId,
    errorValue
  ) => {
    const message =
      String(
        errorValue?.body ||
        errorValue?.message ||
        'Error desconocido'
      ).slice(
        0,
        2000
      );

    const {
      error,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .update({
        last_error:
          message,

        last_error_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        subscriptionId
      );

    if (error) {
      console.error(
        'No se pudo registrar el error Push:',
        error
      );
    }
  };

const sendContentNotification =
  async ({
    contentType,
    content,
  }) => {
    configureWebPush();

    if (
      !content?.id
    ) {
      throw new Error(
        'El contenido no contiene un ID'
      );
    }

    const preferenceColumn =
      getPreferenceColumn(
        contentType
      );

    const {
      data: subscriptions,
      error:
        subscriptionsError,
    } = await supabase
      .from(
        'push_subscriptions'
      )
      .select(
        `
          id,
          endpoint,
          p256dh,
          auth
        `
      )
      .eq(
        'is_active',
        true
      )
      .eq(
        preferenceColumn,
        true
      );

    if (
      subscriptionsError
    ) {
      throw subscriptionsError;
    }

    const notification =
      buildNotification({
        contentType,
        content,
      });

    const payload =
      JSON.stringify(
        notification
      );

    let successfulDeliveries =
      0;

    let failedDeliveries =
      0;

    await Promise.all(
      (
        subscriptions ||
        []
      ).map(
        async subscription => {
          try {
            await webPush
              .sendNotification(
                {
                  endpoint:
                    subscription
                      .endpoint,

                  keys: {
                    p256dh:
                      subscription
                        .p256dh,

                    auth:
                      subscription
                        .auth,
                  },
                },
                payload,
                {
                  TTL:
                    60 * 60 * 24,

                  urgency:
                    'normal',
                }
              );

            successfulDeliveries +=
              1;

            await markSubscriptionSuccess(
              subscription.id
            );
          } catch (error) {
            failedDeliveries +=
              1;

            const statusCode =
              Number(
                error?.statusCode ||
                0
              );

            if (
              statusCode ===
                404 ||
              statusCode ===
                410
            ) {
              await removeExpiredSubscription(
                subscription.id
              );

              return;
            }

            await markSubscriptionError(
              subscription.id,
              error
            );

            console.error(
              'Error enviando Web Push:',
              {
                statusCode,
                message:
                  error?.message,
              }
            );
          }
        }
      )
    );

    const {
      error: logError,
    } = await supabase
      .from(
        'push_notification_log'
      )
      .insert({
        content_type:
          contentType,

        content_id:
          content.id,

        title:
          notification.title,

        body:
          notification.body,

        url:
          notification.url,

        image_url:
          notification.image,

        total_subscriptions:
          (
            subscriptions ||
            []
          ).length,

        successful_deliveries:
          successfulDeliveries,

        failed_deliveries:
          failedDeliveries,
      });

    if (logError) {
      console.error(
        'No se pudo guardar el historial Push:',
        logError
      );
    }

    return {
      total:
        (
          subscriptions ||
          []
        ).length,

      successful:
        successfulDeliveries,

      failed:
        failedDeliveries,
    };
  };

const sendContentNotificationSafely =
  ({
    contentType,
    content,
  }) => {
    /*
     * La publicación no debe fallar aunque
     * el proveedor Push tenga un problema.
     */
    Promise.resolve()
      .then(() =>
        sendContentNotification({
          contentType,
          content,
        })
      )
      .then(result => {
        console.log(
          `🔔 Notificación ${contentType}:`,
          result
        );
      })
      .catch(error => {
        console.error(
          `❌ No se pudo enviar la notificación ${contentType}:`,
          error
        );
      });
  };

/*
 * Elimina únicamente el historial de
 * notificaciones que tenga más de 24 horas.
 *
 * No elimina push_subscriptions porque esas
 * filas son necesarias para seguir enviando
 * notificaciones a cada dispositivo.
 */
const cleanupNotificationLogs =
  async () => {
    const cutoffDate =
      new Date(
        Date.now() -
        24 *
        60 *
        60 *
        1000
      ).toISOString();

    const {
      data,
      error,
    } = await supabase
      .from(
        'push_notification_log'
      )
      .delete()
      .lt(
        'created_at',
        cutoffDate
      )
      .select('id');

    if (error) {
      throw error;
    }

    const deletedCount =
      Array.isArray(data)
        ? data.length
        : 0;

    console.log(
      `🧹 Historial Push eliminado: ${deletedCount} registro(s)`
    );

    return {
      deleted:
        deletedCount,

      cutoffDate,
    };
  };

module.exports = {
  getPublicKey,
  saveSubscription,
  removeSubscription,
  sendContentNotification,
  sendContentNotificationSafely,
  cleanupNotificationLogs,
};
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bell,
  BellRing,
  Check,
  X,
} from 'lucide-react';

import {
  getPushPublicKey,
  savePushSubscription,
} from '../../../api/notifications.api';

import styles from './NotificationPrompt.module.css';

const DISMISSED_KEY =
  'agora_push_prompt_dismissed_at';

const ENABLED_KEY =
  'agora_push_enabled';

const DISMISS_DAYS =
  7;

const urlBase64ToUint8Array =
  base64String => {
    const padding =
      '='.repeat(
        (
          4 -
          (
            base64String.length %
            4
          )
        ) %
        4
      );

    const base64 =
      (
        base64String +
        padding
      )
        .replace(
          /-/g,
          '+'
        )
        .replace(
          /_/g,
          '/'
        );

    const rawData =
      window.atob(
        base64
      );

    return Uint8Array.from(
      [
        ...rawData,
      ].map(
        character =>
          character
            .charCodeAt(0)
      )
    );
  };

const supportsPushNotifications =
  () => {
    return (
      typeof window !==
        'undefined' &&
      'serviceWorker' in
        navigator &&
      'PushManager' in
        window &&
      'Notification' in
        window
    );
  };

const shouldRespectDismissal =
  () => {
    const value =
      localStorage.getItem(
        DISMISSED_KEY
      );

    if (!value) {
      return false;
    }

    const dismissedAt =
      Number(value);

    if (
      !Number.isFinite(
        dismissedAt
      )
    ) {
      return false;
    }

    const elapsed =
      Date.now() -
      dismissedAt;

    return (
      elapsed <
      DISMISS_DAYS *
        24 *
        60 *
        60 *
        1000
    );
  };

export default function NotificationPrompt() {
  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    enabled,
    setEnabled,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const supported =
    useMemo(
      supportsPushNotifications,
      []
    );

  useEffect(() => {
    if (!supported) {
      return undefined;
    }

    if (
      Notification.permission ===
      'denied'
    ) {
      return undefined;
    }

    let cancelled =
      false;

    const checkSubscription =
      async () => {
        try {
          const registration =
            await navigator
              .serviceWorker
              .register(
                '/push-sw.js',
                {
                  scope:
                    '/',
                }
              );

          const subscription =
            await registration
              .pushManager
              .getSubscription();

          if (
            cancelled
          ) {
            return;
          }

          if (subscription) {
            setEnabled(
              true
            );

            localStorage.setItem(
              ENABLED_KEY,
              'true'
            );

            return;
          }

          const alreadyEnabled =
            localStorage.getItem(
              ENABLED_KEY
            ) === 'true';

          if (
            alreadyEnabled ||
            shouldRespectDismissal()
          ) {
            return;
          }

          /*
           * Esperamos unos segundos para
           * no interrumpir al visitante
           * apenas abre la página.
           */
          window.setTimeout(
            () => {
              if (
                !cancelled
              ) {
                setVisible(
                  true
                );
              }
            },
            4500
          );
        } catch (error) {
          console.error(
            'No se pudo preparar Web Push:',
            error
          );
        }
      };

    checkSubscription();

    return () => {
      cancelled =
        true;
    };
  }, [
    supported,
  ]);

  const closePrompt =
    () => {
      localStorage.setItem(
        DISMISSED_KEY,
        String(
          Date.now()
        )
      );

      setVisible(false);
      setErrorMessage('');
    };

  const enableNotifications =
    async () => {
      if (
        !supported ||
        loading
      ) {
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const permission =
          await Notification
            .requestPermission();

        if (
          permission !==
          'granted'
        ) {
          if (
            permission ===
            'denied'
          ) {
            setErrorMessage(
              'El navegador bloqueó las notificaciones. Puedes habilitarlas desde los permisos del sitio.'
            );
          }

          return;
        }

        const registration =
          await navigator
            .serviceWorker
            .register(
              '/push-sw.js',
              {
                scope:
                  '/',
              }
            );

        await navigator
          .serviceWorker
          .ready;

        const currentSubscription =
          await registration
            .pushManager
            .getSubscription();

        const {
          publicKey,
        } =
          await getPushPublicKey();

        const subscription =
          currentSubscription ||
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,

              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            });

        await savePushSubscription({
          subscription:
            subscription.toJSON(),

          preferences: {
            articles:
              true,

            galleries:
              true,

            convocatorias:
              true,
          },
        });

        localStorage.setItem(
          ENABLED_KEY,
          'true'
        );

        localStorage.removeItem(
          DISMISSED_KEY
        );

        setEnabled(true);
        setVisible(false);
      } catch (error) {
        console.error(
          'No se pudieron activar las notificaciones:',
          error
        );

        setErrorMessage(
          error?.response
            ?.data
            ?.error ||
          error?.response
            ?.data
            ?.message ||
          'No se pudieron activar las notificaciones. Inténtalo nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

  if (
    !supported ||
    enabled ||
    !visible
  ) {
    return null;
  }

  return (
    <aside
      className={
        styles.prompt
      }
      role="dialog"
      aria-modal="false"
      aria-labelledby="notification-prompt-title"
    >
      <button
        type="button"
        className={
          styles.closeButton
        }
        onClick={
          closePrompt
        }
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>

      <div
        className={
          styles.iconWrap
        }
      >
        <BellRing
          size={25}
        />
      </div>

      <div
        className={
          styles.content
        }
      >
        <span
          className={
            styles.eyebrow
          }
        >
          Mantente al día
        </span>

        <h2
          id="notification-prompt-title"
          className={
            styles.title
          }
        >
          Recibe novedades de Agorá
        </h2>

        <p
          className={
            styles.description
          }
        >
          Te avisaremos cuando publiquemos
          nuevos artículos, galerías y
          convocatorias.
        </p>

        <div
          className={
            styles.features
          }
        >
          <span>
            <Check
              size={13}
            />
            Artículos
          </span>

          <span>
            <Check
              size={13}
            />
            Galerías
          </span>

          <span>
            <Check
              size={13}
            />
            Convocatorias
          </span>
        </div>

        {errorMessage && (
          <p
            className={
              styles.error
            }
          >
            {errorMessage}
          </p>
        )}

        <div
          className={
            styles.actions
          }
        >
          <button
            type="button"
            className={
              styles.laterButton
            }
            onClick={
              closePrompt
            }
            disabled={
              loading
            }
          >
            Ahora no
          </button>

          <button
            type="button"
            className={
              styles.enableButton
            }
            onClick={
              enableNotifications
            }
            disabled={
              loading
            }
          >
            <Bell
              size={16}
            />

            {loading
              ? 'Activando...'
              : 'Activar notificaciones'}
          </button>
        </div>
      </div>
    </aside>
  );
}
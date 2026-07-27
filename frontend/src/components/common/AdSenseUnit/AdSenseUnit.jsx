import {
  useEffect,
  useRef,
} from 'react';

import styles from './AdSenseUnit.module.css';


const ADSENSE_CLIENT =
  'ca-pub-9597195473169265';


const isAgoraProduction = () => {
  if (
    typeof window ===
    'undefined'
  ) {
    return false;
  }

  return (
    window.location.hostname ===
      'agorarevista.mx' ||
    window.location.hostname ===
      'www.agorarevista.mx'
  );
};


export default function AdSenseUnit({
  slot,
  placement = 'content',
  label = 'Publicidad',
}) {
  const adRef =
    useRef(null);

  useEffect(() => {
    if (
      !slot ||
      !isAgoraProduction()
    ) {
      return undefined;
    }

    const advertisement =
      adRef.current;

    if (!advertisement) {
      return undefined;
    }

    /*
     * React StrictMode puede ejecutar efectos
     * dos veces durante desarrollo.
     *
     * También evitamos volver a solicitar un
     * anuncio que AdSense ya procesó.
     */
    if (
      advertisement.dataset
        .adsbygoogleStatus
    ) {
      return undefined;
    }

    const timeout =
      window.setTimeout(
        () => {
          try {
            window.adsbygoogle =
              window.adsbygoogle ||
              [];

            window.adsbygoogle.push(
              {}
            );
          } catch (error) {
            console.warn(
              'AdSense todavía no está disponible:',
              error
            );
          }
        },
        80
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    slot,
  ]);

  return (
    <aside
      className={`
        ${styles.wrapper}
        ${
          placement ===
          'footer'
            ? styles.footer
            : styles.content
        }
      `}
      aria-label={label}
    >
      <span
        className={
          styles.label
        }
      >
        {label}
      </span>

      {isAgoraProduction() ? (
        <ins
          ref={adRef}
          className={`adsbygoogle ${styles.ad}`}
          style={{
            display:
              'block',
          }}
          data-ad-client={
            ADSENSE_CLIENT
          }
          data-ad-slot={
            slot
          }
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      ) : (
        <div
          className={
            styles.developmentPlaceholder
          }
        >
          <span>
            Espacio publicitario
          </span>

          <small>
            Los anuncios reales solo se cargan en agorarevista.mx
          </small>
        </div>
      )}
    </aside>
  );
}
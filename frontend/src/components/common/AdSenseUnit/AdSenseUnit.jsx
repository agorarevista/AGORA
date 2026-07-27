import {
  useEffect,
  useRef,
  useState,
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

  const [
    isUnfilled,
    setIsUnfilled,
  ] = useState(false);


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

    setIsUnfilled(false);

    const observer =
      new MutationObserver(() => {
        const status =
          advertisement.getAttribute(
            'data-ad-status'
          );

        if (
          status ===
          'unfilled'
        ) {
          setIsUnfilled(true);
        }

        if (
          status ===
          'filled'
        ) {
          setIsUnfilled(false);
        }
      });

    observer.observe(
      advertisement,
      {
        attributes: true,
        attributeFilter: [
          'data-ad-status',
          'data-adsbygoogle-status',
        ],
      }
    );

    if (
      !advertisement.dataset
        .adsbygoogleStatus
    ) {
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
          120
        );

      return () => {
        window.clearTimeout(
          timeout
        );

        observer.disconnect();
      };
    }

    return () => {
      observer.disconnect();
    };
  }, [
    slot,
  ]);


  if (isUnfilled) {
    return null;
  }


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
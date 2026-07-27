import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  Check,
  HeartHandshake,
  RefreshCw,
  X,
} from 'lucide-react';

import styles from './AdBlockNotice.module.css';


const DISMISSED_KEY =
  'agora_adblock_notice_dismissed';


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


const wait = milliseconds => {
  return new Promise(
    resolve => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
};


const detectAdBlock =
  async () => {
    if (
      !isAgoraProduction()
    ) {
      return false;
    }

    /*
     * Señuelo con nombres que suelen
     * esconder los bloqueadores.
     */
    const bait =
      document.createElement(
        'div'
      );

    bait.className =
      'adsbox ad-banner advertisement adsbygoogle';

    bait.setAttribute(
      'aria-hidden',
      'true'
    );

    Object.assign(
      bait.style,
      {
        position:
          'absolute',

        top:
          '-10000px',

        left:
          '-10000px',

        width:
          '10px',

        height:
          '10px',

        display:
          'block',

        pointerEvents:
          'none',
      }
    );

    document.body.appendChild(
      bait
    );

    await wait(180);

    const computedStyle =
      window.getComputedStyle(
        bait
      );

    const baitWasBlocked =
      bait.offsetParent ===
        null ||
      bait.offsetHeight ===
        0 ||
      bait.offsetWidth ===
        0 ||
      computedStyle.display ===
        'none' ||
      computedStyle.visibility ===
        'hidden';

    bait.remove();

    /*
     * Cuando el script de AdSense carga,
     * crea el arreglo global adsbygoogle.
     */
    const scriptWasBlocked =
      !Array.isArray(
        window.adsbygoogle
      );

    return (
      baitWasBlocked ||
      scriptWasBlocked
    );
  };


export default function AdBlockNotice() {
  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');


  const runDetection =
    useCallback(
      async () => {
        const blocked =
          await detectAdBlock();

        return blocked;
      },
      []
    );


  useEffect(() => {
    if (
      !isAgoraProduction()
    ) {
      return undefined;
    }

    const wasDismissed =
      window.sessionStorage
        .getItem(
          DISMISSED_KEY
        ) ===
      'true';

    if (wasDismissed) {
      return undefined;
    }

    const timeout =
      window.setTimeout(
        async () => {
          const blocked =
            await runDetection();

          if (blocked) {
            setVisible(true);
          }
        },
        2200
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    runDetection,
  ]);


  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyDown =
      event => {
        if (
          event.key ===
          'Escape'
        ) {
          window.sessionStorage
            .setItem(
              DISMISSED_KEY,
              'true'
            );

          setVisible(false);
        }
      };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    visible,
  ]);


  const continueWithoutDisabling =
    () => {
      window.sessionStorage
        .setItem(
          DISMISSED_KEY,
          'true'
        );

      setMessage('');
      setVisible(false);
    };


  const verifyAgain =
    async () => {
      if (checking) {
        return;
      }

      setChecking(true);
      setMessage('');

      /*
       * Damos un momento a que la extensión
       * aplique el cambio al sitio.
       */
      await wait(500);

      const stillBlocked =
        await runDetection();

      if (stillBlocked) {
        setMessage(
          'Todavía parece estar activo. Desactívalo para agorarevista.mx y vuelve a intentarlo.'
        );

        setChecking(false);

        return;
      }

      setMessage(
        'Gracias. Recargando Agorá…'
      );

      window.setTimeout(
        () => {
          window.location.reload();
        },
        450
      );
    };


  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={
            styles.backdrop
          }
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.2,
          }}
          role="presentation"
        >
          <motion.section
            className={
              styles.modal
            }
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            transition={{
              duration: 0.28,
              ease:
                'easeOut',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agora-adblock-title"
            aria-describedby="agora-adblock-description"
          >
            <button
              type="button"
              className={
                styles.close
              }
              onClick={
                continueWithoutDisabling
              }
              aria-label="Cerrar y continuar"
            >
              <X size={18} />
            </button>

            <div
              className={
                styles.symbol
              }
              aria-hidden="true"
            >
              <span>Λ</span>
              <i />
            </div>

            <span
              className={
                styles.eyebrow
              }
            >
              Un pequeño gesto
            </span>

            <h2
              id="agora-adblock-title"
              className={
                styles.title
              }
            >
              Tu apoyo mantiene abierta Agorá
            </h2>

            <p
              id="agora-adblock-description"
              className={
                styles.description
              }
            >
              La publicidad nos ayuda a sostener este espacio editorial. Permitir anuncios en Agorá es una forma sencilla de apoyar las voces, imágenes e ideas que publicamos.
            </p>

            <div
              className={
                styles.note
              }
            >
              <HeartHandshake
                size={17}
              />

              <span>
                Los anuncios se muestran de forma discreta y solo dentro de artículos y galerías.
              </span>
            </div>

            {message && (
              <motion.p
                className={
                  styles.status
                }
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                role="status"
              >
                {message}
              </motion.p>
            )}

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  continueWithoutDisabling
                }
              >
                Seguir sin desactivar
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  verifyAgain
                }
                disabled={
                  checking
                }
              >
                {checking ? (
                  <>
                    <RefreshCw
                      size={16}
                      className={
                        styles.spinning
                      }
                    />

                    Comprobando…
                  </>
                ) : (
                  <>
                    <Check
                      size={16}
                    />

                    He desactivado el bloqueador
                  </>
                )}
              </button>
            </div>

            <p
              className={
                styles.disclaimer
              }
            >
              Puedes continuar leyendo aunque prefieras mantenerlo activo.
            </p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
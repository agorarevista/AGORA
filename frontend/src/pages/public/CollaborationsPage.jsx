import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  motion,
} from 'framer-motion';

import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Mail,
  Users,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa6';

import {
  SiSubstack,
} from 'react-icons/si';

import {
  getActiveConvocatorias,
} from '../../api/convocatorias.api';

import useAlert from '../../hooks/useAlert';

import styles from './CollaborationsPage.module.css';

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    name: 'Instagram',
    href:
      'https://www.instagram.com/agora_revista/',
    icon:
      <FaInstagram size={20} />,
  },
  {
    key: 'facebook',
    name: 'Facebook',
    href:
      'https://facebook.com/agorarevista',
    icon:
      <FaFacebookF size={18} />,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    href:
      'https://www.youtube.com/@agorarevistamx',
    icon:
      <FaYoutube size={21} />,
  },
  {
    key: 'substack',
    name: 'Substack',
    href:
      'https://agorarevista.substack.com',
    icon:
      <SiSubstack size={18} />,
  },
];

const formatDateTime = value => {
  if (!value) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'long',
      timeStyle: 'short',
    }
  ).format(
    new Date(value)
  );
};

const getRemainingTime = closesAt => {
  if (!closesAt) {
    return null;
  }

  const difference =
    new Date(closesAt).getTime() -
    Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  return {
    days:
      Math.floor(
        totalSeconds / 86400
      ),

    hours:
      Math.floor(
        (
          totalSeconds % 86400
        ) / 3600
      ),

    minutes:
      Math.floor(
        (
          totalSeconds % 3600
        ) / 60
      ),

    seconds:
      totalSeconds % 60,

    expired: false,
  };
};

const buildEmailBody =
  collaboration => {
    const rubricLines =
      (
        collaboration
          .email_rubrics || []
      )
        .map(
          rubric =>
            `${rubric}:`
        )
        .join('\n\n');

    return [
      'Hola, equipo de Agorá Revista:',
      '',
      `Deseo participar en la colaboración “${collaboration.title}”.`,
      '',
      rubricLines,
      '',
      'He revisado las bases y adjuntaré los archivos solicitados.',
      '',
      'Gracias por considerar mi participación.',
      '',
      'Saludos.',
    ].join('\n');
  };

export default function CollaborationsPage() {
  const alert = useAlert();

  const [
    collaboration,
    setCollaboration,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    remainingTime,
    setRemainingTime,
  ] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data =
          await getActiveConvocatorias();

        if (!mounted) {
          return;
        }

        setCollaboration(
          Array.isArray(data)
            ? data[0] || null
            : null
        );
      } catch (error) {
        console.error(
          'No se pudieron cargar las colaboraciones:',
          error
        );

        if (mounted) {
          setCollaboration(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !collaboration?.closes_at
    ) {
      setRemainingTime(null);
      return undefined;
    }

    const update = () => {
      const next =
        getRemainingTime(
          collaboration.closes_at
        );

      setRemainingTime(next);

      if (next?.expired) {
        setCollaboration(null);
      }
    };

    update();

    const interval =
      window.setInterval(
        update,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    collaboration?.closes_at,
  ]);

  const gmailComposeHref =
    useMemo(() => {
      if (!collaboration) {
        return '#';
      }

      const subject =
        `POSTULACIÓN - ${collaboration.title}`;

      const body =
        buildEmailBody(
          collaboration
        );

      const params =
        new URLSearchParams({
          view: 'cm',
          fs: '1',
          to:
            collaboration.contact_email,
          su: subject,
          body,
        });

      return (
        `https://mail.google.com/mail/?${params.toString()}`
      );
    }, [collaboration]);

  const copyEmail = async () => {
    const email =
      collaboration?.contact_email;

    if (!email) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        email
      );

      alert.success(
        'Correo copiado',
        `${email} está listo para pegarse`
      );
    } catch {
      alert.error(
        'No se pudo copiar',
        'Copia el correo manualmente'
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>Λ</span>
        <p>
          Consultando colaboraciones…
        </p>
      </div>
    );
  }

  if (!collaboration) {
    return <ClosedState />;
  }

  const maximum =
    collaboration.max_submissions;

  const occupied =
    Number(
      collaboration.filled_slots ||
      0
    );

  const available =
    collaboration.available_slots;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div
          className={
            styles.heroDecoration
          }
        >
          <span />
          <strong>Λ</strong>
          <span />
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={
            styles.heroContent
          }
        >
          <div
            className={
              styles.eyebrow
            }
          >
            Colaboración abierta
          </div>

          <h1 className={styles.title}>
            {collaboration.title}
          </h1>

          {collaboration.subtitle && (
            <p
              className={
                styles.subtitle
              }
            >
              {collaboration.subtitle}
            </p>
          )}
        </motion.div>
      </section>

      <section
        className={styles.content}
      >
        <div
          className={
            styles.mainColumn
          }
        >
          <div
            className={
              styles.detailsGrid
            }
          >
            <InfoCard
              icon={
                <CalendarDays
                  size={18}
                />
              }
              label="Apertura"
              value={formatDateTime(
                collaboration.opens_at
              )}
            />

            <InfoCard
              icon={
                <Clock3 size={18} />
              }
              label="Cierre"
              value={formatDateTime(
                collaboration.closes_at
              )}
            />

            <InfoCard
              icon={
                <Users size={18} />
              }
              label="Cupos"
              value={
                maximum
                  ? `${available} disponibles de ${maximum}`
                  : 'Sin límite definido'
              }
              secondary={
                maximum
                  ? `${occupied} ocupados`
                  : null
              }
            />
          </div>

          {remainingTime && (
            <div
              className={
                styles.countdown
              }
            >
              <div
                className={
                  styles.countdownLabel
                }
              >
                Tiempo restante
              </div>

              <div
                className={
                  styles.countdownGrid
                }
              >
                <TimeUnit
                  value={
                    remainingTime.days
                  }
                  label="Días"
                />

                <TimeUnit
                  value={
                    remainingTime.hours
                  }
                  label="Horas"
                />

                <TimeUnit
                  value={
                    remainingTime.minutes
                  }
                  label="Minutos"
                />

                <TimeUnit
                  value={
                    remainingTime.seconds
                  }
                  label="Segundos"
                />
              </div>
            </div>
          )}

          {collaboration.description && (
            <ContentSection
              title="La colaboración"
            >
              <p>
                {
                  collaboration.description
                }
              </p>
            </ContentSection>
          )}

          {collaboration.categories
            ?.length > 0 && (
            <ContentSection
              title="Categorías"
            >
              <div
                className={
                  styles.categories
                }
              >
                {collaboration.categories.map(
                  category => (
                    <span
                      key={category}
                      className={
                        styles.category
                      }
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            </ContentSection>
          )}

          {collaboration.requirements && (
            <ContentSection
              title="Bases y requisitos"
            >
              <p>
                {
                  collaboration.requirements
                }
              </p>
            </ContentSection>
          )}

          {collaboration.prizes && (
            <ContentSection
              title="Publicación y reconocimiento"
            >
              <p>
                {collaboration.prizes}
              </p>
            </ContentSection>
          )}

          <div
            className={
              styles.socialSection
            }
          >
            <span>
              Sigue la convocatoria
            </span>

            <div
              className={
                styles.socialLinks
              }
            >
              {SOCIAL_LINKS.map(
                social => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        <aside
          className={
            styles.participationCard
          }
        >
          <div
            className={
              styles.participationHeader
            }
          >
            Cómo participar
          </div>

          <div
            className={
              styles.emailBlock
            }
          >
            <span>
              Envía tu propuesta a:
            </span>

            <button
              type="button"
              className={
                styles.emailCopy
              }
              onClick={copyEmail}
              title="Copiar correo"
            >
              {
                collaboration.contact_email
              }

              <Copy size={14} />
            </button>
          </div>

          <a
            href={gmailComposeHref}
            target="_blank"
            rel="noopener noreferrer"
            className={
              styles.mailButton
            }
          >
            <Mail size={17} />
            Preparar correo
            <ExternalLink size={14} />
          </a>

          <div
            className={
              styles.rubrics
            }
          >
            <div
              className={
                styles.rubricsTitle
              }
            >
              El correo debe incluir:
            </div>

            <ul>
              {(
                collaboration.email_rubrics ||
                []
              ).map(rubric => (
                <li key={rubric}>
                  <Check size={16} />
                  <span>{rubric}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={
              styles.cardMetadata
            }
          >
            <div>
              <CalendarDays
                size={15}
              />

              <span>
                Fecha límite:
                <strong>
                  {' '}
                  {formatDateTime(
                    collaboration.closes_at
                  )}
                </strong>
              </span>
            </div>

            <div>
              <Users size={15} />

              <span>
                Cupos:
                <strong>
                  {' '}
                  {maximum
                    ? available
                    : 'Sin límite'}
                </strong>
              </span>
            </div>

            <div>
              <Mail size={15} />

              <span>
                Adjuntos:
                <strong>
                  {' '}
                  hasta{' '}
                  {
                    collaboration.max_file_size_mb
                  } MB
                </strong>
              </span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ClosedState() {
  return (
    <main
      className={styles.closedPage}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={
          styles.closedContent
        }
      >
        <div
          className={
            styles.closedOrnament
          }
        >
          <span />
          <strong>Λ</strong>
          <span />
        </div>

        <div
          className={
            styles.eyebrow
          }
        >
          Colaboraciones
        </div>

        <h1>
          Las puertas están cerradas
          por ahora.
        </h1>

        <p>
          Mantente cerca de Agorá para
          conocer la próxima colaboración.
        </p>

        <div
          className={
            styles.closedFoot
          }
        >
          AGORÁ
        </div>
      </motion.div>

      <div
        className={
          styles.closedDiagonal
        }
      />
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
  secondary,
}) {
  return (
    <div className={styles.infoCard}>
      <div
        className={
          styles.infoCardIcon
        }
      >
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>

        {secondary && (
          <small>{secondary}</small>
        )}
      </div>
    </div>
  );
}

function TimeUnit({
  value,
  label,
}) {
  return (
    <div
      className={
        styles.timeUnit
      }
    >
      <strong>
        {String(value).padStart(
          2,
          '0'
        )}
      </strong>

      <span>{label}</span>
    </div>
  );
}

function ContentSection({
  title,
  children,
}) {
  return (
    <section
      className={
        styles.contentSection
      }
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}
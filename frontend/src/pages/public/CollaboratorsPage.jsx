import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  motion,
} from 'framer-motion';

import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Mail,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';

import {
  getCollaborators,
} from '../../api/collaborators.api';

import styles from './CollaboratorsPage.module.css';


function XIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}


const normalizeUrl = value => {
  const clean =
    String(
      value || ''
    ).trim();

  if (!clean) {
    return '';
  }

  if (
    clean.startsWith(
      'mailto:'
    )
  ) {
    return clean;
  }

  if (
    /^https?:\/\//i.test(
      clean
    )
  ) {
    return clean;
  }

  return `https://${clean}`;
};


const getPhotoCrop =
  (
    photoUrl = ''
  ) => {
    const [
      cleanUrl,
      cropRaw,
    ] =
      String(
        photoUrl || ''
      ).split('#crop=');

    if (!cropRaw) {
      return {
        cleanUrl,
        x: 50,
        y: 20,
        zoom: 1,
      };
    }

    const [
      rawX,
      rawY,
      rawZoom,
    ] =
      cropRaw
        .split(',')
        .map(Number);

    return {
      cleanUrl,

      x:
        Number.isFinite(rawX)
          ? rawX
          : 50,

      y:
        Number.isFinite(rawY)
          ? rawY
          : 20,

      zoom:
        Number.isFinite(rawZoom)
          ? rawZoom
          : 1,
    };
  };


const getSocialEntries =
  collaborator => {
    const social =
      collaborator
        ?.social_links ||
      {};

    return [
      {
        key:
          'instagram',

        label:
          'Instagram',

        href:
          social.instagram ||
          social.instagram_url ||
          collaborator
            ?.instagram_url,

        icon:
          <FaInstagram
            size={19}
          />,
      },

      {
        key:
          'facebook',

        label:
          'Facebook',

        href:
          social.facebook ||
          social.facebook_url ||
          collaborator
            ?.facebook_url,

        icon:
          <FaFacebookF
            size={17}
          />,
      },

      {
        key:
          'linkedin',

        label:
          'LinkedIn',

        href:
          social.linkedin ||
          social.linkedin_url ||
          collaborator
            ?.linkedin_url,

        icon:
          <FaLinkedinIn
            size={17}
          />,
      },

      {
        key:
          'x',

        label:
          'X',

        href:
          social.x ||
          social.twitter ||
          social.twitter_url ||
          collaborator
            ?.twitter_url,

        icon:
          <XIcon
            width={17}
            height={17}
          />,
      },

      {
        key:
          'tiktok',

        label:
          'TikTok',

        href:
          social.tiktok ||
          social.tiktok_url ||
          collaborator
            ?.tiktok_url,

        icon:
          <FaTiktok
            size={17}
          />,
      },

      {
        key:
          'youtube',

        label:
          'YouTube',

        href:
          social.youtube ||
          social.youtube_url ||
          collaborator
            ?.youtube_url,

        icon:
          <FaYoutube
            size={18}
          />,
      },

      {
        key:
          'website',

        label:
          'Sitio web',

        href:
          social.website ||
          social.portfolio ||
          social.portfolio_url ||
          collaborator
            ?.website_url,

        icon:
          <Globe
            size={18}
          />,
      },

      {
        key:
          'email',

        label:
          'Correo',

        href:
          collaborator?.email
            ? `mailto:${collaborator.email}`
            : '',

        icon:
          <Mail
            size={18}
          />,
      },
    ].filter(
      item =>
        Boolean(
          item.href
        )
    );
  };


export default function CollaboratorsPage() {
  const [
    collaborators,
    setCollaborators,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(false);


  useEffect(() => {
    let mounted = true;

    const loadCollaborators =
      async () => {
        setLoading(true);
        setError(false);

        try {
          const data =
            await getCollaborators();

          if (!mounted) {
            return;
          }

          setCollaborators(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (
          requestError
        ) {
          console.error(
            'No fue posible cargar los colaboradores:',
            requestError
          );

          if (mounted) {
            setError(true);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadCollaborators();

    return () => {
      mounted = false;
    };
  }, []);


  const fixedCollaborators =
    useMemo(
      () => {
        return collaborators.filter(
          collaborator => {
            return (
              collaborator.type ===
                'fixed' ||
              Boolean(
                collaborator
                  .section_name
              ) ||
              Boolean(
                collaborator
                  .fixed_category
              )
            );
          }
        );
      },
      [
        collaborators,
      ]
    );


  const occasionalCollaborators =
    useMemo(
      () => {
        return collaborators.filter(
          collaborator => {
            return !(
              collaborator.type ===
                'fixed' ||
              Boolean(
                collaborator
                  .section_name
              ) ||
              Boolean(
                collaborator
                  .fixed_category
              )
            );
          }
        );
      },
      [
        collaborators,
      ]
    );


  if (loading) {
    return (
      <CollaboratorsSkeleton />
    );
  }


  if (error) {
    return (
      <CollaboratorsError />
    );
  }


  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroInner
          }
        >
          <Link
            to="/"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              size={14}
            />

            Inicio
          </Link>

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
              ease:
                'easeOut',
            }}
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Voces de Agorá
            </span>

            <h1
              className={
                styles.title
              }
            >
              Colaboradores
            </h1>

            <p
              className={
                styles.introduction
              }
            >
              Escritores, artistas, fotógrafos, investigadores y creadores que construyen las distintas miradas de Agorá.
            </p>
          </motion.div>
        </div>
      </header>

      <div
        className={
          styles.meander
        }
      />

      <div
        className={
          styles.content
        }
      >
        {fixedCollaborators.length >
          0 && (
          <CollaboratorGroup
            eyebrow="Voces permanentes"
            title="Columnistas"
            description="Autores que desarrollan una mirada propia a través de las columnas permanentes de Agorá."
            collaborators={
              fixedCollaborators
            }
          />
        )}

        {occasionalCollaborators.length >
          0 && (
          <CollaboratorGroup
            eyebrow="Encuentros y colaboraciones"
            title="Colaboradores"
            description="Creadores que participan en nuestras ediciones, galerías y proyectos editoriales."
            collaborators={
              occasionalCollaborators
            }
          />
        )}

        {collaborators.length ===
          0 && (
          <div
            className={
              styles.empty
            }
          >
            <span
              aria-hidden="true"
            >
              Λ
            </span>

            <h2>
              Próximamente
            </h2>

            <p>
              Las voces de Agorá aparecerán aquí.
            </p>
          </div>
        )}

        <JoinAgora />
      </div>
    </main>
  );
}


function CollaboratorGroup({
  eyebrow,
  title,
  description,
  collaborators,
}) {
  return (
    <section
      className={
        styles.group
      }
    >
      <header
        className={
          styles.groupHeader
        }
      >
        <div>
          <span
            className={
              styles.groupEyebrow
            }
          >
            {eyebrow}
          </span>

          <h2
            className={
              styles.groupTitle
            }
          >
            {title}
          </h2>
        </div>

        <div
          className={
            styles.groupMeta
          }
        >
          <p
            className={
              styles.groupDescription
            }
          >
            {description}
          </p>

          <span
            className={
              styles.groupCount
            }
          >
            {collaborators.length}{' '}
            {collaborators.length ===
              1
              ? 'integrante'
              : 'integrantes'}
          </span>
        </div>
      </header>

      <div
        className={
          styles.groupDivider
        }
      />

      <div
        className={
          styles.grid
        }
      >
        {collaborators.map(
          (
            collaborator,
            index
          ) => (
            <motion.div
              key={
                collaborator.id
              }
              className={
                styles.cardCell
              }
              initial={{
                opacity: 0,
                y: 22,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.1,
              }}
              transition={{
                duration: 0.4,
                delay:
                  Math.min(
                    index % 5,
                    4
                  ) * 0.055,
              }}
            >
              <CollaboratorCard
                collaborator={
                  collaborator
                }
              />
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}


function CollaboratorCard({
  collaborator,
}) {
  const crop =
    getPhotoCrop(
      collaborator.photo_url
    );

  const socialEntries =
    getSocialEntries(
      collaborator
    );

  const columnName =
    collaborator
      .section_name ||
    collaborator
      .fixed_category
      ?.name ||
    '';

  const profilePath =
    `/colaborador/${
      collaborator.slug ||
      collaborator.id
    }`;

  return (
    <article
      className={
        styles.card
      }
    >
      <Link
        to={
          profilePath
        }
        className={
          styles.cardMainLink
        }
        aria-label={`Ver perfil de ${collaborator.name}`}
      >
        <div
          className={
            styles.cardImage
          }
        >
          {crop.cleanUrl ? (
            <img
              src={
                crop.cleanUrl
              }
              alt={
                collaborator.name
              }
              style={{
                objectPosition:
                  `${crop.x}% ${crop.y}%`,

                transform:
                  `scale(${crop.zoom})`,
              }}
            />
          ) : (
            <div
              className={
                styles.cardPlaceholder
              }
            >
              {String(
                collaborator.name ||
                'A'
              )
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div
            className={
              styles.cardShade
            }
          />
        </div>

        <div
          className={
            styles.cardInformation
          }
        >
          <span
            className={
              styles.cardType
            }
          >
            {columnName
              ? 'Columnista'
              : 'Colaborador'}
          </span>

          <h3
            className={
              styles.cardName
            }
          >
            {collaborator.name}
          </h3>

          {columnName && (
            <span
              className={
                styles.cardColumn
              }
            >
              {columnName}
            </span>
          )}

          {!columnName &&
            collaborator.bio && (
            <p
              className={
                styles.cardBio
              }
            >
              {collaborator.bio}
            </p>
          )}

          <span
            className={
              styles.profileHint
            }
          >
            Ver perfil

            <ArrowRight
              size={14}
            />
          </span>
        </div>
      </Link>

      {socialEntries.length >
        0 && (
        <div
          className={
            styles.cardSocials
          }
        >
          {socialEntries.map(
            item => (
              <a
                key={
                  item.key
                }
                href={
                  normalizeUrl(
                    item.href
                  )
                }
                target={
                  item.key ===
                    'email'
                    ? undefined
                    : '_blank'
                }
                rel={
                  item.key ===
                    'email'
                    ? undefined
                    : 'noopener noreferrer'
                }
                className={
                  styles.cardSocial
                }
                aria-label={
                  `${item.label} de ${collaborator.name}`
                }
                title={
                  item.label
                }
              >
                {item.icon}
              </a>
            )
          )}
        </div>
      )}
    </article>
  );
}


function JoinAgora() {
  return (
    <section
      className={
        styles.join
      }
    >
      <div
        className={
          styles.joinSymbol
        }
        aria-hidden="true"
      >
        Λ
      </div>

      <div
        className={
          styles.joinContent
        }
      >
        <span
          className={
            styles.joinEyebrow
          }
        >
          Revisa nuestras convocatorias
        </span>

        <h2
          className={
            styles.joinTitle
          }
        >
          Sé parte de Agorá
        </h2>

        <p
          className={
            styles.joinText
          }
        >
          Buscamos nuevas voces, imágenes, ideas y formas de mirar el mundo. Conoce nuestras convocatorias y comparte tu trabajo con la comunidad de Agorá.
        </p>

        <Link
          to="/colaboraciones"
          className={
            styles.joinButton
          }
        >
          Ver colaboraciones

          <ArrowRight
            size={16}
          />
        </Link>
      </div>
    </section>
  );
}


function CollaboratorsSkeleton() {
  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.skeleton
        }
      >
        <div
          className={
            styles.skeletonHero
          }
        />

        <div
          className={
            styles.skeletonGrid
          }
        >
          {Array.from({
            length: 10,
          }).map(
            (_, index) => (
              <div
                key={index}
                className={
                  styles.skeletonCard
                }
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}


function CollaboratorsError() {
  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.errorState
        }
      >
        <span
          aria-hidden="true"
        >
          Λ
        </span>

        <h1>
          No pudimos cargar a los colaboradores
        </h1>

        <p>
          Intenta actualizar la página.
        </p>

        <Link to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
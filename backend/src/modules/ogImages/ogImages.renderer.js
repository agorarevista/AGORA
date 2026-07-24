const fs =
  require('fs');

const path =
  require('path');

const sharp =
  require('sharp');

const CARD_WIDTH =
  1200;

const CARD_HEIGHT =
  630;

/*
 * La fotografía ocupa más espacio que antes.
 *
 * Antes: 378 px
 * Ahora: 405 px
 */
const PHOTO_HEIGHT =
  405;

const CONTENT_HEIGHT =
  CARD_HEIGHT -
  PHOTO_HEIGHT;

const BACKGROUND_COLOR =
  '#181217';

const ACCENT_COLOR =
  '#B35491';

const TEXT_COLOR =
  '#FFF9F2';

const MUTED_COLOR =
  '#D7CBD2';

/*
 * Distribución del panel inferior:
 *
 * izquierda:
 * categoría, título y autor
 *
 * derecha:
 * logotipo centrado
 */
const LEFT_COLUMN_X =
  64;

const LEFT_COLUMN_WIDTH =
  700;

const DIVIDER_X =
  810;

const RIGHT_COLUMN_START =
  835;

const RIGHT_COLUMN_WIDTH =
  CARD_WIDTH -
  RIGHT_COLUMN_START;

const frontendAssetsPath =
  path.resolve(
    __dirname,
    '../../../../frontend/dist/assets'
  );

const normalizeText =
  value => {
    return String(
      value || ''
    )
      .replace(
        /&nbsp;/gi,
        ' '
      )
      .replace(
        /&amp;/gi,
        '&'
      )
      .replace(
        /&quot;/gi,
        '"'
      )
      .replace(
        /&#039;/gi,
        "'"
      )
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' '
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  };

const escapeXml =
  value => {
    return String(
      value || ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&apos;'
      );
  };

const truncateText = (
  value,
  maximum
) => {
  const clean =
    normalizeText(
      value
    );

  if (
    clean.length <=
    maximum
  ) {
    return clean;
  }

  return (
    clean
      .slice(
        0,
        maximum - 1
      )
      .trimEnd() +
    '…'
  );
};

const wrapText = (
  value,
  maximumCharacters,
  maximumLines
) => {
  const clean =
    normalizeText(
      value
    );

  if (!clean) {
    return [];
  }

  const words =
    clean.split(' ');

  const lines = [];

  let currentLine =
    '';

  words.forEach(
    word => {
      const candidate =
        currentLine
          ? `${currentLine} ${word}`
          : word;

      if (
        candidate.length <=
        maximumCharacters
      ) {
        currentLine =
          candidate;

        return;
      }

      if (currentLine) {
        lines.push(
          currentLine
        );
      }

      currentLine =
        word;
    }
  );

  if (currentLine) {
    lines.push(
      currentLine
    );
  }

  const visibleLines =
    lines.slice(
      0,
      maximumLines
    );

  if (
    lines.length >
      maximumLines &&
    visibleLines.length >
      0
  ) {
    const lastIndex =
      visibleLines.length -
      1;

    visibleLines[
      lastIndex
    ] =
      truncateText(
        visibleLines[
          lastIndex
        ],
        maximumCharacters
      );
  }

  return visibleLines;
};

const findAgoraLogoPath =
  () => {
    if (
      !fs.existsSync(
        frontendAssetsPath
      )
    ) {
      return null;
    }

    const files =
      fs.readdirSync(
        frontendAssetsPath
      );

    const logoFile =
      files.find(
        filename =>
          /^AGORAWHITE-.*\.png$/i
            .test(
              filename
            )
      );

    if (!logoFile) {
      return null;
    }

    return path.join(
      frontendAssetsPath,
      logoFile
    );
  };

/*
 * Imagen predeterminada del autor cuando
 * el contenido pertenece a Redacción Agorá
 * y no existe un colaborador individual.
 *
 * Usa exclusivamente:
 *
 * frontend/dist/assets/AGORABLANCO.png
 */
const findAgoraAuthorImagePath =
  () => {
    const agoraAuthorImagePath =
      path.join(
        frontendAssetsPath,
        'AGORABLANCO.png'
      );

    if (
      !fs.existsSync(
        agoraAuthorImagePath
      )
    ) {
      console.warn(
        `No se encontró la imagen predeterminada de Agorá en: ${agoraAuthorImagePath}`
      );

      return null;
    }

    return agoraAuthorImagePath;
  };

const fetchImageBuffer =
  async imageUrl => {
    if (!imageUrl) {
      return null;
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        12000
      );

    try {
      const response =
        await fetch(
          imageUrl,
          {
            signal:
              controller.signal,

            headers: {
              'User-Agent':
                'Agora-OG-Image/1.0',

              Accept:
                'image/avif,image/webp,image/png,image/jpeg,*/*',
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `La imagen respondió con ${response.status}`
        );
      }

      const arrayBuffer =
        await response
          .arrayBuffer();

      return Buffer.from(
        arrayBuffer
      );
    } catch (error) {
      console.warn(
        'No se pudo descargar una imagen para OG:',
        error.message
      );

      return null;
    } finally {
      clearTimeout(
        timeout
      );
    }
  };

const getArticleCategory =
  article => {
    const categories =
      Array.isArray(
        article
          ?.article_categories
      )
        ? article
            .article_categories
            .map(
              item =>
                item?.categories
            )
            .filter(
              Boolean
            )
        : [];

    return (
      categories[0]
        ?.name ||
      'Artículo'
    );
  };

const buildCardData =
  (
    content,
    type
  ) => {
    const isGallery =
      type ===
      'gallery';

    const title =
      content.social_title ||
      content.seo_title ||
      content.title ||
      'Agorá Revista';

    const category =
      isGallery
        ? 'Galería'
        : getArticleCategory(
            content
          );

    const sourceImage =
      content.social_image_url ||
      content.cover_image_url ||
      null;

    const author =
      content.collaborators ||
      null;

    return {
      title:
        normalizeText(
          title
        ),

      category:
        normalizeText(
          category
        ),

      authorName:
        normalizeText(
          author?.name ||
          'Agorá Revista'
        ),

      authorImage:
        author?.photo_url ||
        null,

      sourceImage,
    };
  };

const buildTextSvg =
  ({
    title,
    category,
    authorName,
  }) => {
    /*
     * Título ligeramente más compacto.
     *
     * Máximo dos líneas para evitar
     * que invada el área del autor.
     */
    const titleLines =
      wrapText(
        title,
        34,
        2
      );

    const categoryText =
      category
        .toUpperCase()
        .slice(
          0,
          20
        );

    /*
     * Etiqueta más compacta.
     */
    const categoryWidth =
      Math.max(
        72,
        Math.min(
          155,
          32 +
          (
            categoryText.length *
            7.2
          )
        )
      );

    /*
     * El título baja ligeramente para que
     * exista una separación visual clara
     * respecto a la categoría.
     */
    const titleStartY =
      490;

    const titleLineHeight =
      38;

    const titleTspans =
      titleLines
        .map(
          (
            line,
            index
          ) => {
            return `
              <tspan
                x="${LEFT_COLUMN_X}"
                y="${
                  titleStartY +
                  (
                    index *
                    titleLineHeight
                  )
                }"
              >
                ${escapeXml(line)}
              </tspan>
            `;
          }
        )
        .join('');

    return Buffer.from(`
      <svg
        width="${CARD_WIDTH}"
        height="${CARD_HEIGHT}"
        viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Fondo del panel inferior -->
        <rect
          x="0"
          y="${PHOTO_HEIGHT}"
          width="${CARD_WIDTH}"
          height="${CONTENT_HEIGHT}"
          fill="${BACKGROUND_COLOR}"
        />

        <!-- Línea de acento izquierda -->
        <rect
          x="0"
          y="${PHOTO_HEIGHT}"
          width="9"
          height="${CONTENT_HEIGHT}"
          fill="${ACCENT_COLOR}"
        />

        <!-- Etiqueta de categoría compacta -->
        <rect
          x="${LEFT_COLUMN_X}"
          y="419"
          width="${categoryWidth}"
          height="20"
          rx="3"
          fill="${ACCENT_COLOR}"
        />

        <text
          x="${
            LEFT_COLUMN_X +
            (
              categoryWidth /
              2
            )
          }"
          y="433"
          text-anchor="middle"
          fill="#FFFFFF"
          font-family="Arial, Helvetica, sans-serif"
          font-size="10"
          font-weight="700"
          letter-spacing="1.25"
        >
          ${escapeXml(
            categoryText
          )}
        </text>

        <!-- Título -->
        <text
          fill="${TEXT_COLOR}"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="34"
          font-weight="700"
        >
          ${titleTspans}
        </text>

        <!-- División morada vertical -->
        <line
          x1="${DIVIDER_X}"
          y1="430"
          x2="${DIVIDER_X}"
          y2="605"
          stroke="${ACCENT_COLOR}"
          stroke-width="2"
          opacity="0.9"
        />

        <!-- Nombre del autor -->
        <text
          x="145"
          y="574"
          fill="${TEXT_COLOR}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="24"
          font-weight="700"
        >
          ${escapeXml(
            authorName
          )}
        </text>

        <text
          x="145"
          y="603"
          fill="${ACCENT_COLOR}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="16"
          font-weight="600"
        >
          Autor
        </text>
      </svg>
    `);
  };

const createRectangularAuthorImage =
  async sourceBuffer => {
    if (!sourceBuffer) {
      return null;
    }

    /*
     * Retrato editorial vertical.
     */
    const width =
      64;

    const height =
      82;

    const borderSize =
      3;

    const innerPadding =
      5;

    const radius =
      10;

    const innerWidth =
      width -
      (
        borderSize *
        2
      );

    const innerHeight =
      height -
      (
        borderSize *
        2
      );

    const contentWidth =
      innerWidth -
      (
        innerPadding *
        2
      );

    const contentHeight =
      innerHeight -
      (
        innerPadding *
        2
      );

    const innerRadius =
      Math.max(
        radius -
        borderSize,
        1
      );

    try {
      /*
       * Usamos contain para que el símbolo completo
       * permanezca visible y centrado.
       *
       * Así no se corta el círculo superior.
       */
      const portrait =
        await sharp(
          sourceBuffer
        )
          .rotate()
          .resize({
            width:
              contentWidth,

            height:
              contentHeight,

            fit:
              'contain',

            position:
              'centre',

            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0,
            },
          })
          .extend({
            top:
              innerPadding,

            bottom:
              innerPadding,

            left:
              innerPadding,

            right:
              innerPadding,

            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0,
            },
          })
          .composite([
            {
              input:
                Buffer.from(`
                  <svg
                    width="${innerWidth}"
                    height="${innerHeight}"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="${innerWidth}"
                      height="${innerHeight}"
                      rx="${innerRadius}"
                      ry="${innerRadius}"
                      fill="#FFFFFF"
                    />
                  </svg>
                `),

              blend:
                'dest-in',
            },
          ])
          .png()
          .toBuffer();

      return sharp({
        create: {
          width,
          height,

          channels: 4,

          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        },
      })
        .composite([
          {
            input:
              Buffer.from(`
                <svg
                  width="${width}"
                  height="${height}"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0"
                    y="0"
                    width="${width}"
                    height="${height}"
                    rx="${radius}"
                    ry="${radius}"
                    fill="${ACCENT_COLOR}"
                  />
                </svg>
              `),

            left:
              0,

            top:
              0,
          },

          {
            input:
              portrait,

            left:
              borderSize,

            top:
              borderSize,
          },
        ])
        .png()
        .toBuffer();
    } catch (error) {
      console.warn(
        'No se pudo procesar la foto rectangular del autor:',
        error.message
      );

      return null;
    }
  };

const createOgImage =
  async (
    content,
    type
  ) => {
    const cardData =
      buildCardData(
        content,
        type
      );

    const [
      sourceBuffer,
      remoteAuthorBuffer,
    ] =
      await Promise.all([
        fetchImageBuffer(
          cardData
            .sourceImage
        ),

        fetchImageBuffer(
          cardData
            .authorImage
        ),
      ]);

    /*
     * Si el contenido no tiene colaborador o
     * el colaborador no tiene fotografía,
     * utilizamos el icono oficial de Agorá.
     */
    let authorBuffer =
      remoteAuthorBuffer;

    if (!authorBuffer) {
      const agoraAuthorPath =
        findAgoraAuthorImagePath();

      if (agoraAuthorPath) {
        try {
          authorBuffer =
            fs.readFileSync(
              agoraAuthorPath
            );
        } catch (error) {
          console.warn(
            'No se pudo leer el icono de autor de Agorá:',
            error.message
          );
        }
      }
    }

    const composites = [];

    /*
     * Portada con mayor protagonismo.
     */
    if (sourceBuffer) {
      try {
        const resizedPhoto =
          await sharp(
            sourceBuffer
          )
            .rotate()
            .resize({
              width:
                CARD_WIDTH,

              height:
                PHOTO_HEIGHT,

              fit:
                'cover',

              position:
                'centre',
            })
            .png()
            .toBuffer();

        composites.push({
          input:
            resizedPhoto,

          left:
            0,

          top:
            0,
        });
      } catch (error) {
        console.warn(
          'No se pudo procesar la portada OG:',
          error.message
        );
      }
    }

    /*
     * Panel inferior, título, categoría,
     * autor y división vertical.
     */
    composites.push({
      input:
        buildTextSvg(
          cardData
        ),

      left:
        0,

      top:
        0,
    });

    /*
     * Fotografía rectangular del autor.
     */
    const rectangularAuthorImage =
      await createRectangularAuthorImage(
        authorBuffer
      );

    if (
      rectangularAuthorImage
    ) {
      composites.push({
        input:
          rectangularAuthorImage,

        left:
          64,

        top:
          538,
      });
    }

    /*
     * Logo centrado en la columna derecha.
     */
    const logoPath =
      findAgoraLogoPath();

    if (logoPath) {
      try {
        const logoWidth =
          245;

        const logoBuffer =
          await sharp(
            logoPath
          )
            .resize({
              width:
                logoWidth,

              fit:
                'inside',

              withoutEnlargement:
                true,
            })
            .png()
            .toBuffer();

        const logoMetadata =
          await sharp(
            logoBuffer
          )
            .metadata();

        const logoHeight =
          logoMetadata.height ||
          100;

        const logoLeft =
          Math.round(
            RIGHT_COLUMN_START +
            (
              (
                RIGHT_COLUMN_WIDTH -
                logoWidth
              ) /
              2
            )
          );

        const logoTop =
          Math.round(
            PHOTO_HEIGHT +
            (
              (
                CONTENT_HEIGHT -
                logoHeight
              ) /
              2
            )
          );

        composites.push({
          input:
            logoBuffer,

          left:
            logoLeft,

          top:
            logoTop,
        });
      } catch (error) {
        console.warn(
          'No se pudo procesar el logo de Agorá:',
          error.message
        );
      }
    }

    return sharp({
      create: {
        width:
          CARD_WIDTH,

        height:
          CARD_HEIGHT,

        channels: 4,

        background:
          BACKGROUND_COLOR,
      },
    })
      .composite(
        composites
      )
      .png({
        quality: 92,
        compressionLevel: 8,
      })
      .toBuffer();
  };

module.exports = {
  createOgImage,
};
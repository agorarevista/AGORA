const SITE_URL =
  process.env.PUBLIC_SITE_URL ||
  'https://agorarevista.mx';

const BACKEND_URL =
  process.env.PUBLIC_BACKEND_URL ||
  SITE_URL;

const DEFAULT_TITLE =
  'Agorá Revista';

const DEFAULT_DESCRIPTION =
  'Cultura, pensamiento y creación.';

const DEFAULT_IMAGE =
  `${SITE_URL}/android-chrome-512x512.png`;

/*
 * Convierte caracteres peligrosos para que
 * ningún título o descripción pueda romper
 * el HTML del documento.
 */
const escapeHtml = value => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/*
 * Limpia espacios, saltos y entidades comunes.
 */
const normalizeText = value => {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

/*
 * Elimina etiquetas HTML.
 */
const stripHtml = html => {
  return normalizeText(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
};

/*
 * Obtiene el primer párrafo real del artículo.
 *
 * Busca primero una etiqueta <p>.
 * Si no existe, usa el texto completo limpio.
 */
const extractFirstParagraph = html => {
  const source =
    String(html || '');

  const paragraphs =
    source.match(
      /<p\b[^>]*>[\s\S]*?<\/p>/gi
    ) || [];

  for (
    const paragraph of paragraphs
  ) {
    const text =
      stripHtml(paragraph);

    if (text.length >= 20) {
      return text;
    }
  }

  return stripHtml(source);
};

const truncateText = (
  value,
  maximum
) => {
  const text =
    normalizeText(value);

  if (
    text.length <= maximum
  ) {
    return text;
  }

  return (
    text
      .slice(
        0,
        maximum - 1
      )
      .trimEnd() +
    '…'
  );
};

const ensureAbsoluteUrl = (
  value,
  fallback =
    DEFAULT_IMAGE
) => {
  const clean =
    String(value || '')
      .trim();

  if (!clean) {
    return fallback;
  }

  if (
    /^https?:\/\//i.test(
      clean
    )
  ) {
    return clean;
  }

  if (
    clean.startsWith('/')
  ) {
    return (
      `${SITE_URL}${clean}`
    );
  }

  return (
    `${SITE_URL}/${clean}`
  );
};

const buildArticleMetadata =
  article => {
    const canonicalUrl =
      `${SITE_URL}/articulos/${article.slug}`;

    const firstParagraph =
      extractFirstParagraph(
        article.content_html
      );

    const fallbackDescription =
      firstParagraph ||
      article.excerpt ||
      article.subtitle ||
      DEFAULT_DESCRIPTION;

    const seoTitle =
      truncateText(
        article.seo_title ||
        article.title ||
        DEFAULT_TITLE,
        70
      );

    const seoDescription =
      truncateText(
        article.seo_description ||
        fallbackDescription,
        180
      );

    const socialTitle =
      truncateText(
        article.social_title ||
        article.seo_title ||
        article.title ||
        DEFAULT_TITLE,
        100
      );

    const socialDescription =
      truncateText(
        article.social_description ||
        article.seo_description ||
        fallbackDescription,
        200
      );

    /*
     * La fotografía original continúa almacenada
     * en Imgur, pero Open Graph recibe una tarjeta
     * completa generada por el backend.
     */
    const socialImage =
      `${BACKEND_URL}/og/articulos/${encodeURIComponent(
        article.slug
      )}`;

    return {
      pageType:
        'article',

      canonicalUrl,
      seoTitle,
      seoDescription,
      socialTitle,
      socialDescription,
      socialImage,

      publishedAt:
        article.published_at ||
        null,

      author:
        article.collaborators
          ?.name ||
        null,
    };
  };

const buildGalleryMetadata =
  gallery => {
    const canonicalUrl =
      `${SITE_URL}/galeria/${gallery.slug}`;

    const fallbackDescription =
      gallery.excerpt ||
      gallery.subtitle ||
      'Álbum fotográfico de Agorá Revista.';

    const seoTitle =
      truncateText(
        gallery.seo_title ||
        gallery.title ||
        DEFAULT_TITLE,
        70
      );

    const seoDescription =
      truncateText(
        gallery.seo_description ||
        fallbackDescription,
        180
      );

    const socialTitle =
      truncateText(
        gallery.social_title ||
        gallery.seo_title ||
        gallery.title ||
        DEFAULT_TITLE,
        100
      );

    const socialDescription =
      truncateText(
        gallery.social_description ||
        gallery.seo_description ||
        fallbackDescription,
        200
      );

    /*
     * La portada original puede seguir viniendo
     * desde Imgur. Esta URL devuelve la composición
     * social terminada como PNG.
     */
    const socialImage =
      `${BACKEND_URL}/og/galerias/${encodeURIComponent(
        gallery.slug
      )}`;

    return {
      pageType:
        'website',

      canonicalUrl,
      seoTitle,
      seoDescription,
      socialTitle,
      socialDescription,
      socialImage,

      publishedAt:
        gallery.published_at ||
        null,

      author:
        gallery.collaborators
          ?.name ||
        null,
    };
  };

const buildSeoTags =
  metadata => {
    const title =
      escapeHtml(
        metadata.seoTitle
      );

    const description =
      escapeHtml(
        metadata.seoDescription
      );

    const socialTitle =
      escapeHtml(
        metadata.socialTitle
      );

    const socialDescription =
      escapeHtml(
        metadata.socialDescription
      );

    const image =
      escapeHtml(
        metadata.socialImage
      );

    const canonicalUrl =
      escapeHtml(
        metadata.canonicalUrl
      );

    const extraArticleTags =
      metadata.pageType ===
      'article'
        ? `
    ${
      metadata.publishedAt
        ? `<meta property="article:published_time" content="${escapeHtml(
            metadata.publishedAt
          )}" />`
        : ''
    }
    ${
      metadata.author
        ? `<meta name="author" content="${escapeHtml(
            metadata.author
          )}" />`
        : ''
    }`
        : '';

    return `
    <!-- SEO_DYNAMIC_START -->

    <title>${title}</title>

    <meta
      name="description"
      content="${description}"
    />

    <link
      rel="canonical"
      href="${canonicalUrl}"
    />

    <meta
      property="og:locale"
      content="es_MX"
    />

    <meta
      property="og:site_name"
      content="Agorá Revista"
    />

    <meta
      property="og:type"
      content="${metadata.pageType}"
    />

    <meta
      property="og:title"
      content="${socialTitle}"
    />

    <meta
      property="og:description"
      content="${socialDescription}"
    />

    <meta
      property="og:image"
      content="${image}"
    />

    <meta
      property="og:image:secure_url"
      content="${image}"
    />

    <meta
      property="og:image:type"
      content="image/png"
    />

    <meta
      property="og:image:width"
      content="1200"
    />

    <meta
      property="og:image:height"
      content="630"
    />

    <meta
      property="og:image:alt"
      content="${socialTitle}"
    />

    <meta
      property="og:url"
      content="${canonicalUrl}"
    />

    <meta
      name="twitter:card"
      content="summary_large_image"
    />

    <meta
      name="twitter:title"
      content="${socialTitle}"
    />

    <meta
      name="twitter:description"
      content="${socialDescription}"
    />

    <meta
      name="twitter:image"
      content="${image}"
    />

    <meta
      name="twitter:image:alt"
      content="${socialTitle}"
    />

    ${extraArticleTags}

    <!-- SEO_DYNAMIC_END -->
`;
  };

const injectSeoIntoHtml = (
  html,
  metadata
) => {
  let result =
    String(html || '');

  /*
   * Elimina el título genérico de Vite.
   */
  result =
    result.replace(
      /<title>[\s\S]*?<\/title>/i,
      ''
    );

  /*
   * Evita duplicados en caso de que posteriormente
   * agregues etiquetas generales en index.html.
   */
  result =
    result.replace(
      /<!-- SEO_DYNAMIC_START -->[\s\S]*?<!-- SEO_DYNAMIC_END -->/gi,
      ''
    );

  const seoTags =
    buildSeoTags(
      metadata
    );

  return result.replace(
    '</head>',
    `${seoTags}\n  </head>`
  );
};

module.exports = {
  buildArticleMetadata,
  buildGalleryMetadata,
  injectSeoIntoHtml,
};
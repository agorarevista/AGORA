const supabase = require('../../config/supabase');

const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL ||
  'https://agorarevista.mx';


const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};


const safeQuery = async (
  table,
  columns,
  configureQuery
) => {
  try {
    let query = supabase
      .from(table)
      .select(columns);

    if (typeof configureQuery === 'function') {
      query = configureQuery(query);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        `[SITEMAP] Error consultando ${table}:`,
        error.message
      );

      return [];
    }

    return Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error(
      `[SITEMAP] Error inesperado en ${table}:`,
      error.message
    );

    return [];
  }
};


const createUrlEntry = ({
  location,
  lastModified,
  changeFrequency,
  priority,
}) => {
  const tags = [
    '  <url>',
    `    <loc>${escapeXml(location)}</loc>`,
  ];

  if (lastModified) {
    tags.push(
      `    <lastmod>${escapeXml(lastModified)}</lastmod>`
    );
  }

  if (changeFrequency) {
    tags.push(
      `    <changefreq>${escapeXml(changeFrequency)}</changefreq>`
    );
  }

  if (
    priority !== undefined &&
    priority !== null
  ) {
    tags.push(
      `    <priority>${Number(priority).toFixed(1)}</priority>`
    );
  }

  tags.push('  </url>');

  return tags.join('\n');
};

const removeDuplicateUrls = (urls) => {
  const uniqueUrls = new Map();

  urls.forEach((item) => {
    if (!item?.location) {
      return;
    }

    uniqueUrls.set(item.location, item);
  });

  return Array.from(uniqueUrls.values());
};

const getSitemap = async (req, res) => {
  try {

    const articlesPromise = safeQuery(
      'articles',
      'slug, updated_at, created_at, published_at, status',
      (query) =>
        query
          .eq('status', 'published')
          .not('slug', 'is', null)
    );

    const categoriesPromise = safeQuery(
      'categories',
      'slug, updated_at, created_at',
      (query) =>
        query.not('slug', 'is', null)
    );

    const collaboratorsPromise = safeQuery(
      'collaborators',
      'slug, updated_at, created_at',
      (query) =>
        query.not('slug', 'is', null)
    );

    const editionsPromise = safeQuery(
      'editions',
      'number, updated_at, created_at',
      (query) =>
        query.not('number', 'is', null)
    );

    const galleriesPromise = safeQuery(
      'galleries',
      'slug, updated_at, created_at',
      (query) =>
        query.not('slug', 'is', null)
    );

    const convocatoriasPromise = safeQuery(
      'convocatorias',
      'slug, updated_at, created_at',
      (query) =>
        query.not('slug', 'is', null)
    );

    const [
      articles,
      categories,
      collaborators,
      editions,
      galleries,
      convocatorias,
    ] = await Promise.all([
      articlesPromise,
      categoriesPromise,
      collaboratorsPromise,
      editionsPromise,
      galleriesPromise,
      convocatoriasPromise,
    ]);

    const urls = [
  
      {
        location: `${PUBLIC_SITE_URL}/`,
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        location: `${PUBLIC_SITE_URL}/buscar`,
        changeFrequency: 'weekly',
        priority: 0.5,
      },
      {
        location: `${PUBLIC_SITE_URL}/columnas`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        location: `${PUBLIC_SITE_URL}/ediciones`,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        location: `${PUBLIC_SITE_URL}/archivo`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        location: `${PUBLIC_SITE_URL}/ediciones-especiales`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        location: `${PUBLIC_SITE_URL}/colaboraciones`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        location: `${PUBLIC_SITE_URL}/galeria`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        location: `${PUBLIC_SITE_URL}/quienes-somos`,
        changeFrequency: 'monthly',
        priority: 0.5,
      },


      ...articles.map((article) => ({
        location:
          `${PUBLIC_SITE_URL}/articulos/${encodeURIComponent(
            article.slug
          )}`,
        lastModified:
          normalizeDate(
            article.updated_at ||
            article.published_at ||
            article.created_at
          ),
        changeFrequency: 'monthly',
        priority: 0.9,
      })),

      ...categories.map((category) => ({
        location:
          `${PUBLIC_SITE_URL}/categoria/${encodeURIComponent(
            category.slug
          )}`,
        lastModified:
          normalizeDate(
            category.updated_at ||
            category.created_at
          ),
        changeFrequency: 'weekly',
        priority: 0.7,
      })),


      ...collaborators.map((collaborator) => ({
        location:
          `${PUBLIC_SITE_URL}/colaborador/${encodeURIComponent(
            collaborator.slug
          )}`,
        lastModified:
          normalizeDate(
            collaborator.updated_at ||
            collaborator.created_at
          ),
        changeFrequency: 'monthly',
        priority: 0.6,
      })),


      ...editions.map((edition) => ({
        location:
          `${PUBLIC_SITE_URL}/edicion/${encodeURIComponent(
            edition.number
          )}`,
        lastModified:
          normalizeDate(
            edition.updated_at ||
            edition.created_at
          ),
        changeFrequency: 'monthly',
        priority: 0.8,
      })),

      
      ...galleries.map((gallery) => ({
        location:
          `${PUBLIC_SITE_URL}/galeria/${encodeURIComponent(
            gallery.slug
          )}`,
        lastModified:
          normalizeDate(
            gallery.updated_at ||
            gallery.created_at
          ),
        changeFrequency: 'monthly',
        priority: 0.7,
      })),


      ...convocatorias.map((convocatoria) => ({
        location:
          `${PUBLIC_SITE_URL}/convocatoria/${encodeURIComponent(
            convocatoria.slug
          )}`,
        lastModified:
          normalizeDate(
            convocatoria.updated_at ||
            convocatoria.created_at
          ),
        changeFrequency: 'weekly',
        priority: 0.8,
      })),
    ];

    const uniqueUrls =
      removeDuplicateUrls(urls);

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...uniqueUrls.map(createUrlEntry),
      '</urlset>',
    ].join('\n');

    res.set({
      'Content-Type':
        'application/xml; charset=UTF-8',


      'Cache-Control':
        'public, max-age=3600, s-maxage=3600',
    });

    return res.status(200).send(xml);
  } catch (error) {
    console.error(
      '[SITEMAP] Error generando sitemap:',
      error
    );

    return res.status(500).type('text/plain').send(
      'No fue posible generar el sitemap.'
    );
  }
};

const getRobots = (req, res) => {
  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');

  res.set({
    'Content-Type':
      'text/plain; charset=UTF-8',

    'Cache-Control':
      'public, max-age=3600, s-maxage=3600',
  });

  return res.status(200).send(robots);
};

module.exports = {
  getSitemap,
  getRobots,
};
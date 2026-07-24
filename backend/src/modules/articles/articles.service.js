const supabase = require('../../config/supabase');
const { slugify } = require('../../utils/slugify');
const { readingTime } = require('../../utils/readingTime');
const { publishToSubstack } = require('../substack/substack.service');
const { getCache, setCache } = require('../../middleware/cache');
const CACHE_KEYS = {
  HOME_PAYLOAD: 'home_payload'
};

const CACHE_TTL = {
  HOME_PAYLOAD: 10 // segundos
};

const invalidateHomeCache = () => {
  setCache(
    CACHE_KEYS.HOME_PAYLOAD,
    null,
    0
  );
};

const normalizeArticleContent =
  article => {
    return {
      ...article,

      content_type:
        'article',
    };
  };

const normalizeGalleryContent =
  gallery => {
    return {
      ...gallery,

      content_type:
        'gallery',

      article_categories: [
        {
          categories: {
            id:
              'gallery',

            name:
              'Álbum fotográfico',

            slug:
              'galeria',

            color:
              '#A4518D',
          },
        },
      ],
    };
  };

const getContentDate =
  item => {
    const date =
      item?.published_at ||
      item?.created_at;

    const timestamp =
      new Date(
        date || 0
      ).getTime();

    return Number.isFinite(
      timestamp
    )
      ? timestamp
      : 0;
  };

const sortContentsByDate =
  contents => {
    return [
      ...(contents || []),
    ].sort(
      (a, b) =>
        getContentDate(b) -
        getContentDate(a)
    );
  };

const sortFeaturedContents =
  contents => {
    return [
      ...(contents || []),
    ].sort(
      (a, b) => {
        const orderA =
          Number.isFinite(
            Number(
              a?.featured_order
            )
          )
            ? Number(
                a.featured_order
              )
            : 9999;

        const orderB =
          Number.isFinite(
            Number(
              b?.featured_order
            )
          )
            ? Number(
                b.featured_order
              )
            : 9999;

        if (
          orderA !== orderB
        ) {
          return (
            orderA -
            orderB
          );
        }

        return (
          getContentDate(b) -
          getContentDate(a)
        );
      }
    );
  };

const validateEditionHighlight =
  async ({
    editionId,
    isFeatured,
    featuredOrder,
    articleId = null,
  }) => {
    if (!isFeatured) {
      return;
    }

    if (!editionId) {
      throw {
        status: 400,
        message:
          'Selecciona una edición antes de marcar el artículo como highlight.',
      };
    }

    const order =
      Number(
        featuredOrder
      );

    if (
      !Number.isInteger(order) ||
      order < 1 ||
      order > 4
    ) {
      throw {
        status: 400,
        message:
          'El orden del highlight debe estar entre 1 y 4.',
      };
    }

    let articlesQuery =
      supabase
        .from('articles')
        .select(
          'id, featured_order'
        )
        .eq(
          'edition_id',
          editionId
        )
        .eq(
          'is_featured',
          true
        );

    if (articleId) {
      articlesQuery =
        articlesQuery.neq(
          'id',
          articleId
        );
    }

    const [
      articlesResult,
      galleriesResult,
    ] = await Promise.all([
      articlesQuery,

      supabase
        .from('galleries')
        .select(
          'id, featured_order'
        )
        .eq(
          'edition_id',
          editionId
        )
        .eq(
          'is_featured',
          true
        ),
    ]);

    if (
      articlesResult.error
    ) {
      throw articlesResult.error;
    }

    if (
      galleriesResult.error
    ) {
      throw galleriesResult.error;
    }

    const currentHighlights = [
      ...(articlesResult.data || []),
      ...(galleriesResult.data || []),
    ];

    if (
      currentHighlights.length >=
      4
    ) {
      throw {
        status: 400,
        message:
          'Esta edición ya tiene cuatro highlights. Desmarca uno antes de agregar otro.',
      };
    }

    const duplicatedOrder =
      currentHighlights.some(
        item =>
          Number(
            item.featured_order
          ) === order
      );

    if (duplicatedOrder) {
      throw {
        status: 400,
        message:
          `La posición ${order} ya está ocupada por otro highlight de esta edición.`,
      };
    }
  };

const validateArticleCategories =
  async categoryIds => {
    const normalizedIds =
      Array.isArray(categoryIds)
        ? categoryIds.filter(Boolean)
        : [];

    if (
      normalizedIds.length === 0
    ) {
      return;
    }

    const {
      data: categories,
      error,
    } = await supabase
      .from('categories')
      .select(
        'id, name, slug'
      )
      .in(
        'id',
        normalizedIds
      );

    if (error) {
      throw error;
    }

    const galleryCategory =
      (categories || []).find(
        category => {
          return (
            String(
              category.slug || ''
            )
              .trim()
              .toLowerCase() ===
            'galeria'
          );
        }
      );

    if (galleryCategory) {
      throw {
        status: 400,

        message:
          'La sección Galería no acepta artículos tradicionales. Utiliza el módulo de galerías fotográficas.',
      };
    }
  };
// Campos base para listados
const BASE_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  cover_image_url,
  cover_caption,
  cover_caption_format,
  seo_title,
  seo_description,
  social_title,
  social_description,
  social_image_url,
  published_at,
  created_at,
  status,
  views,
  reading_time,
  edition_id,
  is_featured,
  featured_order,
  audio_male_url,
  audio_female_url,
  audio_male_duration,
  audio_female_duration,
  audio_status,
  audio_error,
  audio_updated_at,
  collaborators ( id, name, slug, photo_url, type, section_name, section_slug, social_links ),
  editions (
    id,
    number,
    name,
    is_current,
    is_special
  ),
  article_categories ( categories ( id, name, slug, color ) ),
  article_tags ( tag, tag_type )
`;

// Campos completos para edición individual
const EDITOR_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  content,
  content_html,
  cover_image_url,
  cover_caption,
  cover_caption_format,
  seo_title,
  seo_description,
  social_title,
  social_description,
  social_image_url,
  collaborator_id,
  edition_id,
  published_at,
  created_at,
  status,
  views,
  reading_time,
  is_featured,
  featured_order,
  audio_male_url,
  audio_female_url,
  audio_male_duration,
  audio_female_duration,
  audio_male_hash,
  audio_female_hash,
  audio_status,
  audio_error,
  audio_updated_at,
  collaborators ( id, name, slug, photo_url, type, section_name, section_slug, social_links ),
  editions (
    id,
    number,
    name,
    is_current,
    is_special
  ),
  article_categories ( categories ( id, name, slug, color ) ),
  article_tags ( id, tag, tag_type )
`;

const getAll = async ({
  page = 1,
  limit = 12,
  status = 'published',
  editionId = 'all',
} = {}) => {
  const normalizedPage =
    Math.max(
      Number.parseInt(
        page,
        10
      ) || 1,
      1
    );

  const normalizedLimit =
    Math.min(
      Math.max(
        Number.parseInt(
          limit,
          10
        ) || 12,
        1
      ),
      100
    );

  const from =
    (
      normalizedPage -
      1
    ) *
    normalizedLimit;

  const to =
    from +
    normalizedLimit -
    1;

  let query = supabase
    .from('articles')
    .select(
      BASE_SELECT,
      {
        count: 'exact',
      }
    );

  if (
    status &&
    status !== 'all'
  ) {
    query = query.eq(
      'status',
      status
    );
  }

  if (
    editionId ===
    'without-edition'
  ) {
    query = query.is(
      'edition_id',
      null
    );
  } else if (
    editionId &&
    editionId !== 'all'
  ) {
    query = query.eq(
      'edition_id',
      editionId
    );
  }

  const {
    data,
    error,
    count,
  } = await query
    .order(
      'published_at',
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    )
    .range(
      from,
      to
    );

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

const getBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('articles')
    .select(
      BASE_SELECT +
      ', content, content_html'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('articles.service.getBySlug error:', error);
    throw error;
  }

  if (!data) {
    throw { status: 404, message: 'Artículo no encontrado' };
  }

  // Incrementar vistas
  await supabase
    .from('articles')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id);

  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('articles')
    .select(EDITOR_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('articles.service.getById error:', error);
    throw error;
  }

  if (!data) {
    throw { status: 404, message: 'Artículo no encontrado' };
  }

  return data;
};
const getByCategory = async (slug, { page = 1, limit = 12 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Primero obtener el id de la categoría
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name, slug, description, cover_image_url')
    .eq('slug', slug)
    .single();

  if (!cat) throw { status: 404, message: 'Categoría no encontrada' };

  // Obtener artículos de esa categoría
  const { data, error, count } = await supabase
    .from('article_categories')
    .select(`
      articles (
        ${BASE_SELECT}
      )
    `, { count: 'exact' })
    .eq('category_id', cat.id)
    .eq('articles.status', 'published')
    .order('articles(published_at)', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const articles = data
    .map(r => r.articles)
    .filter(Boolean);

  return { category: cat, data: articles, total: count, page: Number(page), limit: Number(limit) };
};

const getByCollaborator = async (slug, { page = 1, limit = 12 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: collab } = await supabase
    .from('collaborators')
    .select('id, name, slug, photo_url, bio, type, section_name, social_links')
    .eq('slug', slug)
    .single();

  if (!collab) throw { status: 404, message: 'Colaborador no encontrado' };

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('collaborator_id', collab.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { collaborator: collab, data, total: count, page: Number(page), limit: Number(limit) };
};

const getByEdition = async (number, { page = 1, limit = 50 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('number', number)
    .single();

  if (!edition) throw { status: 404, message: 'Edición no encontrada' };

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('edition_id', edition.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { edition, data, total: count, page: Number(page), limit: Number(limit) };
};

const getFeatured = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select(BASE_SELECT)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
    .limit(6);

  if (error) throw error;
  return data;
};

const getHome = async () => {
  let cached = null;

  try {
    cached =
      getCache(
        CACHE_KEYS.HOME_PAYLOAD
      );
  } catch (error) {
    console.warn(
      'Cache error (get):',
      error
    );
  }

  if (cached) {
    return cached;
  }

  const {
    data: currentEdition,
    error: editionError,
  } = await supabase
    .from('editions')
    .select('*')
    .eq(
      'is_current',
      true
    )
    .maybeSingle();

  if (editionError) {
    throw editionError;
  }

  const currentEditionId =
    currentEdition?.id ||
    null;

  const articleQuery =
    supabase
      .from('articles')
      .select(
        BASE_SELECT
      )
      .eq(
        'status',
        'published'
      );

  const gallerySelect = `
    id,
    title,
    slug,
    subtitle,
    excerpt,
    cover_image_url,
    collaborator_id,
    edition_id,
    status,
    views,
    is_featured,
    featured_order,
    published_at,
    created_at,

    collaborators (
      id,
      name,
      slug,
      photo_url,
      type,
      section_name,
      section_slug,
      social_links
    ),

    editions (
      id,
      number,
      name,
      is_current
    ),

    gallery_photos (
      id
    )
  `;

  const [
    featuredArticlesResult,
    latestArticlesResult,
    featuredGalleriesResult,
    latestGalleriesResult,
    convocatoriaResult,
    collaboratorsResult,
  ] = await Promise.allSettled([
    currentEditionId
      ? supabase
          .from('articles')
          .select(
            BASE_SELECT
          )
          .eq(
            'status',
            'published'
          )
          .eq(
            'edition_id',
            currentEditionId
          )
          .eq(
            'is_featured',
            true
          )
          .order(
            'featured_order',
            {
              ascending: true,
              nullsFirst: false,
            }
          )
          .limit(4)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    currentEditionId
      ? articleQuery
          .eq(
            'edition_id',
            currentEditionId
          )
          .order(
            'published_at',
            {
              ascending: false,
              nullsFirst: false,
            }
          )
          .limit(100)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    currentEditionId
      ? supabase
          .from('galleries')
          .select(
            gallerySelect
          )
          .eq(
            'status',
            'published'
          )
          .eq(
            'edition_id',
            currentEditionId
          )
          .eq(
            'is_featured',
            true
          )
          .order(
            'featured_order',
            {
              ascending: true,
              nullsFirst: false,
            }
          )
          .limit(4)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    currentEditionId
      ? supabase
          .from('galleries')
          .select(
            gallerySelect
          )
          .eq(
            'status',
            'published'
          )
          .eq(
            'edition_id',
            currentEditionId
          )
          .order(
            'published_at',
            {
              ascending: false,
              nullsFirst: false,
            }
          )
          .limit(100)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    supabase
      .from('convocatorias')
      .select('*')
      .eq(
        'is_active',
        true
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle(),

    supabase
      .from('collaborators')
      .select(
        'id, name, slug, photo_url, bio, email, type, section_name, social_links, is_active'
      )
      .eq(
        'is_active',
        true
      )
      .order(
        'name',
        {
          ascending: true,
        }
      )
      .limit(12),
  ]);

  const featuredArticles =
    featuredArticlesResult.status ===
      'fulfilled' &&
    !featuredArticlesResult
      .value
      .error
      ? (
          featuredArticlesResult
            .value
            .data ||
          []
        ).map(
          normalizeArticleContent
        )
      : [];

  const latestArticles =
    latestArticlesResult.status ===
      'fulfilled' &&
    !latestArticlesResult
      .value
      .error
      ? (
          latestArticlesResult
            .value
            .data ||
          []
        ).map(
          normalizeArticleContent
        )
      : [];

  const featuredGalleries =
    featuredGalleriesResult.status ===
      'fulfilled' &&
    !featuredGalleriesResult
      .value
      .error
      ? (
          featuredGalleriesResult
            .value
            .data ||
          []
        ).map(
          normalizeGalleryContent
        )
      : [];

  const latestGalleries =
    latestGalleriesResult.status ===
      'fulfilled' &&
    !latestGalleriesResult
      .value
      .error
      ? (
          latestGalleriesResult
            .value
            .data ||
          []
        ).map(
          normalizeGalleryContent
        )
      : [];

  const editionContents =
    sortContentsByDate([
      ...latestArticles,
      ...latestGalleries,
    ]);

  const featured =
    sortFeaturedContents([
      ...featuredArticles,
      ...featuredGalleries,
    ]).slice(0, 4);

  const mostRead =
    [...editionContents]
      .sort(
        (
          firstContent,
          secondContent
        ) =>
          Number(
            secondContent
              .views ||
            0
          ) -
          Number(
            firstContent
              .views ||
            0
          )
      )
      .slice(0, 5);

  const payload = {
    featured,

    latest:
      editionContents,

    mostRead,

    edition:
      currentEdition,

    convocatoria:
      convocatoriaResult.status ===
        'fulfilled' &&
      !convocatoriaResult
        .value
        .error
        ? convocatoriaResult
            .value
            .data ||
          null
        : null,

    collaborators:
      collaboratorsResult.status ===
        'fulfilled' &&
      !collaboratorsResult
        .value
        .error
        ? collaboratorsResult
            .value
            .data ||
          []
        : [],
  };

  try {
    setCache(
      CACHE_KEYS.HOME_PAYLOAD,
      payload,
      CACHE_TTL.HOME_PAYLOAD
    );
  } catch (error) {
    console.warn(
      'Cache error (set):',
      error
    );
  }

  return payload;
};
const search = async (query, { page = 1, limit = 12 } = {}) => {
  if (!query || query.trim().length < 2) {
    throw { status: 400, message: 'La búsqueda debe tener al menos 2 caracteres' };
  }

  const from = (page - 1) * limit;
  const to   = from + limit - 1;
  const q    = query.trim();

  // Primero buscar IDs de colaboradores que coincidan con el nombre
  const { data: matchingCollabs } = await supabase
    .from('collaborators')
    .select('id')
    .ilike('name', `%${q}%`);

  const collabIds = (matchingCollabs || []).map(c => c.id);

  // Construir filtro: título, extracto, o colaborador que coincida
  let filter = `title.ilike.%${q}%,excerpt.ilike.%${q}%`;
  if (collabIds.length > 0) {
    filter += `,collaborator_id.in.(${collabIds.join(',')})`;
  }

  const { data, error, count } = await supabase
    .from('articles')
    .select(BASE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .or(filter)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, total: count, query, page: Number(page), limit: Number(limit) };
};

const create = async (body) => {
  const {
    title,
    subtitle,
    excerpt,
    content,
    content_html,
    cover_image_url,
    cover_caption,
    cover_caption_format,
    seo_title,
    seo_description,
    social_title,
    social_description,
    social_image_url,
    collaborator_id,
    edition_id,
    is_featured,
    featured_order,
    category_ids = [],
    tags = [],
  } = body;

  await validateArticleCategories(
    category_ids
  );

  await validateEditionHighlight({
    editionId:
      edition_id ||
      null,

    isFeatured:
      Boolean(
        is_featured
      ),

    featuredOrder:
      featured_order,
  });

  const slug =
    slugify(title) +
    '-' +
    Date.now();

  const reading_time =
    content_html
      ? readingTime(
          content_html
        )
      : 1;

  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      title,
      slug,
      subtitle,
      excerpt,
      content,
      content_html,
      cover_image_url,
      cover_caption:
        typeof cover_caption === 'string'
          ? cover_caption.trim() || null
          : null,

      cover_caption_format:
        cover_caption_format &&
        typeof cover_caption_format === 'object'
          ? cover_caption_format
          : {
              fontFamily:
                'var(--font-sans)',
              fontSize: '12px',
              bold: false,
              italic: false,
              underline: false,
              color: '#6b7280',
              align: 'left',
              href: '',
            },

      seo_title:
        typeof seo_title === 'string'
          ? seo_title.trim() || null
          : null,

      seo_description:
        typeof seo_description === 'string'
          ? seo_description.trim() || null
          : null,

      social_title:
        typeof social_title === 'string'
          ? social_title.trim() || null
          : null,

      social_description:
        typeof social_description === 'string'
          ? social_description.trim() || null
          : null,

      social_image_url:
        typeof social_image_url === 'string'
          ? social_image_url.trim() || null
          : null,

      collaborator_id,
      edition_id,
      is_featured: is_featured || false,
      featured_order,
      reading_time,
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  // Insertar categorías
  if (category_ids.length > 0) {
    const catRows = category_ids.map(id => ({
      article_id: article.id,
      category_id: id
    }));
    await supabase.from('article_categories').insert(catRows);
  }

  // Insertar tags
  if (tags.length > 0) {
    const tagRows = tags.map(t => ({
      article_id: article.id,
      tag: t.tag,
      tag_type: t.tag_type || null
    }));
    await supabase.from('article_tags').insert(tagRows);
  }

    invalidateHomeCache();

  return article;
};

const update = async (
  id,
  body
) => {
  const {
    data: currentArticle,
    error: currentArticleError,
  } = await supabase
    .from('articles')
    .select(
      `
        id,
        edition_id,
        is_featured,
        featured_order
      `
    )
    .eq(
      'id',
      id
    )
    .maybeSingle();

  if (currentArticleError) {
    throw currentArticleError;
  }

  if (!currentArticle) {
    throw {
      status: 404,
      message:
        'Artículo no encontrado',
    };
  }

  const {
    category_ids,
    tags,
    content_html,
    ...rest
  } = body;

  const stringFields = [
    'seo_title',
    'seo_description',
    'social_title',
    'social_description',
    'social_image_url',
  ];

  stringFields.forEach(field => {
    if (
      Object.prototype
        .hasOwnProperty.call(
          rest,
          field
        )
    ) {
      rest[field] =
        typeof rest[field] ===
          'string'
          ? rest[field].trim() ||
            null
          : null;
    }
  });

  await validateEditionHighlight({
    editionId:
      Object.prototype
        .hasOwnProperty.call(
          rest,
          'edition_id'
        )
        ? rest.edition_id
        : currentArticle
            .edition_id,

    isFeatured:
      Object.prototype
        .hasOwnProperty.call(
          rest,
          'is_featured'
        )
        ? Boolean(
            rest.is_featured
          )
        : Boolean(
            currentArticle
              .is_featured
          ),

    featuredOrder:
      Object.prototype
        .hasOwnProperty.call(
          rest,
          'featured_order'
        )
        ? rest.featured_order
        : currentArticle
            .featured_order,

    articleId:
      id,
  });

  if (
    category_ids !==
    undefined
  ) {
    await validateArticleCategories(
      category_ids
    );
  }

  if (
    content_html !==
    undefined
  ) {
    rest.content_html =
      content_html;

    rest.reading_time =
      readingTime(
        content_html
      );

    rest.audio_status =
      'outdated';

    rest.audio_error =
      null;
  }

  const {
    data: article,
    error,
  } = await supabase
    .from('articles')
    .update(rest)
    .eq(
      'id',
      id
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (
    category_ids !==
    undefined
  ) {
    const {
      error: categoriesDeleteError,
    } = await supabase
      .from(
        'article_categories'
      )
      .delete()
      .eq(
        'article_id',
        id
      );

    if (
      categoriesDeleteError
    ) {
      throw categoriesDeleteError;
    }

    if (
      category_ids.length >
      0
    ) {
      const catRows =
        category_ids.map(
          categoryId => ({
            article_id: id,
            category_id:
              categoryId,
          })
        );

      const {
        error:
          categoriesInsertError,
      } = await supabase
        .from(
          'article_categories'
        )
        .insert(catRows);

      if (
        categoriesInsertError
      ) {
        throw categoriesInsertError;
      }
    }
  }

  if (
    tags !==
    undefined
  ) {
    const {
      error: tagsDeleteError,
    } = await supabase
      .from('article_tags')
      .delete()
      .eq(
        'article_id',
        id
      );

    if (tagsDeleteError) {
      throw tagsDeleteError;
    }

    if (
      tags.length >
      0
    ) {
      const tagRows =
        tags.map(tag => ({
          article_id: id,

          tag:
            tag.tag ||
            tag,

          tag_type:
            tag.tag_type ||
            null,
        }));

      const {
        error:
          tagsInsertError,
      } = await supabase
        .from('article_tags')
        .insert(tagRows);

      if (tagsInsertError) {
        throw tagsInsertError;
      }
    }
  }

  invalidateHomeCache();

  return article;
};

const publish = async (id) => {
  const { data: article, error } = await supabase
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  // Intentar crosspost a Substack (no falla si no está configurado)
  if (process.env.SUBSTACK_URL && process.env.SUBSTACK_COOKIE) {
    const substackUrl = await publishToSubstack(article);

    if (substackUrl) {
      await supabase
        .from('articles')
        .update({ substack_url: substackUrl })
        .eq('id', id);
    }
  }

    invalidateHomeCache();

  return article;
};

const remove = async (id) => {
  const {
    data: article,
    error: findError,
  } = await supabase
    .from('articles')
    .select('id, title')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (!article) {
    throw {
      status: 404,
      message: 'Artículo no encontrado',
    };
  }

  const {
    error: deleteError,
  } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw deleteError;
  }

  invalidateHomeCache();

  return article;
};
module.exports = {
  getAll,
  getBySlug,
  getById,
  getByCategory,
  getByCollaborator,
  getByEdition,
  getFeatured,
  getHome,
  search,
  create,
  update,
  publish,
  remove
};
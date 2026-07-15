const crypto = require('crypto');

const supabase =
  require('../../config/supabase');

const {
  slugify,
} = require('../../utils/slugify');

const GALLERY_BASE_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  cover_image_url,
  cover_image_key,
  collaborator_id,
  edition_id,
  status,
  views,
  max_photos,
  is_featured,
  featured_order,
  museum_seed,
  museum_layout,
  published_at,
  created_at,
  updated_at,

  collaborators (
    id,
    name,
    slug,
    photo_url,
    bio,
    email,
    type,
    section_name,
    section_slug,
    social_links,
    is_active
  ),

  editions (
    id,
    number,
    name,
    cover_image_url
  ),

  gallery_photos (
    id
  )
`;

const GALLERY_COMPLETE_SELECT = `
  id,
  title,
  slug,
  subtitle,
  excerpt,
  cover_image_url,
  cover_image_key,
  collaborator_id,
  edition_id,
  status,
  views,
  max_photos,
  is_featured,
  featured_order,
  museum_seed,
  museum_layout,
  published_at,
  created_at,
  updated_at,

  collaborators (
    id,
    name,
    slug,
    photo_url,
    bio,
    email,
    phone,
    type,
    section_name,
    section_slug,
    section_description,
    social_links,
    is_active
  ),

  editions (
    id,
    number,
    name,
    description,
    cover_image_url
  ),

  gallery_photos (
    id,
    gallery_id,
    image_url,
    image_key,
    title,
    description,
    photo_author,
    alt_text,
    display_order,
    width,
    height,
    created_at,
    updated_at
  )
`;

const createHttpError = (
  status,
  message
) => {
  const error = new Error(message);

  error.status = status;

  return error;
};

const normalizePositiveInteger = (
  value,
  fallback,
  maximum = Number.MAX_SAFE_INTEGER
) => {
  const parsed =
    Number.parseInt(value, 10);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(
    parsed,
    maximum
  );
};

const normalizeNullableString =
  value => {
    if (
      typeof value !==
      'string'
    ) {
      return null;
    }

    const clean =
      value.trim();

    return clean || null;
  };

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    typeof value ===
    'boolean'
  ) {
    return value;
  }

  if (
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {
    return true;
  }

  if (
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {
    return false;
  }

  return fallback;
};

const normalizePhoto = (
  photo,
  index
) => {
  const imageUrl =
    normalizeNullableString(
      photo?.image_url ||
      photo?.url
    );

  if (!imageUrl) {
    throw createHttpError(
      400,
      `La fotografía ${index + 1} no contiene una URL válida`
    );
  }

  return {
    image_url: imageUrl,

    image_key:
      normalizeNullableString(
        photo?.image_key ||
        photo?.key
      ),

    title:
      normalizeNullableString(
        photo?.title
      ),

    description:
      normalizeNullableString(
        photo?.description
      ),

    photo_author:
      normalizeNullableString(
        photo?.photo_author ||
        photo?.author
      ),

    alt_text:
      normalizeNullableString(
        photo?.alt_text ||
        photo?.alt
      ),

    display_order:
      index,

    width:
      Number.isFinite(
        Number(photo?.width)
      )
        ? Number(photo.width)
        : null,

    height:
      Number.isFinite(
        Number(photo?.height)
      )
        ? Number(photo.height)
        : null,
  };
};

const sortGalleryPhotos =
  gallery => {
    if (!gallery) {
      return gallery;
    }

    const sortedPhotos =
      Array.isArray(
        gallery.gallery_photos
      )
        ? [
            ...gallery.gallery_photos,
          ].sort(
            (a, b) =>
              Number(
                a.display_order || 0
              ) -
              Number(
                b.display_order || 0
              )
          )
        : [];

    return {
      ...gallery,
      gallery_photos:
        sortedPhotos,

      photos_count:
        sortedPhotos.length,
    };
  };

const normalizeGalleryContent =
  gallery => {
    if (!gallery) {
      return gallery;
    }

    const photos =
      Array.isArray(
        gallery.gallery_photos
      )
        ? gallery.gallery_photos
        : [];

    return {
      ...gallery,

      content_type:
        'gallery',

      photos_count:
        photos.length,

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

const attachPhotosCount =
  galleries => {
    return (
      galleries || []
    ).map(
      normalizeGalleryContent
    );
  };

const validateCollaborator =
  async collaboratorId => {
    if (!collaboratorId) {
      throw createHttpError(
        400,
        'Selecciona el autor de la galería'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('collaborators')
      .select(
        'id, name, type, is_active'
      )
      .eq(
        'id',
        collaboratorId
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.is_active === false
    ) {
      throw createHttpError(
        400,
        'El colaborador seleccionado no está disponible'
      );
    }

    return data;
  };

const generateGallerySlug =
  async (
    title,
    currentGalleryId = null
  ) => {
    const base =
      slugify(title) ||
      'galeria';

    let candidate = base;
    let counter = 1;

    while (true) {
      let query = supabase
        .from('galleries')
        .select('id')
        .eq('slug', candidate);

      if (currentGalleryId) {
        query = query.neq(
          'id',
          currentGalleryId
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return candidate;
      }

      counter += 1;

      candidate =
        `${base}-${counter}`;
    }
  };

const buildGalleryPayload =
  async (
    body,
    currentGallery = null
  ) => {
    const title =
      normalizeNullableString(
        body.title
      );

    if (!title) {
      throw createHttpError(
        400,
        'El título de la galería es obligatorio'
      );
    }

    const maxPhotos =
      normalizePositiveInteger(
        body.max_photos,
        currentGallery?.max_photos ||
          30,
        99
      );

    const collaboratorId =
      body.collaborator_id ||
      currentGallery
        ?.collaborator_id ||
      null;

    await validateCollaborator(
      collaboratorId
    );

    const slug =
      await generateGallerySlug(
        title,
        currentGallery?.id || null
      );

    const seed =
      normalizeNullableString(
        body.museum_seed
      ) ||
      currentGallery
        ?.museum_seed ||
      crypto
        .randomBytes(16)
        .toString('hex');

    return {
      title,
      slug,

      subtitle:
        normalizeNullableString(
          body.subtitle
        ),

      excerpt:
        normalizeNullableString(
          body.excerpt
        ),

      cover_image_url:
        normalizeNullableString(
          body.cover_image_url
        ),

      cover_image_key:
        normalizeNullableString(
          body.cover_image_key
        ),

      collaborator_id:
        collaboratorId,

      edition_id:
        body.edition_id ||
        null,

      max_photos:
        maxPhotos,

      is_featured:
        normalizeBoolean(
          body.is_featured,
          currentGallery
            ?.is_featured ||
            false
        ),

      featured_order:
        normalizeBoolean(
          body.is_featured,
          currentGallery
            ?.is_featured ||
            false
        )
          ? Number(
              body.featured_order ||
              0
            )
          : null,

      museum_seed:
        seed,

      museum_layout:
        body.museum_layout &&
        typeof body.museum_layout ===
          'object'
          ? body.museum_layout
          : currentGallery
              ?.museum_layout ||
            {},
    };
  };

const replaceGalleryPhotos =
  async (
    galleryId,
    rawPhotos,
    maximum
  ) => {
    const photos =
      Array.isArray(rawPhotos)
        ? rawPhotos
        : [];

    if (
      photos.length >
      maximum
    ) {
      throw createHttpError(
        400,
        `La galería permite un máximo de ${maximum} fotografías`
      );
    }

    const normalizedPhotos =
      photos.map(
        normalizePhoto
      );

    const {
      error: deleteError,
    } = await supabase
      .from('gallery_photos')
      .delete()
      .eq(
        'gallery_id',
        galleryId
      );

    if (deleteError) {
      throw deleteError;
    }

    if (
      normalizedPhotos.length === 0
    ) {
      return [];
    }

    const rows =
      normalizedPhotos.map(
        photo => ({
          gallery_id:
            galleryId,

          ...photo,
        })
      );

    const {
      data,
      error,
    } = await supabase
      .from('gallery_photos')
      .insert(rows)
      .select('*')
      .order(
        'display_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return data || [];
  };

const getAll = async ({
  page = 1,
  limit = 12,
  status = 'published',
  search = '',
} = {}) => {
  const normalizedPage =
    normalizePositiveInteger(
      page,
      1
    );

  const normalizedLimit =
    normalizePositiveInteger(
      limit,
      12,
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
    .from('galleries')
    .select(
      GALLERY_BASE_SELECT,
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

  const cleanSearch =
    String(
      search || ''
    ).trim();

  if (cleanSearch) {
    query = query.or(
      [
        `title.ilike.%${cleanSearch}%`,
        `subtitle.ilike.%${cleanSearch}%`,
        `excerpt.ilike.%${cleanSearch}%`,
      ].join(',')
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
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    data:
      attachPhotosCount(
        data
      ),

    total:
      count || 0,

    page:
      normalizedPage,

    limit:
      normalizedLimit,
  };
};

const getBySlug = async slug => {
  const {
    data,
    error,
  } = await supabase
    .from('galleries')
    .select(
      GALLERY_COMPLETE_SELECT
    )
    .eq(
      'slug',
      slug
    )
    .eq(
      'status',
      'published'
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(
      404,
      'Galería no encontrada'
    );
  }

  await supabase
    .from('galleries')
    .update({
      views:
        Number(
          data.views || 0
        ) + 1,
    })
    .eq(
      'id',
      data.id
    );

  return sortGalleryPhotos(
    data
  );
};

const getById = async id => {
  const {
    data,
    error,
  } = await supabase
    .from('galleries')
    .select(
      GALLERY_COMPLETE_SELECT
    )
    .eq(
      'id',
      id
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(
      404,
      'Galería no encontrada'
    );
  }

  return sortGalleryPhotos(
    data
  );
};

const create = async body => {
  const payload =
    await buildGalleryPayload(
      body
    );

  const {
    data: gallery,
    error,
  } = await supabase
    .from('galleries')
    .insert({
      ...payload,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  try {
    const photos =
      await replaceGalleryPhotos(
        gallery.id,
        body.photos ||
          body.gallery_photos ||
          [],
        gallery.max_photos
      );

    return {
      ...gallery,
      gallery_photos:
        photos,
      photos_count:
        photos.length,
    };
  } catch (error) {
    await supabase
      .from('galleries')
      .delete()
      .eq(
        'id',
        gallery.id
      );

    throw error;
  }
};

const update = async (
  id,
  body
) => {
  const {
    data: currentGallery,
    error: currentError,
  } = await supabase
    .from('galleries')
    .select('*')
    .eq(
      'id',
      id
    )
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!currentGallery) {
    throw createHttpError(
      404,
      'Galería no encontrada'
    );
  }

  const payload =
    await buildGalleryPayload(
      {
        ...currentGallery,
        ...body,
      },
      currentGallery
    );

  const {
    data: gallery,
    error,
  } = await supabase
    .from('galleries')
    .update(payload)
    .eq(
      'id',
      id
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (
    Object.prototype
      .hasOwnProperty.call(
        body,
        'photos'
      ) ||
    Object.prototype
      .hasOwnProperty.call(
        body,
        'gallery_photos'
      )
  ) {
    await replaceGalleryPhotos(
      id,
      body.photos ||
        body.gallery_photos ||
        [],
      gallery.max_photos
    );
  }

  return getById(id);
};

const publish = async id => {
  const gallery =
    await getById(id);

  if (
    !gallery.collaborator_id
  ) {
    throw createHttpError(
      400,
      'La galería necesita un autor antes de publicarse'
    );
  }

  if (
    !gallery.cover_image_url
  ) {
    throw createHttpError(
      400,
      'La galería necesita una portada antes de publicarse'
    );
  }

  if (
    gallery.gallery_photos.length ===
    0
  ) {
    throw createHttpError(
      400,
      'Agrega al menos una fotografía antes de publicar'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('galleries')
    .update({
      status:
        'published',

      published_at:
        new Date()
          .toISOString(),
    })
    .eq(
      'id',
      id
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const archive = async id => {
  const {
    data,
    error,
  } = await supabase
    .from('galleries')
    .update({
      status:
        'archived',

      is_featured:
        false,

      featured_order:
        null,
    })
    .eq(
      'id',
      id
    )
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(
      404,
      'Galería no encontrada'
    );
  }

  return data;
};

const getByCollaborator =
  async (
    collaboratorSlug,
    {
      page = 1,
      limit = 50,
    } = {}
  ) => {
    const normalizedPage =
      normalizePositiveInteger(
        page,
        1
      );

    const normalizedLimit =
      normalizePositiveInteger(
        limit,
        50,
        100
      );

    const {
      data: collaborator,
      error: collaboratorError,
    } = await supabase
      .from('collaborators')
      .select(
        'id, name, slug'
      )
      .eq(
        'slug',
        collaboratorSlug
      )
      .maybeSingle();

    if (collaboratorError) {
      throw collaboratorError;
    }

    if (!collaborator) {
      throw createHttpError(
        404,
        'Colaborador no encontrado'
      );
    }

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

    const {
      data,
      error,
      count,
    } = await supabase
      .from('galleries')
      .select(
        GALLERY_BASE_SELECT,
        {
          count:
            'exact',
        }
      )
      .eq(
        'collaborator_id',
        collaborator.id
      )
      .eq(
        'status',
        'published'
      )
      .order(
        'published_at',
        {
          ascending:
            false,

          nullsFirst:
            false,
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
      collaborator,

      data:
        attachPhotosCount(
          data
        ),

      total:
        count || 0,

      page:
        normalizedPage,

      limit:
        normalizedLimit,
    };
  };

const getByEdition =
  async (
    editionNumber,
    {
      page = 1,
      limit = 50,
    } = {}
  ) => {
    const normalizedPage =
      normalizePositiveInteger(
        page,
        1
      );

    const normalizedLimit =
      normalizePositiveInteger(
        limit,
        50,
        100
      );

    const {
      data: edition,
      error: editionError,
    } = await supabase
      .from('editions')
      .select(
        'id, number, name'
      )
      .eq(
        'number',
        editionNumber
      )
      .maybeSingle();

    if (editionError) {
      throw editionError;
    }

    if (!edition) {
      throw createHttpError(
        404,
        'Edición no encontrada'
      );
    }

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

    const {
      data,
      error,
      count,
    } = await supabase
      .from('galleries')
      .select(
        GALLERY_BASE_SELECT,
        {
          count:
            'exact',
        }
      )
      .eq(
        'edition_id',
        edition.id
      )
      .eq(
        'status',
        'published'
      )
      .order(
        'published_at',
        {
          ascending:
            false,

          nullsFirst:
            false,
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
      edition,

      data:
        attachPhotosCount(
          data
        ),

      total:
        count || 0,

      page:
        normalizedPage,

      limit:
        normalizedLimit,
    };
  };

const getFeatured =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from('galleries')
      .select(
        GALLERY_BASE_SELECT
      )
      .eq(
        'status',
        'published'
      )
      .eq(
        'is_featured',
        true
      )
      .order(
        'featured_order',
        {
          ascending:
            true,

          nullsFirst:
            false,
        }
      )
      .order(
        'published_at',
        {
          ascending:
            false,

          nullsFirst:
            false,
        }
      )
      .limit(12);

    if (error) {
      throw error;
    }

    return attachPhotosCount(
      data
    );
  };

const search =
  async (
    searchTerm,
    {
      page = 1,
      limit = 20,
    } = {}
  ) => {
    const cleanSearch =
      String(
        searchTerm || ''
      ).trim();

    const normalizedPage =
      normalizePositiveInteger(
        page,
        1
      );

    const normalizedLimit =
      normalizePositiveInteger(
        limit,
        20,
        100
      );

    if (!cleanSearch) {
      return {
        data: [],
        total: 0,
        page:
          normalizedPage,
        limit:
          normalizedLimit,
      };
    }

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

    /*
     * Primero buscamos colaboradores
     * cuyo nombre coincida.
     *
     * Así, al escribir "Kandona",
     * también recuperamos todas sus
     * galerías aunque el título del
     * álbum no contenga "Kandona".
     */
    const {
      data:
        matchingCollaborators,
      error:
        collaboratorsError,
    } = await supabase
      .from('collaborators')
      .select('id')
      .ilike(
        'name',
        `%${cleanSearch}%`
      )
      .eq(
        'is_active',
        true
      )
      .limit(100);

    if (collaboratorsError) {
      throw collaboratorsError;
    }

    const collaboratorIds =
      (
        matchingCollaborators ||
        []
      )
        .map(
          collaborator =>
            collaborator.id
        )
        .filter(Boolean);

    const textFilters = [
      `title.ilike.%${cleanSearch}%`,
      `subtitle.ilike.%${cleanSearch}%`,
      `excerpt.ilike.%${cleanSearch}%`,
    ];

    if (
      collaboratorIds.length >
      0
    ) {
      textFilters.push(
        `collaborator_id.in.(${collaboratorIds.join(',')})`
      );
    }

    const {
      data,
      error,
      count,
    } = await supabase
      .from('galleries')
      .select(
        GALLERY_BASE_SELECT,
        {
          count:
            'exact',
        }
      )
      .eq(
        'status',
        'published'
      )
      .or(
        textFilters.join(',')
      )
      .order(
        'published_at',
        {
          ascending:
            false,

          nullsFirst:
            false,
        }
      )
      .order(
        'created_at',
        {
          ascending:
            false,
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
      data:
        attachPhotosCount(
          data
        ),

      total:
        count || 0,

      page:
        normalizedPage,

      limit:
        normalizedLimit,
    };
  };

const removePermanently =
  async id => {
    const gallery =
      await getById(id);

    const {
      error,
    } = await supabase
      .from('galleries')
      .delete()
      .eq(
        'id',
        id
      );

    if (error) {
      throw error;
    }

    return {
      gallery,

      message:
        'Galería eliminada permanentemente',
    };
  };

module.exports = {
  getAll,
  getBySlug,
  getById,
  getByCollaborator,
  getByEdition,
  getFeatured,
  search,
  create,
  update,
  publish,
  archive,
  removePermanently,
};
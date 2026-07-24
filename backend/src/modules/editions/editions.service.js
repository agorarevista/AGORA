const supabase =
  require('../../config/supabase');

const createHttpError = (
  status,
  message
) => {
  const error =
    new Error(message);

  error.status =
    status;

  return error;
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

    return (
      clean ||
      null
    );
  };

const normalizeBoolean =
  (
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
      value === true ||
      value === 'true' ||
      value === 1 ||
      value === '1'
    ) {
      return true;
    }

    if (
      value === false ||
      value === 'false' ||
      value === 0 ||
      value === '0'
    ) {
      return false;
    }

    return fallback;
  };

const buildEditionPayload =
  body => {
    const name =
      normalizeNullableString(
        body?.name
      );

    const isSpecial =
      normalizeBoolean(
        body?.is_special,
        false
      );

    if (!name) {
      throw createHttpError(
        400,
        'El nombre de la edición es obligatorio'
      );
    }

    let number =
      null;

    if (!isSpecial) {
      number =
        Number.parseInt(
          body?.number,
          10
        );

      if (
        !Number.isInteger(
          number
        ) ||
        number < 1
      ) {
        throw createHttpError(
          400,
          'Las ediciones regulares necesitan un número válido'
        );
      }
    }

    return {
      number:
        isSpecial
          ? null
          : number,

      name,

      description:
        normalizeNullableString(
          body?.description
        ),

      cover_image_url:
        normalizeNullableString(
          body?.cover_image_url
        ),

      published_at:
        body?.published_at ||
        null,

      is_special:
        isSpecial,
    };
  };

const getAll =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from('editions')
      .select('*')
      .order(
        'is_current',
        {
          ascending: false,
        }
      )
      .order(
        'is_special',
        {
          ascending: true,
        }
      )
      .order(
        'number',
        {
          ascending: false,
          nullsFirst: false,
        }
      )
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
      );

    if (error) {
      throw error;
    }

    return (
      data ||
      []
    );
  };

const getCurrent = async () => {
  const { data, error } = await supabase
    .from('editions')
    .select(`
      *,
      articles (
        id, title, slug, cover_image_url, excerpt,
        published_at, is_featured, featured_order, status,
        collaborators ( name, slug, photo_url ),
        article_categories ( categories ( name, slug ) )
      )
    `)
    .eq('is_current', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw { status: 404, message: 'No hay edición actual' };

  return {
    ...data,
    articles: (data.articles || []).filter(article => article.status === 'published'),
  };
};

const getByNumber = async (number) => {
  const { data, error } = await supabase
    .from('editions')
    .select(`
      *,
      articles (
        id, title, slug, cover_image_url, excerpt, published_at, status,
        collaborators ( name, slug, photo_url ),
        article_categories ( categories ( name, slug ) )
      )
    `)
    .eq('number', number)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw { status: 404, message: 'Edición no encontrada' };

  return {
    ...data,
    articles: (data.articles || []).filter(article => article.status === 'published'),
  };
};

const create =
  async body => {
    const payload =
      buildEditionPayload(
        body
      );

    const {
      data,
      error,
    } = await supabase
      .from('editions')
      .insert(
        payload
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

const update =
  async (
    id,
    body
  ) => {
    const {
      data: currentEdition,
      error: currentError,
    } = await supabase
      .from('editions')
      .select('*')
      .eq(
        'id',
        id
      )
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!currentEdition) {
      throw createHttpError(
        404,
        'Edición no encontrada'
      );
    }

    const payload =
      buildEditionPayload({
        ...currentEdition,
        ...body,
      });

    if (
      Object.prototype
        .hasOwnProperty.call(
          body,
          'is_current'
        )
    ) {
      payload.is_current =
        normalizeBoolean(
          body.is_current,
          currentEdition
            .is_current
        );
    }

    const {
      data,
      error,
    } = await supabase
      .from('editions')
      .update(
        payload
      )
      .eq(
        'id',
        id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

const setCurrent = async (id) => {
  // Quitar current de todas
  await supabase
    .from('editions')
    .update({ is_current: false })
    .neq('id', id);

  // Poner current en la seleccionada
  const { data, error } = await supabase
    .from('editions')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = { getAll, getCurrent, getByNumber, create, update, setCurrent };
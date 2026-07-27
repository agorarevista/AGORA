const supabase =
  require('../../config/supabase');

const CONTENT_COLUMNS = {
  article:
    'article_id',

  gallery:
    'gallery_id',
};

const resolveContentColumn =
  contentType => {
    const normalizedType =
      String(
        contentType || ''
      )
        .trim()
        .toLowerCase();

    const column =
      CONTENT_COLUMNS[
        normalizedType
      ];

    if (!column) {
      throw {
        status: 400,

        message:
          'Tipo de contenido no válido',
      };
    }

    return {
      contentType:
        normalizedType,

      column,
    };
  };

const getByContent =
  async ({
    contentType,
    contentId,
  }) => {
    const {
      column,
    } =
      resolveContentColumn(
        contentType
      );

    const {
      data,
      error,
    } = await supabase
      .from('article_comments')
      .select(
        `
          id,
          author_name,
          content,
          created_at,
          parent_id
        `
      )
      .eq(
        column,
        contentId
      )
      .eq(
        'status',
        'approved'
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    const roots =
      rows.filter(
        comment =>
          !comment.parent_id
      );

    const replies =
      rows.filter(
        comment =>
          Boolean(
            comment.parent_id
          )
      );

    return roots.map(
      root => ({
        ...root,

        replies:
          replies.filter(
            reply =>
              reply.parent_id ===
              root.id
          ),
      })
    );
  };

const getAll = async ({
  status,
} = {}) => {
  let query =
    supabase
      .from('article_comments')
      .select(
        `
          *,
          articles (
            title,
            slug
          ),
          galleries (
            title,
            slug
          )
        `
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

  if (status) {
    query =
      query.eq(
        'status',
        status
      );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

const create = async body => {
  const {
    content_type,
    content_id,
    parent_id,
    author_name,
    author_email,
    content,
  } = body;

  if (
    !author_name ||
    !content ||
    content.trim().length <
      2
  ) {
    throw {
      status: 400,

      message:
        'Nombre y comentario son requeridos',
    };
  }

  if (
    content.length >
    1000
  ) {
    throw {
      status: 400,

      message:
        'El comentario no puede superar 1000 caracteres',
    };
  }

  if (!content_id) {
    throw {
      status: 400,

      message:
        'No se recibió el contenido relacionado',
    };
  }

  const {
    column,
  } =
    resolveContentColumn(
      content_type
    );

  const insertPayload = {
    article_id: null,
    gallery_id: null,

    parent_id:
      parent_id ||
      null,

    author_name:
      author_name.trim(),

    author_email:
      typeof author_email ===
        'string'
        ? author_email.trim() ||
          null
        : null,

    content:
      content.trim(),

    status:
      'approved',
  };

  insertPayload[column] =
    content_id;

  const {
    data,
    error,
  } = await supabase
    .from('article_comments')
    .insert(
      insertPayload
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateStatus = async (
  id,
  status
) => {
  const validStatuses = [
    'approved',
    'pending',
    'rejected',
  ];

  if (
    !validStatuses.includes(
      status
    )
  ) {
    throw {
      status: 400,

      message:
        'Estado de comentario no válido',
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from('article_comments')
    .update({
      status,
    })
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

const remove = async id => {
  const {
    error,
  } = await supabase
    .from('article_comments')
    .delete()
    .eq(
      'id',
      id
    );

  if (error) {
    throw error;
  }
};

module.exports = {
  getByContent,
  getAll,
  create,
  updateStatus,
  remove,
};
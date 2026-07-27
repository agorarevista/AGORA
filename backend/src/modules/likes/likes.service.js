const crypto =
  require('crypto');

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

const getFingerprint = req => {
  const visitorId =
    String(
      req.headers[
        'x-visitor-id'
      ] ||
      ''
    ).trim();

  const source =
    visitorId ||
    (
      String(
        req.ip || ''
      ) +
      String(
        req.headers[
          'user-agent'
        ] ||
        ''
      )
    );

  return crypto
    .createHash('sha256')
    .update(source)
    .digest('hex');
};

const countLikes =
  async ({
    column,
    contentId,
  }) => {
    const {
      count,
      error,
    } = await supabase
      .from('article_likes')
      .select(
        '*',
        {
          count: 'exact',
          head: true,
        }
      )
      .eq(
        column,
        contentId
      );

    if (error) {
      throw error;
    }

    return count || 0;
  };

const getLikes =
  async ({
    contentType,
    contentId,
  }) => {
    const {
      contentType:
        normalizedType,

      column,
    } =
      resolveContentColumn(
        contentType
      );

    const likes =
      await countLikes({
        column,
        contentId,
      });

    return {
      content_type:
        normalizedType,

      content_id:
        contentId,

      likes,
    };
  };

const toggleLike =
  async ({
    contentType,
    contentId,
    req,
  }) => {
    const {
      contentType:
        normalizedType,

      column,
    } =
      resolveContentColumn(
        contentType
      );

    const fingerprint =
      getFingerprint(req);

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from('article_likes')
      .select('id')
      .eq(
        column,
        contentId
      )
      .eq(
        'fingerprint',
        fingerprint
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      const {
        error: deleteError,
      } = await supabase
        .from('article_likes')
        .delete()
        .eq(
          'id',
          existing.id
        );

      if (deleteError) {
        throw deleteError;
      }

      const likes =
        await countLikes({
          column,
          contentId,
        });

      return {
        content_type:
          normalizedType,

        content_id:
          contentId,

        liked: false,
        likes,
      };
    }

    const insertPayload = {
      article_id: null,
      gallery_id: null,
      fingerprint,
    };

    insertPayload[column] =
      contentId;

    const {
      error: insertError,
    } = await supabase
      .from('article_likes')
      .insert(
        insertPayload
      );

    if (insertError) {
      throw insertError;
    }

    const likes =
      await countLikes({
        column,
        contentId,
      });

    return {
      content_type:
        normalizedType,

      content_id:
        contentId,

      liked: true,
      likes,
    };
  };

const checkLike =
  async ({
    contentType,
    contentId,
    req,
  }) => {
    const {
      contentType:
        normalizedType,

      column,
    } =
      resolveContentColumn(
        contentType
      );

    const fingerprint =
      getFingerprint(req);

    const {
      data,
      error,
    } = await supabase
      .from('article_likes')
      .select('id')
      .eq(
        column,
        contentId
      )
      .eq(
        'fingerprint',
        fingerprint
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      content_type:
        normalizedType,

      content_id:
        contentId,

      liked:
        Boolean(data),
    };
  };

module.exports = {
  getLikes,
  toggleLike,
  checkLike,
};
const supabase =
  require('../../config/supabase');

const PLATFORMS = [
  'whatsapp',
  'facebook',
  'instagram',
  'copy',
  'twitter',
];

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

const getShares =
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

    const {
      data,
      error,
    } = await supabase
      .from('article_shares')
      .select('platform')
      .eq(
        column,
        contentId
      );

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    const summary =
      PLATFORMS.reduce(
        (
          accumulator,
          platform
        ) => {
          accumulator[
            platform
          ] =
            rows.filter(
              share =>
                share.platform ===
                platform
            ).length;

          return accumulator;
        },
        {}
      );

    return {
      content_type:
        normalizedType,

      content_id:
        contentId,

      shares:
        summary,

      total:
        rows.length,
    };
  };

const registerShare =
  async ({
    contentType,
    contentId,
    platform,
  }) => {
    if (
      !PLATFORMS.includes(
        platform
      )
    ) {
      throw {
        status: 400,

        message:
          'Plataforma no válida',
      };
    }

    const {
      contentType:
        normalizedType,

      column,
    } =
      resolveContentColumn(
        contentType
      );

    const insertPayload = {
      article_id: null,
      gallery_id: null,
      platform,
    };

    insertPayload[column] =
      contentId;

    const {
      error,
    } = await supabase
      .from('article_shares')
      .insert(
        insertPayload
      );

    if (error) {
      throw error;
    }

    const result =
      await getShares({
        contentType:
          normalizedType,

        contentId,
      });

    return {
      ok: true,
      ...result,
    };
  };

module.exports = {
  registerShare,
  getShares,
};
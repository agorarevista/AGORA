const {
  getArticleOgData,
  getGalleryOgData,
} = require('./ogImages.service');

const {
  createOgImage,
} = require('./ogImages.renderer');

const imageCache =
  new Map();

const CACHE_TIME =
  10 * 60 * 1000;

const getCachedImage =
  key => {
    const cached =
      imageCache.get(key);

    if (!cached) {
      return null;
    }

    if (
      Date.now() -
        cached.createdAt >
      CACHE_TIME
    ) {
      imageCache.delete(
        key
      );

      return null;
    }

    return cached.buffer;
  };

const saveCachedImage = (
  key,
  buffer
) => {
  imageCache.set(
    key,
    {
      buffer,

      createdAt:
        Date.now(),
    }
  );
};

const sendImage = (
  res,
  buffer
) => {
    res.set({
      /*
       * El renderer devuelve JPEG,
       * por eso debe enviarse como image/jpeg.
       */
      'Content-Type':
        'image/jpeg',

      'Content-Length':
        String(
          buffer.length
        ),

      'Cache-Control':
        'public, max-age=3600, s-maxage=3600',

      'X-Content-Type-Options':
        'nosniff',
    });

    return res
      .status(200)
      .send(buffer);
  };

const renderArticleImage =
  async (
    req,
    res,
    next
  ) => {
    try {
      const slug =
        req.params.slug;

      const cacheKey =
        `article:${slug}`;

      const cached =
        getCachedImage(
          cacheKey
        );

      if (cached) {
        return sendImage(
          res,
          cached
        );
      }

      const article =
        await getArticleOgData(
          slug
        );

      if (!article) {
        return res
          .status(404)
          .json({
            error:
              'Artículo no encontrado',
          });
      }

      const buffer =
        await createOgImage(
          article
        );

      if (
        !Buffer.isBuffer(
          buffer
        )
      ) {
        throw new Error(
          'createOgImage no devolvió un Buffer válido.'
        );
      }

      saveCachedImage(
        cacheKey,
        buffer
      );

      return sendImage(
        res,
        buffer
      );
    } catch (error) {
      console.error(
        'Error generando imagen Open Graph del artículo:',
        error
      );

      return next(
        error
      );
    }
  };

const renderGalleryImage =
  async (
    req,
    res,
    next
  ) => {
    try {
      const slug =
        req.params.slug;

      const cacheKey =
        `gallery:${slug}`;

      const cached =
        getCachedImage(
          cacheKey
        );

      if (cached) {
        return sendImage(
          res,
          cached
        );
      }

      const gallery =
        await getGalleryOgData(
          slug
        );

      if (!gallery) {
        return res
          .status(404)
          .json({
            error:
              'Galería no encontrada',
          });
      }

      const buffer =
        await createOgImage(
          gallery
        );

      if (
        !Buffer.isBuffer(
          buffer
        )
      ) {
        throw new Error(
          'createOgImage no devolvió un Buffer válido.'
        );
      }

      saveCachedImage(
        cacheKey,
        buffer
      );

      return sendImage(
        res,
        buffer
      );
    } catch (error) {
      console.error(
        'Error generando imagen Open Graph de la galería:',
        error
      );

      return next(
        error
      );
    }
  };

module.exports = {
  renderArticleImage,
  renderGalleryImage,
};
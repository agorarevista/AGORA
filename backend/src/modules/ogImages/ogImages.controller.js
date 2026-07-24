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
      'Content-Type':
        'image/png',

      'Content-Length':
        buffer.length,

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
          article,
          'article'
        );

      saveCachedImage(
        cacheKey,
        buffer
      );

      return sendImage(
        res,
        buffer
      );
    } catch (error) {
      return next(error);
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
          gallery,
          'gallery'
        );

      saveCachedImage(
        cacheKey,
        buffer
      );

      return sendImage(
        res,
        buffer
      );
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  renderArticleImage,
  renderGalleryImage,
};
 const service =
  require('./articleTransfer.service');

const importSubstack =
  async (
    req,
    res,
    next
  ) => {
    try {
      const files =
        Array.isArray(req.files)
          ? req.files
          : [];

      const result =
        await service.importSubstack({
          files,
          body: req.body,
        });

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

const exportArticleHtml =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .exportArticleHtml(
            req.params.id
          );

      res.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`
      );

      return res.send(
        result.content
      );
    } catch (error) {
      return next(error);
    }
  };

const exportWordPress =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .exportWordPress();

      res.setHeader(
        'Content-Type',
        'application/xml; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`
      );

      return res.send(
        result.content
      );
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  importSubstack,
  exportArticleHtml,
  exportWordPress,
};
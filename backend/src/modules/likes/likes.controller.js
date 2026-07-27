const service =
  require('./likes.service');

const getLikes = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.getLikes({
        contentType:
          req.params.content_type,

        contentId:
          req.params.content_id,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const toggleLike = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.toggleLike({
        contentType:
          req.params.content_type,

        contentId:
          req.params.content_id,

        req,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const checkLike = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.checkLike({
        contentType:
          req.params.content_type,

        contentId:
          req.params.content_id,

        req,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLikes,
  toggleLike,
  checkLike,
};
const service =
  require('./shares.service');

const registerShare = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.registerShare({
        contentType:
          req.params.content_type,

        contentId:
          req.params.content_id,

        platform:
          req.body.platform,
      });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getShares = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.getShares({
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

module.exports = {
  registerShare,
  getShares,
};
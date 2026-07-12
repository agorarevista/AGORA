const service = require(
  './articleAudio.service'
);

const generateVoice = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.generateVoice(
        req.params.id,
        req.body.voice
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const generateBoth = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.generateBoth(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const removeVoice = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.removeVoice(
        req.params.id,
        req.params.voice
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateVoice,
  generateBoth,
  removeVoice,
};
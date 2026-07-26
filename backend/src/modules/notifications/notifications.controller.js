const service =
  require(
    './notifications.service'
  );

const getPublicKey =
  async (
    req,
    res,
    next
  ) => {
    try {
      return res.json(
        service.getPublicKey()
      );
    } catch (error) {
      return next(error);
    }
  };

const subscribe =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await service
          .saveSubscription({
            subscription:
              req.body
                ?.subscription,

            preferences:
              req.body
                ?.preferences ||
              {},

            userAgent:
              req.get(
                'user-agent'
              ) ||
              null,
          });

      return res
        .status(201)
        .json({
          subscribed:
            true,

          subscription:
            data,
        });
    } catch (error) {
      return next(error);
    }
  };

const unsubscribe =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .removeSubscription(
            req.body?.endpoint
          );

      return res.json(
        result
      );
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
};
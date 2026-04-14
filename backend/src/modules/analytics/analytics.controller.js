const service = require('./analytics.service');

const trackView = async (req, res, next) => {
  try { res.json(await service.trackView(req, req.body)); }
  catch (err) { next(err); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    res.json(await service.getDashboardStats(days));
  } catch (err) { next(err); }
};

module.exports = { trackView, getDashboardStats };
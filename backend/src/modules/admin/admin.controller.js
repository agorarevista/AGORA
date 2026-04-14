const service = require('./admin.service');

const getDashboard = async (req, res, next) => {
  try { res.json(await service.getDashboard()); }
  catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try { res.json(await service.getUsers()); }
  catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    res.status(201).json(await service.createUser(req.body, req.user.id));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try { res.json(await service.updateUser(req.params.id, req.body)); }
  catch (err) { next(err); }
};

const toggleUser = async (req, res, next) => {
  try { res.json(await service.toggleUser(req.params.id)); }
  catch (err) { next(err); }
};

const getSiteConfig = async (req, res, next) => {
  try { res.json(await service.getSiteConfig()); }
  catch (err) { next(err); }
};

const updateSiteConfig = async (req, res, next) => {
  try { res.json(await service.updateSiteConfig(req.body)); }
  catch (err) { next(err); }
};

module.exports = {
  getDashboard, getUsers, createUser, updateUser,
  toggleUser, getSiteConfig, updateSiteConfig
};
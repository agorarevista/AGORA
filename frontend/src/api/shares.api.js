import api from './axios';

export const registerShare = (article_id, platform) =>
  api.post(`/shares/${article_id}`, { platform }).then(r => r.data);
export const getShares = (article_id) =>
  api.get(`/shares/${article_id}`).then(r => r.data);
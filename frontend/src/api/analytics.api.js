import api from './axios';

export const trackView = (data) => api.post('/analytics/track', data).then(r => r.data);
export const getAnalytics = (days = 30) => api.get('/analytics/dashboard', { params: { days } }).then(r => r.data);
import apiClient from './client.js';

export const analyticsApi = {
  getUserAnalytics: () => apiClient.get('/api/analytics/user').then((r) => r.data),
};

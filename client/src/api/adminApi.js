import apiClient from './client.js';

export const adminApi = {
  getAnalytics: ({ refresh } = {}) => apiClient.get('/api/admin/analytics', { params: refresh ? { refresh: 'true' } : {} }).then((r) => r.data),

  listUsers: (params) => apiClient.get('/api/admin/users', { params }).then((r) => r.data),
  getUserDetail: (id) => apiClient.get(`/api/admin/users/${id}`).then((r) => r.data),
  banUser: (id) => apiClient.patch(`/api/admin/users/${id}/ban`).then((r) => r.data),
  changeUserPlan: (id, plan) => apiClient.patch(`/api/admin/users/${id}/plan`, { plan }).then((r) => r.data),
  deleteUser: (id) => apiClient.delete(`/api/admin/users/${id}`).then((r) => r.data),

  getAiUsage: (params) => apiClient.get('/api/admin/ai-usage', { params }).then((r) => r.data),

  broadcast: (data) => apiClient.post('/api/admin/notifications/broadcast', data).then((r) => r.data),
  getBroadcastHistory: () => apiClient.get('/api/admin/notifications/broadcast/history').then((r) => r.data),

  getFlags: () => apiClient.get('/api/admin/flags').then((r) => r.data),
  setFlag: (key, value) => apiClient.patch(`/api/admin/flags/${key}`, { value }).then((r) => r.data),
};

export const subscriptionsApi = {
  getMy: () => apiClient.get('/api/subscriptions/my').then((r) => r.data),
  createCheckout: (plan) => apiClient.post('/api/subscriptions/create-checkout', { plan }).then((r) => r.data),
  createPortal: () => apiClient.post('/api/subscriptions/portal').then((r) => r.data),
};

import apiClient from './client.js';

export const notificationsApi = {
  list: () => apiClient.get('/api/notifications').then((r) => r.data.notifications),
  unreadCount: () => apiClient.get('/api/notifications/unread-count').then((r) => r.data.count),
  markRead: (id) => apiClient.patch(`/api/notifications/${id}/read`).then((r) => r.data.notification),
  markAllRead: () => apiClient.patch('/api/notifications/read-all'),
};

export const usersApi = {
  getSettings: () => apiClient.get('/api/users/settings').then((r) => r.data.settings),
  updateSettings: (data) => apiClient.patch('/api/users/settings', data).then((r) => r.data.settings),
};

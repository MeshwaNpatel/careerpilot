import apiClient from './client.js';

export const applicationsApi = {
  list: (params) => apiClient.get('/api/applications', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/api/applications', data).then((r) => r.data.application),
  getById: (id) => apiClient.get(`/api/applications/${id}`).then((r) => r.data.application),
  update: (id, data) =>
    apiClient.patch(`/api/applications/${id}`, data).then((r) => r.data.application),
  updateStatus: (id, status) =>
    apiClient.patch(`/api/applications/${id}/status`, { status }).then((r) => r.data.application),
  remove: (id) => apiClient.delete(`/api/applications/${id}`),
  exportCsv: () =>
    apiClient.get('/api/applications/export', { responseType: 'blob' }).then((r) => r.data),
  getActivity: (id) => apiClient.get(`/api/applications/${id}/activity`).then((r) => r.data),
};

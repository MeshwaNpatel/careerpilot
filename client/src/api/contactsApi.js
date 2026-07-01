import apiClient from './client.js';

const base = (appId) => `/api/applications/${appId}/contacts`;

export const contactsApi = {
  listAll: () => apiClient.get('/api/contacts').then((r) => r.data),
  list: (appId) => apiClient.get(base(appId)).then((r) => r.data),
  create: (appId, data) => apiClient.post(base(appId), data).then((r) => r.data),
  update: (appId, id, data) => apiClient.patch(`${base(appId)}/${id}`, data).then((r) => r.data),
  remove: (appId, id) => apiClient.delete(`${base(appId)}/${id}`),
};

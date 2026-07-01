import apiClient from './client.js';

export const jobsApi = {
  search: (params) => apiClient.get('/api/jobs/search', { params }).then((r) => r.data),
  listSaved: () => apiClient.get('/api/jobs/saved').then((r) => r.data),
  save: (job) => apiClient.post('/api/jobs/saved', job).then((r) => r.data),
  unsave: (id) => apiClient.delete(`/api/jobs/saved/${id}`),
  moveToPipeline: (id) => apiClient.post(`/api/jobs/saved/${id}/apply`).then((r) => r.data),
};

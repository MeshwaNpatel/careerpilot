import apiClient from './client.js';

export const resumesApi = {
  list: () => apiClient.get('/api/resumes').then((r) => r.data.resumes),
  upload: (formData) =>
    apiClient
      .post('/api/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.resume),
  update: (id, data) => apiClient.patch(`/api/resumes/${id}`, data).then((r) => r.data.resume),
  remove: (id) => apiClient.delete(`/api/resumes/${id}`),
};

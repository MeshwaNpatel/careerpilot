import apiClient from './client.js';

export const usersApi = {
  getProfile: () => apiClient.get('/api/users/profile').then((r) => r.data.profile),
  updateProfile: (data) => apiClient.patch('/api/users/profile', data).then((r) => r.data.profile),
  changePassword: (data) => apiClient.patch('/api/users/profile/password', data).then((r) => r.data),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post('/api/users/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

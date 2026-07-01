import apiClient from './client.js';

export const register = (data) => apiClient.post('/api/auth/register', data).then((res) => res.data);

export const login = (data) => apiClient.post('/api/auth/login', data).then((res) => res.data);

export const logout = () => apiClient.post('/api/auth/logout').then((res) => res.data);

export const refresh = () => apiClient.post('/api/auth/refresh').then((res) => res.data);

export const getMe = () => apiClient.get('/api/auth/me').then((res) => res.data);

export const googleLoginUrl = () => `${import.meta.env.VITE_API_URL}/api/auth/google`;

export const forgotPassword = (email) => apiClient.post('/api/auth/forgot-password', { email }).then((r) => r.data);
export const resetPassword = (token, password) => apiClient.post('/api/auth/reset-password', { token, password }).then((r) => r.data);

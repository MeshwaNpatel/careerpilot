import apiClient from './client.js';

export const aiApi = {
  getUsage: () => apiClient.get('/api/ai/usage').then((r) => r.data),
  reviewResume: (data) =>
    apiClient.post('/api/ai/review-resume', data).then((r) => r.data),
  generateCoverLetter: (data) =>
    apiClient.post('/api/ai/cover-letter', data).then((r) => r.data),
  generateInterviewPrep: (data) =>
    apiClient.post('/api/ai/interview-prep', data).then((r) => r.data),
};

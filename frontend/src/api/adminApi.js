import axiosClient from './axiosClient';

export const adminApi = {
  getUsers: (role) => axiosClient.get('/api/auth/users/', { params: role ? { role } : {} }),
  createStaffUser: (userData) => axiosClient.post('/api/auth/users/create/', userData),
  toggleUserStatus: (id) => axiosClient.post(`/api/auth/users/${id}/toggle-status/`),
  deleteUser: (id) => axiosClient.delete(`/api/auth/users/${id}/delete/`),
  getActivityLogs: (action) => axiosClient.get('/api/activity-logs/', { params: action ? { action } : {} }),
};


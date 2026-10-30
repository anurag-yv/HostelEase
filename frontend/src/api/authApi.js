import axiosClient from './axiosClient';

export const authApi = {
  getCsrf: () => axiosClient.get('/api/auth/csrf/'),
  login: (credentials) => axiosClient.post('/api/auth/login/', credentials),
  register: (userData) => axiosClient.post('/api/auth/register/', userData),
  logout: () => axiosClient.post('/api/auth/logout/'),
  getCurrentUser: () => axiosClient.get('/api/auth/me/'),
  updateProfile: (profileData) => axiosClient.put('/api/auth/me/', profileData),
  changePassword: (passwordData) => axiosClient.post('/api/auth/change-password/', passwordData),
  getStaffList: () => axiosClient.get('/api/auth/staff-list/'),
};

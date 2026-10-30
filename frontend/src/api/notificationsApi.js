import axiosClient from './axiosClient';

export const notificationsApi = {
  getNotifications: () => axiosClient.get('/api/notifications/'),
  markAsRead: (id) => axiosClient.post(`/api/notifications/${id}/read/`),
  markAllAsRead: () => axiosClient.post('/api/notifications/mark-all-read/'),
  deleteNotification: (id) => axiosClient.delete(`/api/notifications/${id}/`),
  clearAll: () => axiosClient.delete('/api/notifications/clear-all/'),
};

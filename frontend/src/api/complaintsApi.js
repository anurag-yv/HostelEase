import axiosClient from './axiosClient';

export const complaintsApi = {
  getComplaints: (params = {}) => axiosClient.get('/api/complaints/', { params }),
  getComplaintDetail: (id) => axiosClient.get(`/api/complaints/${id}/`),
  createComplaint: (formData) => axiosClient.post('/api/complaints/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  assignStaff: (id, data) => axiosClient.post(`/api/complaints/${id}/assign/`, data),
  updateStatus: (id, data) => axiosClient.post(`/api/complaints/${id}/status/`, data),
  addWorkLog: (id, data) => axiosClient.post(`/api/complaints/${id}/worklogs/`, data),
  submitFeedback: (id, data) => axiosClient.post(`/api/complaints/${id}/feedback/`, data),
  reopenComplaint: (id, data) => axiosClient.post(`/api/complaints/${id}/reopen/`, data),
  rescheduleComplaint: (id, data) => axiosClient.post(`/api/complaints/${id}/reschedule/`, data),
  withdrawComplaint: (id, data) => axiosClient.post(`/api/complaints/${id}/withdraw/`, data),
  updatePreferences: (id, data) => axiosClient.post(`/api/complaints/${id}/preferences/`, data),
  approveVisit: (id) => axiosClient.post(`/api/complaints/${id}/approve-visit/`),
  scheduleVisit: (id, data) => axiosClient.post(`/api/complaints/${id}/schedule-visit/`, data),
  getDashboardStats: () => axiosClient.get('/api/complaints/dashboard-stats/'),
  getExportCSVUrl: () => '/api/complaints/export-csv/',
};

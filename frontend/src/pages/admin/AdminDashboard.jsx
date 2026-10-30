import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BiBarChartAlt2,
  BiDownload,
  BiListCheck,
  BiGroup,
  BiWrench,
  BiStar,
  BiTimeFive,
  BiRefresh
} from 'react-icons/bi';

const PIE_COLORS = ['#3E2723', '#6D4C41', '#A47148', '#D7CCC8', '#F57C00', '#0288D1'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await complaintsApi.getDashboardStats();
      setData(res.data);
      setLastUpdated(new Date());
    } catch {
      // Retain last known metrics on polling failure
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-polling every 8 seconds for live real-time data
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 8000);

    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-chocolate" role="status"></div>
        <p className="small text-muted mt-2">Loading real-time administrator analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const categoryData = data?.category_breakdown || [];
  const priorityData = data?.priority_breakdown || [];
  const workloadData = data?.staff_workload || [];
  const recent = data?.recent_complaints || [];

  return (
    <div>
      {/* Header & Export Action */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 className="fw-bold text-dark mb-0">
              <BiBarChartAlt2 className="text-warning me-1" /> Administrator Analytics & Overview
            </h2>
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 small d-flex align-items-center gap-1">
              <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }} role="status"></span>
              Live Real-Time Data
            </span>
          </div>
          <p className="text-muted small mb-0">
            Real-time hostel maintenance SLA metrics &bull; Last synchronized: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link
            to="/admin/users"
            className="btn btn-outline-chocolate d-flex align-items-center gap-1"
            title="Manage and delete users"
          >
            <BiGroup className="fs-5" /> Manage & Delete Users
          </Link>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            title="Fetch latest database updates"
          >
            <BiRefresh className={refreshing ? 'spinner-border spinner-border-sm p-0' : 'fs-5'} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <a
            href={complaintsApi.getExportCSVUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn btn-chocolate d-flex align-items-center gap-2"
          >
            <BiDownload /> Export Database (CSV)
          </a>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="row g-3 mb-4">
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#3E2723' }}>
            <div className="stat-card-title">Total Tickets</div>
            <div className="stat-card-value">{stats.total_complaints || 0}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#E65100' }}>
            <div className="stat-card-title">Pending</div>
            <div className="stat-card-value">{stats.pending || 0}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#7B1FA2' }}>
            <div className="stat-card-title">In Progress</div>
            <div className="stat-card-value">{(stats.assigned || 0) + (stats.in_progress || 0)}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#2E7D32' }}>
            <div className="stat-card-title">Resolved/Closed</div>
            <div className="stat-card-value">{(stats.resolved || 0) + (stats.closed || 0)}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <Link to="/admin/users" className="text-decoration-none">
            <div className="stat-card hover-lift" style={{ borderLeftColor: '#0288D1' }}>
              <div className="stat-card-title d-flex justify-content-between">
                <span>Residents</span>
                <small className="text-primary text-decoration-underline" style={{ fontSize: '0.65rem' }}>Manage</small>
              </div>
              <div className="stat-card-value">{stats.total_students || 0}</div>
            </div>
          </Link>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#F57C00' }}>
            <div className="stat-card-title">Avg Feedback</div>
            <div className="stat-card-value text-warning">
              {stats.average_rating ? `${stats.average_rating} ★` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts using Recharts */}
      <div className="row g-4 mb-4">
        {/* Category Breakdown (Pie Chart) */}
        <div className="col-lg-6">
          <div className="card he-card h-100">
            <div className="card-header he-card-header">
              <i className="bi bi-pie-chart-fill me-1"></i> Complaints by Category
            </div>
            <div className="card-body" style={{ minHeight: '300px' }}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted">No category data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Priority Breakdown (Bar Chart) */}
        <div className="col-lg-6">
          <div className="card he-card h-100">
            <div className="card-header he-card-header">
              <i className="bi bi-bar-chart-fill me-1"></i> Complaints by Priority Level
            </div>
            <div className="card-body" style={{ minHeight: '300px' }}>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priorityData}>
                    <XAxis dataKey="name" stroke="#6D4C41" />
                    <YAxis allowDecimals={false} stroke="#6D4C41" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#A47148" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted">No priority data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Workload Distribution */}
        <div className="col-12">
          <div className="card he-card">
            <div className="card-header he-card-header">
              <i className="bi bi-person-lines-fill me-1"></i> Staff Maintenance Workload Distribution
            </div>
            <div className="card-body" style={{ minHeight: '260px' }}>
              {workloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workloadData}>
                    <XAxis dataKey="name" stroke="#4E342E" />
                    <YAxis allowDecimals={false} stroke="#4E342E" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active_tasks" name="Active Tasks" fill="#E65100" />
                    <Bar dataKey="completed_tasks" name="Resolved Tasks" fill="#2E7D32" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-4 text-muted">No staff workload data recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="card he-card">
        <div className="card-header he-card-header d-flex justify-content-between align-items-center">
          <span><BiTimeFive className="me-2" /> Recent System Complaints</span>
          <Link to="/admin/complaints" className="btn btn-sm btn-chocolate">Manage All Tickets</Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket</th>
                  <th>Title</th>
                  <th>Student & Room</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.complaint_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{c.title}</div>
                      </td>
                      <td>
                        <div>{c.student_name}</div>
                        <small className="text-muted">{c.hostel_block_snapshot} - Room {c.room_number_snapshot}</small>
                      </td>
                      <td><span className="badge bg-light text-dark border">{c.category_display}</span></td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="small">
                        {c.assigned_staff_name ? (
                          <span className="text-muted">{c.assigned_staff_name}</span>
                        ) : ['RESOLVED', 'CLOSED'].includes(c.status) ? (
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-semibold">Admin resolved it</span>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No complaints logged yet. Real-time tickets will appear here automatically as residents report issues.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

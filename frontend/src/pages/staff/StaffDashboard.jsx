import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { UpdateStatusModal } from '../../components/UpdateStatusModal';
import { WorkLogModal } from '../../components/WorkLogModal';
import {
  BiWrench,
  BiTask,
  BiCheckCircle,
  BiTimeFive,
  BiErrorCircle
} from 'react-icons/bi';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await complaintsApi.getDashboardStats();
      setData(res.data);
    } catch {
      // Retain existing dashboard data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-chocolate" role="status"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTasks = data?.recent_tasks || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <BiWrench className="text-warning me-2" /> Maintenance Staff Workbench
          </h2>
          <p className="text-muted mb-0">Technician: <strong>{user?.full_name}</strong> ({user?.email})</p>
        </div>
        <Link to="/staff/tasks" className="btn btn-chocolate">
          <BiTask className="me-1" /> View All Tasks
        </Link>
      </div>

      {/* Real Statistics Tiles */}
      <div className="row g-3 mb-4">
        <div className="col-md-2 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#0288D1' }}>
            <div className="stat-card-title">Total Assigned</div>
            <div className="stat-card-value">{stats.total_assigned || 0}</div>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#F57C00' }}>
            <div className="stat-card-title">New Tasks</div>
            <div className="stat-card-value">{stats.pending_action || 0}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#7B1FA2' }}>
            <div className="stat-card-title">In Progress</div>
            <div className="stat-card-value">{stats.in_progress || 0}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#2E7D32' }}>
            <div className="stat-card-title">Resolved / Fixed</div>
            <div className="stat-card-value">{(stats.resolved || 0) + (stats.closed || 0)}</div>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#B71C1C' }}>
            <div className="stat-card-title">High / Urgent</div>
            <div className="stat-card-value text-danger">{stats.critical_high || 0}</div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card he-card">
        <div className="card-header he-card-header d-flex justify-content-between align-items-center">
          <span><BiTask className="me-2" /> Current Active Tasks</span>
          <Link to="/staff/tasks" className="btn btn-sm btn-chocolate">Manage All</Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Title & Location</th>
                  <th>Student Contact</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Current Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length > 0 ? (
                  recentTasks.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold">{t.complaint_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{t.title}</div>
                        <small className="text-muted">{t.hostel_block_snapshot} - Room {t.room_number_snapshot}</small>
                      </td>
                      <td>
                        <div className="small fw-semibold">{t.student_name}</div>
                        <small className="text-muted d-block">{t.student_email}</small>
                        <div className="small text-chocolate mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <BiTimeFive className="flex-shrink-0" />
                          <span><strong>Pref:</strong> {t.preferred_slot || 'Standard / Any'}</span>
                        </div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{t.category_display}</span></td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td>
                        <StatusBadge status={t.status} />
                        {['ASSIGNED', 'IN_PROGRESS'].includes(t.status) && (
                          t.visit_approved ? (
                            <span className="badge bg-success-subtle text-success border border-success d-block mt-1" style={{ fontSize: '0.68rem' }}>
                              Visit Approved ✓
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark border d-block mt-1" style={{ fontSize: '0.68rem' }}>
                              Needs Approval
                            </span>
                          )
                        )}
                        {t.estimated_visit_time && (
                          <div className="small text-success fw-semibold mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                            <BiCheckCircle className="text-success flex-shrink-0" /> Notified: "{t.estimated_visit_time}"
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {t.status === 'CLOSED' ? (
                            <span className="badge bg-secondary-subtle text-secondary border py-1 px-2" title="Closed with resident feedback.">
                              🔒 Closed
                            </span>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-chocolate"
                                onClick={() => {
                                  setSelectedComplaint(t);
                                  setShowStatusModal(true);
                                }}
                              >
                                Status
                              </button>
                              <button
                                className="btn btn-sm btn-outline-chocolate"
                                onClick={() => {
                                  setSelectedComplaint(t);
                                  setShowWorkLogModal(true);
                                }}
                              >
                                Log
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No active tasks currently assigned to you.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        complaint={selectedComplaint}
        userRole="STAFF"
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdated={fetchStats}
      />

      {/* Work Log Modal */}
      <WorkLogModal
        complaint={selectedComplaint}
        show={showWorkLogModal}
        onClose={() => setShowWorkLogModal(false)}
        onLogged={fetchStats}
      />
    </div>
  );
};

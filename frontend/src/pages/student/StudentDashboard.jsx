import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  BiPlusCircle,
  BiListCheck,
  BiTimeFive,
  BiCheckCircle,
  BiTrendingUp,
  BiBuilding,
  BiDoorOpen
} from 'react-icons/bi';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintsApi.getDashboardStats()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-chocolate" role="status"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recent_complaints || [];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">Welcome, {user?.full_name}!</h2>
          <p className="text-muted mb-0">
            Resident of <strong className="text-dark">{user?.hostel_block || 'Hostel'}</strong>, Room <strong>{user?.room_number || 'N/A'}</strong>
          </p>
        </div>
        <Link to="/student/raise-complaint" className="btn btn-chocolate d-flex align-items-center gap-2">
          <BiPlusCircle className="fs-5 text-warning" /> Raise New Complaint
        </Link>
      </div>

      {/* Real Statistics Tiles */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#A47148' }}>
            <div className="stat-card-title">Total Raised</div>
            <div className="stat-card-value">{stats.total || 0}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#E65100' }}>
            <div className="stat-card-title">Pending Review</div>
            <div className="stat-card-value">{stats.pending || 0}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#7B1FA2' }}>
            <div className="stat-card-title">In Progress</div>
            <div className="stat-card-value">{(stats.assigned || 0) + (stats.in_progress || 0)}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="stat-card" style={{ borderLeftColor: '#2E7D32' }}>
            <div className="stat-card-title">Resolved / Closed</div>
            <div className="stat-card-value">{(stats.resolved || 0) + (stats.closed || 0)}</div>
          </div>
        </div>
      </div>

      {/* Pending Visit Authorization Action Alerts for Resident */}
      {recent.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && !c.visit_approved).map((pv) => (
        <div key={pv.id} className="alert alert-warning border border-warning shadow-sm mb-4 p-3 rounded">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2 bg-warning rounded text-dark fs-4 d-flex align-items-center justify-content-center">
                <BiDoorOpen />
              </div>
              <div>
                <div className="fw-bold text-dark">
                  Technician Visit Authorization Needed — {pv.complaint_number}
                </div>
                <small className="text-muted d-block mt-0.5">
                  {pv.estimated_visit_time ? (
                    <span>
                      Technician proposed arrival time: <strong className="text-dark bg-white px-2 py-0.5 rounded border border-warning">{pv.estimated_visit_time}</strong>. Please confirm you accept this visit.
                    </span>
                  ) : (
                    <span>
                      Technician assigned to your room. Please review and confirm that you permit room entry.
                    </span>
                  )}
                </small>
              </div>
            </div>
            <Link to={`/student/complaints/${pv.id}`} className="btn btn-sm btn-chocolate fw-bold px-3">
              Review & Accept Visit →
            </Link>
          </div>
        </div>
      ))}

      {/* Recent Complaints */}
      <div className="card he-card">
        <div className="card-header he-card-header d-flex justify-content-between align-items-center">
          <span><BiTimeFive className="me-2" /> Recent Complaints</span>
          <Link to="/student/complaints" className="btn btn-sm btn-chocolate">View All</Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Filed Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.length > 0 ? (
                  recent.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.complaint_number}</td>
                      <td>
                        <Link to={`/student/complaints/${c.id}`} className="text-decoration-none fw-semibold text-dark">
                          {c.title}
                        </Link>
                      </td>
                      <td><span className="badge bg-light text-dark border">{c.category_display}</span></td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td>
                        <StatusBadge status={c.status} />
                        {['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && !c.visit_approved && (
                          <span className="badge bg-warning text-dark border d-block mt-1" style={{ fontSize: '0.68rem' }}>
                            Action Needed
                          </span>
                        )}
                      </td>
                      <td className="small">
                        {c.assigned_staff_name ? (
                          <span className="text-muted">{c.assigned_staff_name}</span>
                        ) : ['RESOLVED', 'CLOSED'].includes(c.status) ? (
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-semibold">
                            Admin resolved it
                          </span>
                        ) : (
                          <span className="text-muted">Awaiting assignment</span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <Link
                          to={`/student/complaints/${c.id}`}
                          className={`btn btn-sm ${['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && !c.visit_approved ? 'btn-success fw-bold text-white shadow-xs' : 'btn-outline-chocolate'}`}
                        >
                          {['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && !c.visit_approved ? 'Accept Visit' : 'Track'}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <p className="mb-2">You haven't filed any complaints yet.</p>
                      <Link to="/student/raise-complaint" className="btn btn-sm btn-chocolate">
                        Raise Your First Complaint
                      </Link>
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

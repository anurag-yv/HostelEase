import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../../api/complaintsApi';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { AssignStaffModal } from '../../components/AssignStaffModal';
import { UpdateStatusModal } from '../../components/UpdateStatusModal';
import {
  BiSearch,
  BiFilter,
  BiDownload,
  BiUserPlus,
  BiCheckCircle,
  BiRefresh
} from 'react-icons/bi';

export const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchComplaints = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await complaintsApi.getComplaints(params);
      setComplaints(res.data.results || res.data || []);
    } catch {
      // Retain existing state on transient network error
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(true);
    const interval = setInterval(() => fetchComplaints(false), 8000);
    const handleFocus = () => fetchComplaints(false);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">Hostel Maintenance Complaints</h2>
          <p className="text-muted mb-0">Live real-time complaint tracking, staff assignment, and status management</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={fetchComplaints}
            title="Refresh Complaints"
          >
            <BiRefresh className="fs-5" /> Refresh
          </button>
          <a
            href={complaintsApi.getExportCSVUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn btn-chocolate d-flex align-items-center gap-1"
          >
            <BiDownload /> Export CSV
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card he-card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-bold">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><BiSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ID, student, room..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-bold">Category</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="ELECTRICITY">Electricity</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="WIFI">Wi-Fi</option>
                <option value="FURNITURE">Furniture</option>
                <option value="CLEANLINESS">Cleanliness</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-bold">Priority</label>
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-md-2">
              <button type="submit" className="btn btn-chocolate w-100">
                <BiFilter /> Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card he-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket</th>
                  <th>Title & Location</th>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="spinner-border text-chocolate" role="status"></div>
                    </td>
                  </tr>
                ) : complaints.length > 0 ? (
                  complaints.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.complaint_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{c.title}</div>
                        <div className="text-muted small">{c.hostel_block_snapshot} - Room {c.room_number_snapshot}</div>
                        {(c.require_warden_presence || c.preferred_worker_gender !== 'ANY' || c.preferred_slot || c.keep_door_open) && (
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {c.preferred_worker_gender !== 'ANY' && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.66rem' }}>
                                Pref: {c.preferred_worker_gender_display}
                              </span>
                            )}
                            {c.require_warden_presence && (
                              <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '0.66rem' }}>
                                Warden Accompaniment
                              </span>
                            )}
                            {c.keep_door_open && (
                              <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.66rem' }}>
                                Open Door
                              </span>
                            )}
                            {c.preferred_slot && (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>
                                🕒 {c.preferred_slot}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="small fw-semibold">{c.student_name}</div>
                        <small className="text-muted">{c.student_email}</small>
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
                          <span className="text-danger">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {c.status === 'CLOSED' ? (
                            <span className="badge bg-secondary-subtle text-secondary border py-1.5 px-2" title="Closed with resident feedback. Status locked.">
                              🔒 Closed & Locked
                            </span>
                          ) : c.status === 'RESOLVED' ? (
                            <button
                              className="btn btn-sm btn-outline-chocolate"
                              title="Update or reopen status"
                              onClick={() => {
                                setSelectedComplaint(c);
                                setShowStatusModal(true);
                              }}
                            >
                              Status
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-chocolate"
                                title={c.assigned_staff_name ? "Reassign to different maintenance technician" : "Assign to maintenance staff"}
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setShowAssignModal(true);
                                }}
                              >
                                <BiUserPlus /> {c.assigned_staff_name ? 'Reassign' : 'Assign'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-chocolate"
                                title="Update status"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setShowStatusModal(true);
                                }}
                              >
                                Status
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No complaints found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      <AssignStaffModal
        complaint={selectedComplaint}
        show={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssigned={fetchComplaints}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        complaint={selectedComplaint}
        userRole="ADMIN"
        show={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdated={fetchComplaints}
      />
    </div>
  );
};

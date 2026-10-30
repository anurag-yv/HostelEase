import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../../api/complaintsApi';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { UpdateStatusModal } from '../../components/UpdateStatusModal';
import { WorkLogModal } from '../../components/WorkLogModal';
import { BiSearch, BiFilter, BiWrench, BiFileBlank, BiTimeFive, BiCheckCircle } from 'react-icons/bi';

export const StaffTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await complaintsApi.getComplaints(params);
      setTasks(res.data.results || res.data || []);
    } catch {
      // Retain existing task list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">Assigned Maintenance Tasks</h2>
          <p className="text-muted mb-0">Manage work progress and resolutions for your assigned complaints</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card he-card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Search Task</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><BiSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ticket ID, room, or issue summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-bold">Status Filter</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Assigned Tasks</option>
                <option value="ASSIGNED">New Assignment (Awaiting Action)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
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

      {/* Tasks Table */}
      <div className="card he-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ticket ID</th>
                  <th>Title & Description</th>
                  <th>Hostel / Room</th>
                  <th>Student Contact</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
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
                ) : tasks.length > 0 ? (
                  tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold">{t.complaint_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{t.title}</div>
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: '280px' }}>
                          {t.description || t.title}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {t.hostel_block_snapshot} - Room {t.room_number_snapshot}
                        </span>
                      </td>
                      <td>
                        <div className="small fw-semibold">{t.student_name}</div>
                        <small className="text-muted d-block">{t.student_email}</small>
                        <div className="small text-chocolate mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <BiTimeFive className="flex-shrink-0" />
                          <span><strong>Pref:</strong> {t.preferred_slot || 'Standard / Any'}</span>
                        </div>
                      </td>
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
                      <td className="small text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {t.status === 'CLOSED' ? (
                            <span className="badge bg-secondary-subtle text-secondary border py-1.5 px-2" title="Closed with resident feedback.">
                              🔒 Closed & Locked
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
                                Update Status
                              </button>
                              <button
                                className="btn btn-sm btn-outline-chocolate"
                                onClick={() => {
                                  setSelectedComplaint(t);
                                  setShowWorkLogModal(true);
                                }}
                              >
                                Add Log
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
                      No maintenance tasks match the selected filter.
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
        onUpdated={fetchTasks}
      />

      {/* Work Log Modal */}
      <WorkLogModal
        complaint={selectedComplaint}
        show={showWorkLogModal}
        onClose={() => setShowWorkLogModal(false)}
        onLogged={fetchTasks}
      />
    </div>
  );
};

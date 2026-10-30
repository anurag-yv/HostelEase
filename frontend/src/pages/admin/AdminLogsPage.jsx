import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { BiHistory, BiFilter, BiCheckCircle } from 'react-icons/bi';

export const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getActivityLogs(actionFilter);
      setLogs(res.data.results || res.data || []);
    } catch {
      // Keep existing log view on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <BiHistory className="text-warning me-2" /> System Activity & Audit Logs
          </h2>
          <p className="text-muted mb-0">Immutable records of user authentications, ticket creations, staff assignments, and status transitions</p>
        </div>
      </div>

      {/* Action Filter */}
      <div className="card he-card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Filter by Action Type</label>
              <select
                className="form-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Audit Actions</option>
                <option value="LOGIN">User Logins</option>
                <option value="REGISTER">Student Registrations</option>
                <option value="COMPLAINT_CREATED">Complaints Raised</option>
                <option value="STAFF_ASSIGNED">Staff Assigned</option>
                <option value="STATUS_CHANGE">Status Changes</option>
                <option value="WORK_LOG_ADDED">Work Logs Posted</option>
                <option value="FEEDBACK_SUBMITTED">Feedback Submitted</option>
                <option value="CSV_EXPORT">CSV Data Exports</option>
              </select>
            </div>
            <div className="col-md-8 text-md-end text-muted small mt-2 mt-md-0">
              Showing the latest 100 historical events recorded in the Django database.
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card he-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Complaint Reference</th>
                  <th>Activity Description</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="spinner-border text-chocolate" role="status"></div>
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <strong>{log.actor_name || 'System'}</strong>
                        {log.actor_role && (
                          <span className="badge bg-light text-dark border ms-2 small">
                            {log.actor_role}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-chocolate text-white">
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.complaint_number ? (
                          <span className="badge bg-secondary">{log.complaint_number}</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="small text-dark">{log.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No activity logs recorded.
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

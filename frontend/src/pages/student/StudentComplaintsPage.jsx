import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { BiSearch, BiPlusCircle, BiFilter } from 'react-icons/bi';

export const StudentComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await complaintsApi.getComplaints(params);
      setComplaints(res.data.results || res.data || []);
    } catch {
      // Retain existing complaints list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Complaints</h2>
          <p className="text-muted mb-0">Track and review all maintenance requests filed by you</p>
        </div>
        <Link to="/student/raise-complaint" className="btn btn-chocolate d-flex align-items-center gap-1">
          <BiPlusCircle className="fs-5 text-warning" /> Raise New Complaint
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="card he-card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-bold">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><BiSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title, ticket ID, description..."
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
                <option value="WIFI">Wi-Fi / Internet</option>
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
              <button type="submit" className="btn btn-chocolate w-100">
                <BiFilter className="me-1" /> Filter
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
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Filed Date</th>
                  <th>Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <div className="spinner-border text-chocolate" role="status"></div>
                    </td>
                  </tr>
                ) : complaints.length > 0 ? (
                  complaints.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.complaint_number}</td>
                      <td>
                        <Link to={`/student/complaints/${c.id}`} className="text-decoration-none fw-semibold text-dark">
                          {c.title}
                        </Link>
                      </td>
                      <td><span className="badge bg-light text-dark border">{c.category_display}</span></td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="small">
                        {c.assigned_staff_name ? (
                          <span className="text-muted">{c.assigned_staff_name}</span>
                        ) : ['RESOLVED', 'CLOSED'].includes(c.status) ? (
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-semibold">
                            Admin resolved it
                          </span>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="small text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        {c.has_feedback ? (
                          <span className="badge bg-success">Submitted</span>
                        ) : ['RESOLVED', 'CLOSED'].includes(c.status) ? (
                          <span className="badge bg-warning text-dark">Pending</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/student/complaints/${c.id}`} className="btn btn-sm btn-chocolate">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      No complaints match the selected criteria.
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

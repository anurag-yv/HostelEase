import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  BiUserPlus,
  BiGroup,
  BiCheckCircle,
  BiXCircle,
  BiCheckShield,
  BiTrash,
  BiErrorCircle,
  BiRefresh
} from 'react-icons/bi';

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // User Deletion Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState('');

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'STAFF',
    gender: 'MALE',
    phone_number: '',
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await adminApi.getUsers(roleFilter);
      setUsers(res.data.results || res.data || []);
    } catch {
      // Retain existing users list
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
    const interval = setInterval(() => fetchUsers(false), 8000);
    const handleFocus = () => fetchUsers(false);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [roleFilter]);

  const handleToggleStatus = async (user) => {
    if (user.role === 'ADMIN') {
      alert('Administrators cannot be disabled. Administrator accounts are protected.');
      return;
    }
    try {
      await adminApi.toggleUserStatus(user.id);
      fetchUsers(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await adminApi.deleteUser(userToDelete.id);
      setSuccessFeedback(res.data?.message || `User ${userToDelete.full_name} and all data permanently deleted.`);
      setUserToDelete(null);
      fetchUsers();
      setTimeout(() => setSuccessFeedback(''), 6000);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to delete user and records.';
      setDeleteError(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.phone_number.trim() && createForm.phone_number.trim().length !== 10) {
      setCreateError('Mobile number must be exactly 10 digits.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.createStaffUser(createForm);
      setShowCreateModal(false);
      setCreateForm({ email: '', full_name: '', password: '', role: 'STAFF', gender: 'MALE', phone_number: '' });
      fetchUsers();
      setSuccessFeedback('User created successfully.');
      setTimeout(() => setSuccessFeedback(''), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.email?.[0] || err.response?.data?.error || 'Creation failed.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <BiGroup className="text-warning me-2" /> User & Role Management
          </h2>
          <p className="text-muted mb-0">Manage registered residents, maintenance technicians, and administrators</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={fetchUsers}
            title="Refresh Users"
          >
            <BiRefresh className="fs-5" /> Refresh
          </button>
          <button className="btn btn-chocolate d-flex align-items-center gap-1" onClick={() => setShowCreateModal(true)}>
            <BiUserPlus className="fs-5" /> Add Staff Member
          </button>
        </div>
      </div>

      {successFeedback && (
        <div className="alert alert-success alert-dismissible fade show py-2 small mb-3" role="alert">
          <BiCheckCircle className="me-1 fs-5" /> {successFeedback}
          <button type="button" className="btn-close py-2" onClick={() => setSuccessFeedback('')}></button>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="mb-4 d-flex gap-2 flex-wrap">
        <button
          className={`btn btn-sm ${roleFilter === '' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setRoleFilter('')}
        >
          All Users ({users.length})
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'STUDENT' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setRoleFilter('STUDENT')}
        >
          Students
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'STAFF' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setRoleFilter('STAFF')}
        >
          Maintenance Staff
        </button>
        <button
          className={`btn btn-sm ${roleFilter === 'ADMIN' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setRoleFilter('ADMIN')}
        >
          Administrators
        </button>
      </div>

      {/* Users Table */}
      <div className="card he-card">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0 w-100" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '30%' }}>User & Contact</th>
                <th style={{ width: '18%' }}>Role & Gender</th>
                <th style={{ width: '18%' }}>Hostel Location</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Joined</th>
                <th style={{ width: '14%' }} className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-chocolate" role="status"></div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="fw-bold text-dark">{u.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{u.email}</div>
                      {u.phone_number && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>📞 {u.phone_number}</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1 align-items-center">
                        <span className={`badge ${u.role === 'ADMIN' ? 'bg-danger' : u.role === 'STAFF' ? 'bg-primary' : 'bg-secondary'}`}>
                          {u.role_display || u.role}
                        </span>
                        <span className="badge bg-light text-dark border">
                          {u.gender_display || u.gender || '-'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{u.hostel_block || '-'}</div>
                      {u.room_number && (
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>Room {u.room_number}</div>
                      )}
                    </td>
                    <td>
                      {u.is_active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Disabled</span>
                      )}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="text-end pe-3">
                      {u.role === 'ADMIN' ? (
                        <span className="badge bg-light text-muted border">
                          {u.id === currentUser.id ? 'Current Admin' : 'Protected'}
                        </span>
                      ) : (
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            className={`btn btn-xs py-1 px-2 ${u.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                            onClick={() => handleToggleStatus(u)}
                            title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                            style={{ fontSize: '0.74rem' }}
                          >
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteError('');
                            }}
                            title="Permanently delete user and all associated data everywhere"
                            style={{ fontSize: '0.74rem' }}
                          >
                            <BiTrash /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-danger">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <BiErrorCircle className="fs-4" /> Permanent User Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body p-4">
                {deleteError && <div className="alert alert-danger py-2 small mb-3">{deleteError}</div>}

                <p className="text-dark mb-2">
                  Are you sure you want to permanently delete user <strong>{userToDelete.full_name}</strong> (<code>{userToDelete.email}</code>)?
                </p>

                <div className="alert alert-warning py-2 small mb-3">
                  <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                    <BiErrorCircle className="text-danger fs-5" /> Data Purged Everywhere:
                  </div>
                  This action will delete this user and completely wipe all their associated data across the entire database:
                  <ul className="mb-0 mt-1 ps-3 text-dark">
                    <li>All submitted complaints, uploaded images, and ticket history (if resident)</li>
                    <li>All repair task assignments and work logs (if maintenance staff)</li>
                    <li>All submitted feedback reviews and star ratings</li>
                    <li>All user notifications and system activity logs</li>
                    <li>All active sessions (user is immediately forced to log out)</li>
                  </ul>
                </div>

                <p className="text-danger small fw-bold mb-0">
                  ⚠️ This action is completely permanent and cannot be undone.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2 fw-bold"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Purging Data Everywhere...
                    </>
                  ) : (
                    <>
                      <BiTrash /> Delete User Everywhere
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header card-chocolate-header">
                <h5 className="modal-title fw-bold">Add Maintenance Staff / Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  {createError && <div className="alert alert-danger py-2 small">{createError}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Chandra (Electrician)"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. staff.ramesh@hostel.edu"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Role <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      required
                    >
                      <option value="STAFF">Maintenance Staff</option>
                      <option value="ADMIN">Hostel Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Gender <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={createForm.gender}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      required
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other / Prefer not to say</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Password <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Contact Phone (10 digits)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={createForm.phone_number}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCreateForm({ ...createForm, phone_number: digits });
                      }}
                    />
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Must be exactly 10 digits.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-chocolate" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

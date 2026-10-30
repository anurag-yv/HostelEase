import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { BiUser, BiLockAlt, BiSave, BiCheckCircle } from 'react-icons/bi';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    hostel_block: user?.hostel_block || '',
    room_number: user?.room_number || '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profileData.phone_number.trim() && profileData.phone_number.trim().length !== 10) {
      setProfileError('Mobile number must be exactly 10 digits.');
      return;
    }
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      await authApi.updateProfile(profileData);
      await refreshUser();
      setProfileSuccess('Profile details updated successfully.');
    } catch (err) {
      setProfileError('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      await authApi.changePassword(passwordData);
      setPasswordSuccess('Password changed successfully.');
      setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.old_password?.[0] || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold text-dark mb-4"><BiUser className="text-warning me-2" />Profile & Account Settings</h3>

      <div className="row g-4">
        {/* Profile Information */}
        <div className="col-lg-6">
          <div className="card he-card h-100">
            <div className="card-header he-card-header">
              <i className="bi bi-person-fill me-1"></i> Personal & Location Details
            </div>
            <div className="card-body p-4">
              {profileSuccess && <div className="alert alert-success py-2 small">{profileSuccess}</div>}
              {profileError && <div className="alert alert-danger py-2 small">{profileError}</div>}

              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Email Address</label>
                  <input type="email" className="form-control bg-light" value={user?.email || ''} disabled />
                  <small className="text-muted">Primary identifier (cannot be changed).</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Assigned Role</label>
                  <input type="text" className="form-control bg-light" value={user?.role_display || user?.role || ''} disabled />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold small">Hostel Block</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.hostel_block}
                      onChange={(e) => setProfileData({ ...profileData, hostel_block: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small">Room Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.room_number}
                      onChange={(e) => setProfileData({ ...profileData, room_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold small">Contact Phone Number (10 digits)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={profileData.phone_number}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileData({ ...profileData, phone_number: digits });
                    }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>Must be exactly 10 digits.</small>
                </div>

                <button type="submit" className="btn btn-chocolate" disabled={savingProfile}>
                  <BiSave className="me-1" /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="col-lg-6">
          <div className="card he-card h-100">
            <div className="card-header he-card-header">
              <i className="bi bi-key-fill me-1"></i> Change Password
            </div>
            <div className="card-body p-4">
              {passwordSuccess && <div className="alert alert-success py-2 small">{passwordSuccess}</div>}
              {passwordError && <div className="alert alert-danger py-2 small">{passwordError}</div>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold small">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirm_new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-caramel" disabled={changingPassword}>
                  <BiLockAlt className="me-1" /> {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

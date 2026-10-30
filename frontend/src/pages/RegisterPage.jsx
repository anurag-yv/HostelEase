import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BiUserPlus,
  BiEnvelope,
  BiLockAlt,
  BiBuilding,
  BiPhone,
  BiHash,
  BiShow,
  BiHide,
  BiUserCheck,
  BiUser,
  BiWrench,
  BiShieldQuarter
} from 'react-icons/bi';

export const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect directly to role dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'STAFF') navigate('/staff/dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, navigate]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    gender: 'MALE',
    role: 'STUDENT',
    password: '',
    confirm_password: '',
    hostel_block: 'Block A',
    room_number: '',
    phone_number: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      let defaultBlock = formData.hostel_block;
      let defaultRoom = formData.room_number;
      if (value === 'STAFF') {
        defaultBlock = 'General';
        defaultRoom = defaultRoom || 'Maintenance Desk';
      } else if (value === 'ADMIN') {
        defaultBlock = 'General';
        defaultRoom = defaultRoom || 'Warden Office';
      } else if (value === 'STUDENT' && defaultBlock === 'General') {
        defaultBlock = 'Block A';
        defaultRoom = '';
      }
      setFormData({
        ...formData,
        role: value,
        hostel_block: defaultBlock,
        room_number: defaultRoom
      });
    } else if (name === 'phone_number') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone_number: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setFieldErrors({ ...fieldErrors, [name]: null });
    setError('');
  };

  const handleRoleSelect = (selectedRole) => {
    handleChange({ target: { name: 'role', value: selectedRole } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validations
    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (formData.role === 'STUDENT' && !formData.room_number.trim()) {
      setError('Room number is required for student residents.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.phone_number.trim() && formData.phone_number.trim().length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        full_name: formData.full_name.trim(),
        room_number: formData.room_number.trim() || 'N/A',
      });

      const userRole = res?.user?.role || formData.role;

      // Directly go to dashboard without intermediate 'now sign in' screen
      if (userRole === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else if (userRole === 'STAFF') {
        navigate('/staff/dashboard', { replace: true });
      } else if (userRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.response?.data) {
        setFieldErrors(err.response.data);
        const firstError = Object.values(err.response.data).flat()[0];
        setError(typeof firstError === 'string' ? firstError : 'Please correct the highlighted errors.');
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-2 auth-page-container">
      <div className="w-100" style={{ maxWidth: '680px' }}>
        <div className="card he-card shadow-sm border">
          <div className="card-header he-card-header text-center py-2 px-3">
            <h5 className="mb-0 fw-bold">Create Your Account</h5>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Register to access the HostelEase complaint & maintenance platform</small>
          </div>
          <div className="card-body p-3">
            {error && <div className="alert alert-danger py-1 px-2 small mb-2" role="alert" style={{ fontSize: '0.78rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* Role Selection Tabs */}
              <div className="mb-2">
                <div className="row g-1">
                  <div className="col-4">
                    <button
                      type="button"
                      className={`btn w-100 py-1 px-1 small fw-bold d-flex align-items-center justify-content-center gap-1 ${
                        formData.role === 'STUDENT' ? 'btn-chocolate' : 'btn-outline-secondary'
                      }`}
                      onClick={() => handleRoleSelect('STUDENT')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <BiUser /> Student
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      className={`btn w-100 py-1 px-1 small fw-bold d-flex align-items-center justify-content-center gap-1 ${
                        formData.role === 'STAFF' ? 'btn-chocolate' : 'btn-outline-secondary'
                      }`}
                      onClick={() => handleRoleSelect('STAFF')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <BiWrench /> Staff
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      className={`btn w-100 py-1 px-1 small fw-bold d-flex align-items-center justify-content-center gap-1 ${
                        formData.role === 'ADMIN' ? 'btn-chocolate' : 'btn-outline-secondary'
                      }`}
                      onClick={() => handleRoleSelect('ADMIN')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <BiShieldQuarter /> Admin
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 1: Full Name, Email & Gender */}
              <div className="row g-2 mb-2">
                <div className="col-md-5">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    className={`form-control form-control-sm ${fieldErrors.full_name ? 'is-invalid' : ''}`}
                    placeholder=""
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.full_name && <div className="invalid-feedback">{fieldErrors.full_name[0]}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted"><BiEnvelope /></span>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                      placeholder=""
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && <div className="text-danger small mt-0.5">{fieldErrors.email[0]}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Gender <span className="text-danger">*</span>
                  </label>
                  <select
                    name="gender"
                    className="form-select form-select-sm"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Block, Room / Desk, Contact Phone */}
              <div className="row g-2 mb-2">
                <div className="col-md-4">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    {formData.role === 'STUDENT' ? 'Hostel Block' : 'Assigned Block'} <span className="text-danger">*</span>
                  </label>
                  <select
                    name="hostel_block"
                    className="form-select form-select-sm"
                    value={formData.hostel_block}
                    onChange={handleChange}
                    required
                  >
                    <option value="Block A">Block A - Boys</option>
                    <option value="Block B">Block B - Boys</option>
                    <option value="Block C">Block C - Girls</option>
                    <option value="Block D">Block D - Girls</option>
                    <option value="General">General / Admin</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    {formData.role === 'STUDENT' ? 'Room Number' : 'Office / Desk'} {formData.role === 'STUDENT' && <span className="text-danger">*</span>}
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted"><BiHash /></span>
                    <input
                      type="text"
                      name="room_number"
                      className={`form-control ${fieldErrors.room_number ? 'is-invalid' : ''}`}
                      placeholder=""
                      value={formData.room_number}
                      onChange={handleChange}
                      required={formData.role === 'STUDENT'}
                    />
                  </div>
                  {fieldErrors.room_number && <div className="invalid-feedback d-block">{fieldErrors.room_number[0]}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Contact Phone (10 digits)
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted"><BiPhone /></span>
                    <input
                      type="tel"
                      name="phone_number"
                      className={`form-control ${fieldErrors.phone_number ? 'is-invalid' : ''}`}
                      placeholder="10-digit number"
                      maxLength={10}
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.phone_number && <div className="text-danger small mt-0.5">{fieldErrors.phone_number[0]}</div>}
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted"><BiLockAlt /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      placeholder=""
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <BiHide /> : <BiShow />}
                    </button>
                  </div>
                  {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password[0]}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted"><BiLockAlt /></span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      className={`form-control ${fieldErrors.confirm_password ? 'is-invalid' : ''}`}
                      placeholder=""
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <BiHide /> : <BiShow />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && <div className="invalid-feedback d-block">{fieldErrors.confirm_password[0]}</div>}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-chocolate w-100 py-2 fw-bold mt-1"
                disabled={submitting}
                style={{ fontSize: '0.88rem' }}
              >
                {submitting ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Registering Account...
                  </span>
                ) : (
                  `Register as ${formData.role === 'ADMIN' ? 'Warden / Admin' : formData.role === 'STAFF' ? 'Maintenance Staff' : 'Student Resident'}`
                )}
              </button>
            </form>

            <div className="text-center mt-2 pt-1.5 border-top">
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Already registered? <Link to="/login" className="text-chocolate fw-bold">Sign In</Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

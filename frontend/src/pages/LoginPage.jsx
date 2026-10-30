import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BiLockAlt,
  BiEnvelope,
  BiBuilding,
  BiShow,
  BiHide,
  BiCheckDouble,
  BiShieldQuarter,
  BiUser,
  BiWrench,
  BiInfoCircle,
  BiErrorCircle
} from 'react-icons/bi';

export const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // If already authenticated, directly navigate to role dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'STAFF') navigate('/staff/dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Role portal state (pre-select if passed from registration)
  const initialRole = location.state?.registeredRole || 'STUDENT';
  const initialEmail = location.state?.registeredEmail || '';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const successMessage = location.state?.message;

  useEffect(() => {
    if (location.state?.registeredRole) {
      setSelectedRole(location.state.registeredRole);
    }
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
  }, [location.state]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setInfoMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(email.trim(), password, selectedRole);
      const loggedUser = data?.user || data;

      if (selectedRole && loggedUser.role !== selectedRole) {
        setError(`Role mismatch: This account is registered as ${loggedUser.role_display || loggedUser.role}, not ${selectedRole === 'STAFF' ? 'Maintenance Staff' : selectedRole === 'ADMIN' ? 'Administrator' : 'Student Resident'}. Please select the ${loggedUser.role_display || loggedUser.role} tab.`);
        return;
      }

      // Directly go to dashboard immediately without delay or intermediate notice
      if (loggedUser.role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else if (loggedUser.role === 'STAFF') {
        navigate('/staff/dashboard', { replace: true });
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      let errMsg = 'Authentication failed. Please verify your email and password.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') {
          errMsg = d;
        } else if (Array.isArray(d) && d.length > 0) {
          errMsg = d[0];
        } else if (d.non_field_errors && d.non_field_errors.length > 0) {
          errMsg = d.non_field_errors[0];
        } else if (d.error) {
          errMsg = d.error;
        } else if (d.detail) {
          errMsg = d.detail;
        } else if (d.email && d.email.length > 0) {
          errMsg = d.email[0];
        } else if (d.password && d.password.length > 0) {
          errMsg = d.password[0];
        }
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getPortalInfo = () => {
    switch (selectedRole) {
      case 'STAFF':
        return {
          title: 'Maintenance Staff Workbench',
          badge: 'Staff Portal',
          icon: <BiWrench className="fs-5 text-warning" />,
          desc: 'Access your assigned tasks, post work logs, and update resolution progress.',
          buttonLabel: 'Sign In to Staff Workbench',
          placeholder: 'technician@hostel.edu',
        };
      case 'ADMIN':
        return {
          title: 'Warden & Administrator Portal',
          badge: 'Admin / Warden Portal',
          icon: <BiShieldQuarter className="fs-5 text-warning" />,
          desc: 'Access hostel maintenance overview, assign technicians, and view SLA reports.',
          buttonLabel: 'Sign In to Warden / Admin Portal',
          placeholder: 'admin@hostel.edu or warden@hostel.edu',
        };
      default:
        return {
          title: 'Resident Student Portal',
          badge: 'Student Portal',
          icon: <BiUser className="fs-5 text-warning" />,
          desc: 'File room complaints, track maintenance updates, and submit feedback ratings.',
          buttonLabel: 'Sign In to Student Portal',
          placeholder: 'student@hostel.edu',
        };
    }
  };

  const portalInfo = getPortalInfo();

  return (
    <div className="container-fluid px-3 py-2 auth-page-container">
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="card he-card shadow-sm border">
          <div className="card-header he-card-header text-center py-2 px-3">
            <h5 className="mb-0 fw-bold">Login</h5>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Sign in to access your HostelEase dashboard</small>
          </div>
          <div className="card-body p-3">
            {/* Role Selection Tabs */}
            <div className="mb-2">
              <div className="row g-1">
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-1 px-1 small fw-bold d-flex flex-column align-items-center gap-0.5 ${
                      selectedRole === 'STUDENT' ? 'btn-chocolate' : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleRoleSelect('STUDENT')}
                  >
                    <BiUser className="fs-6" />
                    <span style={{ fontSize: '0.75rem' }}>Student</span>
                  </button>
                </div>
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-1 px-1 small fw-bold d-flex flex-column align-items-center gap-0.5 ${
                      selectedRole === 'STAFF' ? 'btn-chocolate' : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleRoleSelect('STAFF')}
                  >
                    <BiWrench className="fs-6" />
                    <span style={{ fontSize: '0.75rem' }}>Staff</span>
                  </button>
                </div>
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-1 px-1 small fw-bold d-flex flex-column align-items-center gap-0.5 ${
                      selectedRole === 'ADMIN' ? 'btn-chocolate' : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleRoleSelect('ADMIN')}
                  >
                    <BiShieldQuarter className="fs-6" />
                    <span style={{ fontSize: '0.75rem' }}>Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Role Indicator Card */}
            <div
              className="d-flex align-items-center justify-content-between px-2 py-1 rounded mb-2 border"
              style={{ backgroundColor: 'var(--color-cream)', borderLeft: '3px solid var(--color-caramel)' }}
            >
              <div className="d-flex align-items-center gap-1.5 text-truncate me-2">
                {portalInfo.icon}
                <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.75rem' }}>{portalInfo.title}</span>
              </div>
              <span className="badge bg-chocolate text-white flex-shrink-0" style={{ fontSize: '0.62rem' }}>
                {portalInfo.badge}
              </span>
            </div>

            {successMessage && (
              <div className="alert alert-success py-1 px-2 small mb-2" role="alert" style={{ fontSize: '0.78rem' }}>
                {successMessage}
              </div>
            )}

            {infoMessage && (
              <div className="alert alert-info py-1 px-2 small mb-2 d-flex align-items-center gap-1.5" role="alert" style={{ fontSize: '0.78rem' }}>
                <BiInfoCircle className="fs-6 flex-shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-1 px-2 small mb-2 d-flex align-items-start gap-1.5" role="alert" style={{ fontSize: '0.78rem' }}>
                <BiErrorCircle className="fs-6 flex-shrink-0 text-danger mt-0.5" />
                <div>
                  <div className="fw-semibold">{error}</div>
                  {error.toLowerCase().includes('account not found') && (
                    <div className="mt-0.5">
                      <Link to="/register" className="fw-bold text-danger text-decoration-underline">
                        Create an account now &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label fw-bold small text-dark mb-1" style={{ fontSize: '0.75rem' }} htmlFor="emailInput">
                  {selectedRole === 'STUDENT'
                    ? 'Student Email'
                    : selectedRole === 'STAFF'
                    ? 'Staff Email'
                    : 'Administrator Email'}{' '}
                  <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">
                    <BiEnvelope />
                  </span>
                  <input
                    id="emailInput"
                    type="email"
                    className="form-control"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold small text-dark mb-1" style={{ fontSize: '0.75rem' }} htmlFor="passwordInput">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">
                    <BiLockAlt />
                  </span>
                  <input
                    id="passwordInput"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
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
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="form-check">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="form-check-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label text-muted" style={{ fontSize: '0.75rem' }} htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-chocolate w-100 py-1.5 fw-bold"
                disabled={submitting}
                style={{ fontSize: '0.85rem' }}
              >
                {submitting ? (
                  <span className="d-flex align-items-center justify-content-center gap-1.5">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Authenticating...
                  </span>
                ) : (
                  portalInfo.buttonLabel
                )}
              </button>
            </form>

            <div className="text-center mt-2 pt-1.5 border-top">
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                Don't have an account yet?{' '}
                <Link to="/register" className="text-chocolate fw-bold">
                  Register New Account
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

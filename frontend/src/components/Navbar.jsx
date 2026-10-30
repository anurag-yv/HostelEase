import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AccessibilityWidget } from './AccessibilityWidget';
import {
  BiBuilding,
  BiBell,
  BiUserCircle,
  BiLogOut,
  BiMenu,
  BiX,
  BiCheckDouble
} from 'react-icons/bi';

export const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    if (item.complaint) {
      if (user?.role === 'STUDENT') {
        navigate(`/student/complaints/${item.complaint}`);
      } else if (user?.role === 'STAFF') {
        navigate('/staff/tasks');
      } else {
        navigate('/admin/complaints');
      }
    } else {
      navigate('/notifications');
    }
  };

  const roleDisplay = () => {
    if (!user) return '';
    if (user.role === 'ADMIN') return 'Warden / Admin';
    if (user.role === 'STAFF') return 'Maintenance Staff';
    return 'Resident Student';
  };

  return (
    <nav className="navbar navbar-expand he-navbar sticky-top px-3">
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center gap-2">
          {/* Mobile hamburger menu button */}
          {user && (
            <button
              className="btn btn-sm text-white d-lg-none p-1 me-1 border-0"
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation drawer"
            >
              {isSidebarOpen ? <BiX className="fs-3" /> : <BiMenu className="fs-3" />}
            </button>
          )}

          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <BiBuilding className="text-warning fs-3" />
            <span className="hostelease-brand-text">HostelEase</span>
          </Link>
        </div>

        <div className="d-flex align-items-center ms-auto gap-2 gap-sm-3">
          {/* Global Accessibility Controls */}
          <AccessibilityWidget />

          {user ? (
            <>
              {/* Notification Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-link position-relative text-white fs-5 p-1 border-0 shadow-none"
                  type="button"
                  id="notificationsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Notifications"
                >
                  <BiBell />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '0.65rem' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <div
                  className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-0 overflow-hidden"
                  aria-labelledby="notificationsDropdown"
                  style={{ width: '330px', maxWidth: '90vw' }}
                >
                  <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
                    <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '0.65rem' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        className="btn btn-link p-0 text-decoration-none small text-chocolate d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                      >
                        <BiCheckDouble /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`list-group-item list-group-item-action p-2 cursor-pointer ${
                            !n.is_read ? 'bg-light border-start border-3 border-warning' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className="fw-bold small text-dark text-truncate me-1" style={{ maxWidth: '210px' }}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="badge bg-warning text-dark" style={{ fontSize: '0.6rem' }}>
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="small text-muted mb-1 text-truncate" style={{ fontSize: '0.78rem' }}>
                            {n.message}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted" style={{ fontSize: '0.68rem' }}>
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </small>
                            {n.complaint_number && (
                              <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                                {n.complaint_number}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted small">
                        No notifications found.
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-top text-center bg-light">
                    <Link to="/notifications" className="text-decoration-none small fw-bold text-chocolate d-block">
                      View All Notifications
                    </Link>
                  </div>
                </div>
              </div>

              {/* User Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-sm text-white dropdown-toggle d-flex align-items-center gap-2 bg-transparent border-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <BiUserCircle className="fs-4 text-warning" />
                  <div className="text-start d-none d-sm-block">
                    <div className="fw-bold small lh-1">{user.full_name}</div>
                    <span className="nav-user-badge mt-1 d-inline-block">
                      {roleDisplay()}
                    </span>
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                  <li className="px-3 py-2 border-bottom">
                    <div className="fw-bold small">{user.full_name}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>{user.email}</div>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 small" to="/profile">
                      <BiUserCircle className="me-2 text-primary" /> Profile & Settings
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button className="dropdown-item py-2 text-danger small" onClick={handleLogout}>
                      <BiLogOut className="me-2" /> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="d-flex gap-2">
              {location.pathname !== '/login' && (
                <Link to="/login" className="btn btn-sm btn-outline-light">Sign In</Link>
              )}
              {location.pathname !== '/register' && (
                <Link to="/register" className="btn btn-sm btn-chocolate">Register</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

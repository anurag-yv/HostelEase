import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  BiTachometer,
  BiPlusCircle,
  BiListCheck,
  BiBell,
  BiUser,
  BiTask,
  BiGroup,
  BiHistory,
  BiX
} from 'react-icons/bi';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  if (!user) return null;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop d-lg-none" onClick={onClose} />}

      <aside className={`he-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-3 px-2">
          <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>
            {user.role === 'STUDENT' ? 'Student Portal' : user.role === 'STAFF' ? 'Staff Portal' : 'Administrator Portal'}
          </small>
          {/* Mobile close button */}
          <button className="btn btn-sm btn-link text-muted d-lg-none p-0" onClick={onClose}>
            <BiX className="fs-4" />
          </button>
        </div>

        <nav className="flex-grow-1">
          {/* STUDENT NAVIGATION */}
          {user.role === 'STUDENT' && (
            <>
              <NavLink
                to="/student/dashboard"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiTachometer className="fs-5" /> Dashboard
              </NavLink>
              <NavLink
                to="/student/raise-complaint"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiPlusCircle className="fs-5 text-warning" /> Raise Complaint
              </NavLink>
              <NavLink
                to="/student/complaints"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiListCheck className="fs-5" /> My Complaints
              </NavLink>
            </>
          )}

          {/* STAFF NAVIGATION */}
          {user.role === 'STAFF' && (
            <>
              <NavLink
                to="/staff/dashboard"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiTachometer className="fs-5" /> Dashboard
              </NavLink>
              <NavLink
                to="/staff/tasks"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiTask className="fs-5 text-warning" /> Assigned Tasks
              </NavLink>
            </>
          )}

          {/* ADMIN NAVIGATION */}
          {user.role === 'ADMIN' && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiTachometer className="fs-5" /> Overview & Analytics
              </NavLink>
              <NavLink
                to="/admin/complaints"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiListCheck className="fs-5" /> All Complaints
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiGroup className="fs-5" /> Users & Staff
              </NavLink>
              <NavLink
                to="/admin/logs"
                className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <BiHistory className="fs-5" /> Activity Logs
              </NavLink>
            </>
          )}

          <hr className="my-3" style={{ borderColor: 'var(--color-border)' }} />

          {/* COMMON NAVIGATION */}
          <NavLink
            to="/notifications"
            className={({ isActive }) => `he-sidebar-item d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="d-flex align-items-center gap-2">
              <BiBell className="fs-5" /> Notifications
            </span>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `he-sidebar-item ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <BiUser className="fs-5" /> Profile & Settings
          </NavLink>
        </nav>

        {/* Clean resident / account badge */}
        <div className="p-3 bg-light rounded mt-auto border small">
          <div className="fw-bold text-chocolate text-truncate">{user.full_name}</div>
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
            {user.hostel_block ? `${user.hostel_block}` : 'Hostel Staff'}
            {user.room_number ? ` • Room ${user.room_number}` : ''}
          </div>
        </div>
      </aside>
    </>
  );
};

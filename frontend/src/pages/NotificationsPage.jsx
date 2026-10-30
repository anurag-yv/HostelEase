import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  BiBell,
  BiCheckDouble,
  BiCheck,
  BiTrash,
  BiRefresh,
  BiRightArrowAlt
} from 'react-icons/bi';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.complaint) {
      if (user?.role === 'STUDENT') {
        navigate(`/student/complaints/${n.complaint}`);
      } else if (user?.role === 'STAFF') {
        navigate('/staff/tasks');
      } else {
        navigate('/admin/complaints');
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all your notifications?')) {
      clearAllNotifications();
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.is_read;
    if (activeTab === 'READ') return n.is_read;
    return true;
  });

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BiBell className="text-warning" />
            <span>Notifications Center</span>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill fs-6">
                {unreadCount} unread
              </span>
            )}
          </h3>
          <p className="text-muted mb-0">
            Real-time updates on your maintenance tickets, staff assignments, and resolutions
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => fetchNotifications(true)}
            title="Refresh notifications"
          >
            <BiRefresh className="fs-5" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-chocolate d-flex align-items-center gap-1" onClick={markAllAsRead}>
              <BiCheckDouble /> Mark All as Read ({unreadCount})
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleClearAll}>
              <BiTrash /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('ALL')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'UNREAD' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('UNREAD')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'READ' ? 'btn-chocolate' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('READ')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card he-card">
        <div className="card-body p-0">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-chocolate" role="status"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="list-group list-group-flush">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-3 d-flex justify-content-between align-items-center flex-wrap gap-2 transition-all ${
                    !n.is_read ? 'bg-light border-start border-4 border-warning' : ''
                  }`}
                >
                  <div
                    className="flex-grow-1"
                    style={{ cursor: n.complaint ? 'pointer' : 'default', minWidth: '240px' }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-bold text-dark">{n.title}</span>
                      {!n.is_read && (
                        <span className="badge bg-warning text-dark small" style={{ fontSize: '0.65rem' }}>
                          NEW
                        </span>
                      )}
                      {n.complaint_number && (
                        <span className="badge bg-secondary small">{n.complaint_number}</span>
                      )}
                    </div>
                    <p className="mb-1 text-secondary small">{n.message}</p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(n.timestamp).toLocaleString()}
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {n.complaint && (
                      <button
                        className="btn btn-sm btn-outline-chocolate d-flex align-items-center gap-1"
                        onClick={() => handleNotificationClick(n)}
                      >
                        View Ticket <BiRightArrowAlt />
                      </button>
                    )}
                    {!n.is_read && (
                      <button
                        className="btn btn-sm btn-outline-secondary text-nowrap"
                        onClick={() => markAsRead(n.id)}
                        title="Mark as read"
                      >
                        <BiCheck /> Read
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger p-1"
                      onClick={() => deleteNotification(n.id)}
                      title="Dismiss notification"
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <BiBell className="fs-1 d-block mb-2 text-secondary opacity-50" />
              <p className="mb-0 fw-semibold">
                {activeTab === 'UNREAD' ? 'You have no unread notifications.' : 'No notifications found.'}
              </p>
              <small className="text-muted">You will be notified here whenever there is an update on your hostel requests.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

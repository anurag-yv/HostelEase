import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notificationsApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoader) setLoading(true);

    try {
      const res = await notificationsApi.getNotifications();
      const list = res.data.notifications || [];
      const count = typeof res.data.unread_count === 'number'
        ? res.data.unread_count
        : list.filter(n => !n.is_read).count;

      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Notification polling fallback
    } finally {
      isFetchingRef.current = false;
      if (showLoader) setLoading(false);
    }
  }, [user]);

  // Initial fetch and polling when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      const interval = setInterval(() => {
        fetchNotifications(false);
      }, 20000);

      const handleFocus = () => fetchNotifications(false);
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    // Optimistically update local state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await notificationsApi.markAsRead(id);
      if (res.data && typeof res.data.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      fetchNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    // Optimistically update all to read immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead();
    } catch {
      fetchNotifications(false);
    }
  };

  const deleteNotification = async (id) => {
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.is_read;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await notificationsApi.deleteNotification(id);
      if (res.data && typeof res.data.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      fetchNotifications(false);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await notificationsApi.clearAll();
    } catch {
      fetchNotifications(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

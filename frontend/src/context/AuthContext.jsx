import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      // Ensure CSRF cookie is set
      await authApi.getCsrf();
      const res = await authApi.getCurrentUser();
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password, role) => {
    await authApi.getCsrf();
    const payload = { email, password };
    if (role) payload.role = role;
    const res = await authApi.login(payload);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear client state even if network call fails
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  };

  const register = async (userData) => {
    await authApi.getCsrf();
    const res = await authApi.register(userData);
    if (res.data?.user) {
      setUser(res.data.user);
    } else {
      await refreshUser();
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

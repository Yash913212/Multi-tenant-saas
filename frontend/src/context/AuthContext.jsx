import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { registerUnauthorizedHandler, setAuthToken } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [expiresAt, setExpiresAt] = useState(() => {
    const raw = localStorage.getItem('expiresAt');
    return raw ? Number(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const isExpired = useMemo(() => (expiresAt ? Date.now() > expiresAt : false), [expiresAt]);

  const persistSession = (jwt, userData, expiration) => {
    setToken(jwt);
    setUser(userData || null);
    setExpiresAt(expiration || null);
    if (jwt) localStorage.setItem('token', jwt);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
    if (expiration) localStorage.setItem('expiresAt', String(expiration));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
  };

  const logout = async(silent = false) => {
    try {
      if (token && !silent) await api.post('/auth/logout');
    } catch (_err) {
      // ignore logout errors
    } finally {
      clearSession();
    }
  };

  const refreshUser = async() => {
    if (!token || isExpired) return logout(true);
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
    } catch (err) {
      await logout(true);
      throw err;
    }
  };

  const login = (jwt, userData, expiresInSeconds) => {
    const expiration = expiresInSeconds ? Date.now() + Number(expiresInSeconds) * 1000 : null;
    persistSession(jwt, userData, expiration);
    setAuthToken(jwt);
  };

  useEffect(() => {
    registerUnauthorizedHandler(() => logout(true));
  }, []);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    const initialize = async() => {
      if (token && !isExpired) {
        try {
          await refreshUser();
        } catch {
          // refreshUser handles logout on failure
        }
      } else if (token && isExpired) {
        await logout(true);
      }
      setLoading(false);
    };
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isExpired && token) {
      logout(true);
    }
  }, [isExpired, token]);

  const value = useMemo(() => ({
    token,
    user,
    expiresAt,
    isExpired,
    loading,
    login,
    logout,
    refreshUser
  }), [token, user, expiresAt, isExpired, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

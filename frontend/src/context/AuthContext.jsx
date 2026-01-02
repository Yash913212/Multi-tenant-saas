import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { registerUnauthorizedHandler, setAuthToken } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getStored = (key) => {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return fromLocal;
    const fromSession = sessionStorage.getItem(key);
    return fromSession || null;
  };

  const [token, setToken] = useState(() => getStored('token'));
  const [user, setUser] = useState(() => {
    const raw = getStored('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [expiresAt, setExpiresAt] = useState(() => {
    const raw = getStored('expiresAt');
    return raw ? Number(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const isExpired = useMemo(() => (expiresAt ? Date.now() > expiresAt : false), [expiresAt]);

  const persistSession = (jwt, userData, expiration, { remember } = { remember: true }) => {
    setToken(jwt);
    setUser(userData || null);
    setExpiresAt(expiration || null);
    const storage = remember ? localStorage : sessionStorage;
    if (jwt) storage.setItem('token', jwt);
    if (userData) storage.setItem('user', JSON.stringify(userData));
    if (expiration) storage.setItem('expiresAt', String(expiration));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('expiresAt');
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
      const storage = getStored('token') === localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(data.data));
    } catch (err) {
      await logout(true);
      throw err;
    }
  };

  const login = (jwt, userData, expiresInSeconds, { remember = true } = {}) => {
    const expiration = expiresInSeconds ? Date.now() + Number(expiresInSeconds) * 1000 : null;
    persistSession(jwt, userData, expiration, { remember });
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

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  // Decode JWT exp and schedule a silent refresh 60s before expiry.
  // Prevents the "401 then retry" pattern that pollutes the console.
  const scheduleRefresh = useCallback((token) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      const delay = exp * 1000 - Date.now() - 60_000;
      if (delay > 0) {
        timerRef.current = setTimeout(async () => {
          try {
            const data = await authApi.refresh();
            setAccessToken(data.accessToken);
            setUser(data.user);
            scheduleRefresh(data.accessToken);
          } catch {
            setAccessToken(null);
            setUser(null);
          }
        }, delay);
      }
    } catch {
      // ignore malformed token
    }
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // On first load, try to silently obtain a new access token using the
  // httpOnly refresh-token cookie (if any) to restore the session.
  useEffect(() => {
    (async () => {
      try {
        const data = await authApi.refresh();
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [scheduleRefresh]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
    scheduleRefresh(data.accessToken);
    return data.user;
  }, [scheduleRefresh]);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    scheduleRefresh(data.accessToken);
    return data.user;
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Used by the OAuth callback page after Google redirects back with a token.
  const setSessionFromToken = useCallback(async (accessToken) => {
    setAccessToken(accessToken);
    const data = await authApi.getMe();
    setUser(data.user);
    scheduleRefresh(accessToken);
    return data.user;
  }, [scheduleRefresh]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    setSessionFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

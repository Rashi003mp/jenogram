// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_BASE = 'https://localhost:7255/api/Auth'; // adjust if needed
const AuthContext = createContext();

const decodeBase64Url = (str) => {
  // base64url -> base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // pad with '='
  while (str.length % 4) str += '=';
  try {
    return atob(str);
  } catch (e) {
    return null;
  }
};

const parseJwt = (token) => {
  // returns payload object or null
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = decodeBase64Url(parts[1]);
    if (!payload) return null;
    return JSON.parse(payload);
  } catch (err) {
    console.error('Failed to parse JWT', err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { id, email, role, ... }
  const [isLoading, setIsLoading] = useState(true);

  // load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth'); // { token, user }
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token ?? null);
        setUser(parsed.user ?? null);
      }
    } catch (err) {
      console.warn('Failed to parse auth from localStorage. Clearing.', err);
      localStorage.removeItem('auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistAuth = (tokenVal, userVal) => {
    setToken(tokenVal ?? null);
    setUser(userVal ?? null);
    if (tokenVal || userVal) {
      localStorage.setItem('auth', JSON.stringify({ token: tokenVal, user: userVal }));
    } else {
      localStorage.removeItem('auth');
    }
  };

  // Register: backend returns only a message/status (no token)
  // Example backend response from your AuthService: AuthResponseDto(201, "User registered successfully")
  // We'll return the parsed response to the caller so UI can show messages.
  const register = async (registerData) => {
    try {
      const res = await fetch(`${AUTH_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend returns status and message - relay it
        return { success: false, status: res.status, error: data.message ?? data.Message ?? 'Registration failed' };
      }

      // Successful registration — backend doesn't return token per your service,
      // so we don't auto-login. The UI should direct user to login page or call login automatically.
      return { success: true, status: res.status, message: data.message ?? 'Registered successfully' };
    } catch (err) {
      console.error('Register failed', err);
      return { success: false, error: 'Server error. Please try again later.' };
    }
  };

  // Login: expect token in response. AuthService returns token as third constructor arg.
  // Example returned JSON (possible shapes): { token: "..."} or { Token: "..." } or { accessToken: "..." }
  const login = async (email, password) => {
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend includes message
        return { success: false, status: res.status, error: data.message ?? data.Message ?? 'Invalid credentials' };
      }

      // find token in common places
      const tokenVal = data.token ?? data.Token ?? data.accessToken ?? data.access_token ?? null;

      if (!tokenVal) {
        // If backend returned something else, bubble it up
        return { success: false, error: 'Login succeeded but no token returned from server.' };
      }

      // decode token payload to extract user info from claims
      const payload = parseJwt(tokenVal);
      // Your backend sets claims: NameIdentifier (user id), Email, Role
      const userObj = {
        id:
          payload?.[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
          ] ?? null,

        email:
          payload?.[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
          ] ?? null,

        role:
          payload?.[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
          ] ?? null,

        name:
          payload?.[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
          ] ?? null,

        _rawJwtPayload: payload,
      };
console.log(userObj);


      persistAuth(tokenVal, userObj);

      return { success: true, token: tokenVal, user: userObj };
    } catch (err) {
      console.error('Login failed', err);
      return { success: false, error: 'Server error. Please try again later.' };
    }
  };

  // Refresh user: re-decode stored token to refresh user object.
  // If you have an endpoint like GET /api/Auth/me, prefer calling it server-side.
  const refreshUser = async () => {
    if (!token) return null;
    try {
      const payload = parseJwt(token);
      if (!payload) {
        persistAuth(null, null);
        navigate('/login');
        return null;
      }

      const userObj = {
        id: payload?.nameid ?? payload?.sub ?? null,
        email: payload?.email ?? null,
        role: payload?.role ?? null,
        _rawJwtPayload: payload,
      };

      persistAuth(token, userObj);
      return userObj;
    } catch (err) {
      console.error('Failed to refresh user', err);
      return null;
    }
  };

  const logout = () => {
    persistAuth(null, null);
    navigate('/login');
  };

  // helper for authenticated fetches
  const authFetch = async (input, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const res = await fetch(input, { ...options, headers });
    return res;
  };

  const value = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    refreshUser,
    authFetch,
    isAuthenticated: !!token,
    isAdmin: user?.role?.toString().toLowerCase() === 'admin',
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

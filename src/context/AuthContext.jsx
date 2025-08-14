import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL } from '../pages/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${URL}/users/${user.id}`);
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setUser(null);
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${URL}/users?email=${email}`);
      const users = await res.json();

      if (users.length > 0 && users[0].password === password) {
        const userData = users[0];
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      return { success: false, error: 'Server error. Please try again later.' };
    }
  };

  const register = async (userData) => {
    try {
      const checkEmail = await fetch(`${URL}/users?email=${userData.email}`);
      const result = await checkEmail.json();

      if (result.length > 0) {
        return { success: false, error: 'Email already registered. Please use another.' };
      }

      const completeUserData = {
        ...userData,
        role: 'user',
        isBlock: false,
        cart: [],
        orders: [],
        wishlist: [],
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeUserData),
      });

      if (response.ok) {
        const newUser = await response.json();
        return { success: true, user: newUser };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Registration failed.' };
      }
    } catch (error) {
      return { success: false, error: 'Server error. Please try again later.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser, 
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api/axios';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({
    modules: {},
    funds: {}
  });
  const [loading, setLoading] = useState(true);

  // Fetch permissions from API
  const fetchUserPermissions = async () => {
    try {
      const response = await api.get('/api/v1/me/permissions');
      
      if (response.data) {
        const data = response.data;
        setPermissions({
          modules: data.modules || {},
          funds: data.funds || {}
        });
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      // Set empty permissions on error
      setPermissions({ modules: {}, funds: {} });
    }
  };

  // Initialize permissions on mount if user is logged in
  useEffect(() => {
    const token = Cookies.get('userToken') || Cookies.get('dashboardToken');
    if (token) {
      fetchUserPermissions().finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const clearAuth = () => {
    setUser(null);
    setPermissions({ modules: {}, funds: {} });
  };

  const value = {
    user,
    setUser,
    permissions,
    setPermissions,
    fetchUserPermissions,
    clearAuth,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

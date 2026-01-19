'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { useUserToken } from './useUserToken';

/**
 * Hook to fetch and manage user permissions
 * Uses backend endpoint: /api/v1/users/me/permissions
 * Returns user permissions in the format:
 * {
 *   modules: { moduleKey: { can_view, can_add, can_update, can_delete } },
 *   fundList: [...],
 *   accessibleModules: [...],
 *   accessibleFunds: [...]
 * }
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState({
    modules: {},
    fundList: [],
    accessibleModules: [],
    accessibleFunds: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenData = useUserToken();

  useEffect(() => {
    const fetchPermissions = async () => {
      // Don't fetch if we don't have token data
      if (!tokenData) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try primary endpoint: /api/v1/users/me/permissions
        let response;
        let data;
        
        try {
          response = await api.get('/api/v1/users/me/permissions');
          data = response.data;
        } catch (err1) {
          // Fallback: Try alternative endpoint
          try {
            response = await api.get('/api/v1/permissions/me/permissions');
            data = response.data;
          } catch (err2) {
            console.warn('Permission endpoints not available, using empty permissions');
            throw err2;
          }
        }

        // Extract permissions from response
        const permissionsData = {
          modules: data.modules || {},
          fundList: data.fundList || [],
          accessibleModules: data.permissions?.accessibleModules || Object.keys(data.modules || {}),
          accessibleFunds: data.permissions?.accessibleFunds || []
        };

        setPermissions(permissionsData);
      } catch (err) {
        console.error('Error fetching user permissions:', err);
        setError(err.message);
        // If all methods fail, return empty permissions (menu will show all items by default)
        setPermissions({
          modules: {},
          fundList: [],
          accessibleModules: [],
          accessibleFunds: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [tokenData]);

  return { permissions, loading, error };
};

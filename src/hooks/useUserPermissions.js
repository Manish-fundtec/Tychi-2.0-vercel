'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { useUserToken } from './useUserToken';
import { getFundIdFromToken } from '@/lib/getFundIdFromToken';

/**
 * Hook to fetch and manage user permissions
 * Returns user permissions based on their role and fund
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenData = useUserToken();
  const fundId = getFundIdFromToken();

  useEffect(() => {
    const fetchPermissions = async () => {
      // Don't fetch if we don't have required data
      if (!tokenData?.user_id && !tokenData?.id) {
        setLoading(false);
        return;
      }

      if (!fundId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userId = tokenData.user_id || tokenData.id;
        
        // Try multiple API endpoints to fetch user permissions
        let permissionsData = [];
        
        // Method 1: Try direct user permissions endpoint
        try {
          const response = await api.get(`/api/v1/users/${userId}/permissions`, {
            params: {
              fund_id: fundId
            }
          });
          permissionsData = response.data?.data || response.data?.permissions || response.data || [];
        } catch (err1) {
          console.log('Direct permissions endpoint not available, trying alternative...');
          
          // Method 2: Get user details which might include permissions
          try {
            const userResponse = await api.get(`/api/v1/users/${userId}`);
            const userData = userResponse.data?.data || userResponse.data;
            
            if (userData?.permissions) {
              permissionsData = userData.permissions;
            } else if (userData?.role?.permissions) {
              permissionsData = userData.role.permissions;
            } else if (userData?.role_id) {
              // Method 3: Get role permissions
              const roleId = userData.role_id;
              const roleResponse = await api.get(`/api/v1/roles/${roleId}/with-permissions`);
              const roleData = roleResponse.data?.data || roleResponse.data;
              
              if (roleData?.permissions) {
                permissionsData = roleData.permissions;
              }
            }
          } catch (err2) {
            console.log('Alternative methods failed, trying role-based approach...');
            
            // Method 4: If user has role_id in token, fetch role permissions
            if (tokenData.role_id) {
              try {
                const roleResponse = await api.get(`/api/v1/roles/${tokenData.role_id}/with-permissions`);
                const roleData = roleResponse.data?.data || roleResponse.data;
                if (roleData?.permissions) {
                  permissionsData = roleData.permissions;
                }
              } catch (err3) {
                console.error('All permission fetch methods failed:', err3);
              }
            }
          }
        }
        
        // Filter permissions for current fund if fundId is available
        if (fundId && Array.isArray(permissionsData)) {
          permissionsData = permissionsData.filter(
            perm => perm.fund_id === fundId || perm.fund_id === parseInt(fundId)
          );
        }
        
        setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      } catch (err) {
        console.error('Error fetching user permissions:', err);
        setError(err.message);
        // If all methods fail, return empty permissions (menu will show all items by default)
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [tokenData, fundId]);

  return { permissions, loading, error };
};

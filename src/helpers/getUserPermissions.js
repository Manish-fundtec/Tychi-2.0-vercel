import api from '@/lib/api/axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

/**
 * Fetch user's role permissions from API
 * @param {Object} tokenData - Decoded token data containing user info
 * @param {string} fundId - Optional fund ID to filter permissions
 * @returns {Promise<Array>} Array of permission objects
 */
export const getUserRolePermissions = async (tokenData, fundId = null) => {
  try {
    // Get user ID and role info from token
    const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId;
    const roleId = tokenData?.role_id || tokenData?.roleId;
    const orgId = tokenData?.org_id || tokenData?.organization_id;

    if (!userId && !roleId) {
      console.warn('No user ID or role ID found in token');
      return [];
    }

    // If we have role ID, fetch role with permissions
    if (roleId && orgId) {
      try {
        const response = await api.get(`/api/v1/roles/org/${orgId}/with-permissions`);
        const roles = response.data?.data || response.data || [];
        const userRole = Array.isArray(roles) 
          ? roles.find(r => (r.role_id || r.id) === roleId)
          : null;

        if (userRole && userRole.permissions) {
          let permissions = userRole.permissions || [];
          
          // Filter by fund if fundId is provided
          if (fundId) {
            permissions = permissions.filter(p => 
              (p.fund_id || p.fundId) === fundId
            );
          }

          return permissions;
        }
      } catch (error) {
        console.error('Error fetching role permissions:', error);
      }
    }

    // Alternative: Try to get user details with role
    if (userId) {
      try {
        const response = await api.get(`/api/v1/users/${userId}`);
        const user = response.data?.data || response.data;
        
        if (user?.role_id || user?.roleId) {
          const userRoleId = user.role_id || user.roleId;
          const userOrgId = user.org_id || user.organization_id || orgId;
          
          if (userOrgId) {
            const roleResponse = await api.get(`/api/v1/roles/org/${userOrgId}/with-permissions`);
            const roles = roleResponse.data?.data || roleResponse.data || [];
            const userRole = Array.isArray(roles)
              ? roles.find(r => (r.role_id || r.id) === userRoleId)
              : null;

            if (userRole && userRole.permissions) {
              let permissions = userRole.permissions || [];
              
              // Filter by fund if fundId is provided
              if (fundId) {
                permissions = permissions.filter(p => 
                  (p.fund_id || p.fundId) === fundId
                );
              }

              return permissions;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user with role:', error);
      }
    }

    return [];
  } catch (error) {
    console.error('Error in getUserRolePermissions:', error);
    return [];
  }
};

/**
 * Get user permissions from token or API
 * This is a cached version that can be used in components
 */
export const useUserPermissions = async (tokenData, fundId = null) => {
  // Check if permissions are in token
  if (tokenData?.permissions) {
    let permissions = Array.isArray(tokenData.permissions) 
      ? tokenData.permissions 
      : [];

    if (fundId) {
      permissions = permissions.filter(p => 
        (p.fund_id || p.fundId) === fundId
      );
    }

    return permissions;
  }

  // Otherwise fetch from API
  return await getUserRolePermissions(tokenData, fundId);
};

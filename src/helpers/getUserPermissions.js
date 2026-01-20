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

    console.log('🔍 getUserRolePermissions - Input:', { userId, roleId, orgId, fundId, tokenData });

    if (!userId && !roleId) {
      console.warn('⚠️ No user ID or role ID found in token');
      return [];
    }

    // First, try to get user details to get role_id (if not in token)
    let actualRoleId = roleId;
    let actualOrgId = orgId;

    if (userId && !actualRoleId) {
      try {
        console.log('📡 Fetching user details for userId:', userId);
        const userResponse = await api.get(`/api/v1/users/${userId}`);
        const user = userResponse.data?.data || userResponse.data;
        console.log('👤 User details:', user);
        
        actualRoleId = user?.role_id || user?.roleId || user?.role?.role_id || user?.role?.id;
        actualOrgId = user?.org_id || user?.organization_id || user?.organization?.org_id || orgId;
        
        console.log('✅ Extracted role info:', { actualRoleId, actualOrgId });
      } catch (error) {
        console.error('❌ Error fetching user details:', error);
      }
    }

    // If we have role ID and org ID, fetch role with permissions
    if (actualRoleId && actualOrgId) {
      try {
        console.log('📡 Fetching role permissions for roleId:', actualRoleId, 'orgId:', actualOrgId);
        const response = await api.get(`/api/v1/roles/org/${actualOrgId}/with-permissions`);
        const roles = response.data?.data || response.data || [];
        console.log('📋 All roles:', roles);
        
        const userRole = Array.isArray(roles) 
          ? roles.find(r => {
              const rId = r.role_id || r.id;
              const match = rId == actualRoleId || String(rId) === String(actualRoleId);
              console.log('🔍 Comparing role:', rId, 'with', actualRoleId, 'match:', match);
              return match;
            })
          : null;

        console.log('🎭 User role found:', userRole);

        if (userRole && userRole.permissions) {
          let permissions = Array.isArray(userRole.permissions) ? userRole.permissions : [];
          console.log('🔐 Raw permissions:', permissions);
          
          // Filter by fund if fundId is provided
          if (fundId) {
            permissions = permissions.filter(p => {
              const pFundId = p.fund_id || p.fundId;
              const match = pFundId == fundId || String(pFundId) === String(fundId);
              return match;
            });
            console.log('🔐 Filtered permissions for fundId', fundId, ':', permissions);
          }

          // Log each permission's module_key
          permissions.forEach(p => {
            console.log('📦 Permission:', {
              module_key: p.module_key || p.moduleKey,
              can_view: p.can_view,
              fund_id: p.fund_id || p.fundId
            });
          });

          return permissions;
        } else {
          console.warn('⚠️ User role found but no permissions:', userRole);
        }
      } catch (error) {
        console.error('❌ Error fetching role permissions:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    } else {
      console.warn('⚠️ Missing roleId or orgId:', { actualRoleId, actualOrgId });
    }

    return [];
  } catch (error) {
    console.error('❌ Error in getUserRolePermissions:', error);
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

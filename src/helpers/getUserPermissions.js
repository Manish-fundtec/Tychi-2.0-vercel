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
    // Get user ID and role info from token - check multiple possible field names
    const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.sub;
    const roleId = tokenData?.role_id || tokenData?.roleId;
    const orgId = tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId;

    console.log('🔍 getUserRolePermissions - Input:', { 
      userId, 
      roleId, 
      orgId, 
      fundId,
      tokenDataKeys: tokenData ? Object.keys(tokenData) : [],
      tokenDataSample: tokenData ? {
        user_id: tokenData.user_id,
        id: tokenData.id,
        userId: tokenData.userId,
        sub: tokenData.sub,
        org_id: tokenData.org_id,
        organization_id: tokenData.organization_id,
      } : null,
    });

    // Don't return early - try to fetch user details even if userId/roleId not in token
    // Many tokens only have user_id, not role_id, so we need to fetch user details
    let actualUserId = userId;
    let actualRoleId = roleId;
    let actualOrgId = orgId;

    // If we have userId but no roleId, fetch user details
    // OR if we have no userId but have orgId, try to find user by other means
    if (actualUserId && !actualRoleId) {
      try {
        console.log('📡 Fetching user details for userId:', actualUserId);
        const userResponse = await api.get(`/api/v1/users/${actualUserId}`);
        const user = userResponse.data?.data || userResponse.data;
        console.log('👤 User details:', user);
        
        actualRoleId = user?.role_id || user?.roleId || user?.role?.role_id || user?.role?.id;
        actualOrgId = user?.org_id || user?.organization_id || user?.organization?.org_id || actualOrgId || orgId;
        
        console.log('✅ Extracted role info:', { actualRoleId, actualOrgId });
      } catch (error) {
        console.error('❌ Error fetching user details:', error);
        // Don't return early - continue to try with available data
      }
    }
    
    // If still no userId but we have orgId, we might need to check tokenData more carefully
    // But for now, if we don't have roleId and orgId, try /me/permissions endpoint as fallback
    if (!actualRoleId || !actualOrgId) {
      console.warn('⚠️ Cannot fetch permissions: missing roleId or orgId, trying /me/permissions endpoint', {
        actualRoleId,
        actualOrgId,
        hadUserId: !!actualUserId,
        hadRoleId: !!roleId,
        hadOrgId: !!orgId,
      });
      
      // Try /me/permissions endpoint as fallback (directly gets current user's permissions)
      try {
        console.log('📡 Trying /me/permissions endpoint as fallback');
        const mePermissionsResponse = await api.get('/api/v1/me/permissions');
        const permissions = mePermissionsResponse.data?.data || mePermissionsResponse.data?.permissions || mePermissionsResponse.data || [];
        
        if (Array.isArray(permissions) && permissions.length > 0) {
          console.log('✅ Got permissions from /me/permissions endpoint:', permissions.length);
          
          // Filter by fund if fundId is provided
          if (fundId) {
            const filtered = permissions.filter(p => {
              const pFundId = p.fund_id || p.fundId;
              return pFundId == fundId || String(pFundId) === String(fundId);
            });
            return filtered;
          }
          
          return permissions;
        }
      } catch (error) {
        console.error('❌ Error fetching permissions from /me/permissions endpoint:', error);
      }
      
      return [];
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
          console.log('🔐 Raw permissions (BEFORE filtering):', permissions);
          
          // 🔴 CRITICAL: Check TRADE permission structure in raw data
          const rawTradePerm = permissions.find(p => {
            const moduleKey = (p?.module_key || p?.moduleKey || '').toString().toLowerCase();
            return moduleKey === 'trade' || moduleKey === 'trades';
          });
          if (rawTradePerm) {
            console.log('🔴 RAW TRADE PERMISSION (from role, before filter):', {
              fullObject: rawTradePerm,
              allKeys: Object.keys(rawTradePerm),
              can_view: rawTradePerm.can_view,
              can_add: rawTradePerm.can_add,
              can_edit: rawTradePerm.can_edit,
              can_delete: rawTradePerm.can_delete,
              has_can_add: 'can_add' in rawTradePerm,
              has_can_edit: 'can_edit' in rawTradePerm,
              has_can_delete: 'can_delete' in rawTradePerm,
            });
          }
          
          // Filter by fund if fundId is provided
          if (fundId) {
            permissions = permissions.filter(p => {
              const pFundId = p.fund_id || p.fundId;
              const match = pFundId == fundId || String(pFundId) === String(fundId);
              return match;
            });
            console.log('🔐 Filtered permissions for fundId', fundId, ':', permissions);
          }

          // Log each permission with ALL fields to diagnose missing fields
          permissions.forEach(p => {
            console.log('📦 Permission (ALL FIELDS):', {
              module_key: p.module_key || p.moduleKey,
              can_view: p.can_view,
              can_add: p.can_add,
              can_edit: p.can_edit,
              can_delete: p.can_delete,
              fund_id: p.fund_id || p.fundId,
              allKeys: Object.keys(p), // Show all keys to see what backend actually sends
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

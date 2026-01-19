import api from './axios';

/**
 * Fetch current user's permissions
 * @returns {Promise<Object>} - Object containing modules and funds permissions
 */
export const fetchUserPermissions = async () => {
  try {
    const response = await api.get('/api/v1/me/permissions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    throw error;
  }
};

/**
 * Fetch permissions for a specific user (admin only)
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} - Object containing modules and funds permissions
 */
export const fetchUserPermissionsById = async (userId) => {
  try {
    const response = await api.get(`/api/v1/permissions/admin/user-permissions/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch permissions for user ${userId}:`, error);
    throw error;
  }
};

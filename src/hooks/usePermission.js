'use client';

import { useAuth } from '@/context/useAuthContext';

/**
 * Hook to check if user has a specific permission
 * @param {string} module - Module key (e.g., 'trade', 'fund', 'pricing')
 * @param {string} action - Action type (e.g., 'can_view', 'can_add', 'can_edit', 'can_delete')
 * @returns {boolean} - True if user has the permission, false otherwise
 */
export const usePermission = (module, action) => {
  const { permissions } = useAuth();
  
  if (!module || !action) {
    return false;
  }
  
  return permissions.modules[module]?.[action] || false;
};

/**
 * Hook to check if user has access to a specific fund
 * @param {string|number} fundId - Fund ID to check
 * @returns {boolean} - True if user has access to the fund, false otherwise
 */
export const useFundAccess = (fundId) => {
  const { permissions } = useAuth();
  
  if (!fundId) {
    return false;
  }
  
  const fundIdStr = String(fundId);
  return permissions.funds[fundIdStr] === true || permissions.funds[fundId] === true;
};

/**
 * Hook to get all accessible fund IDs
 * @returns {string[]} - Array of fund IDs the user has access to
 */
export const useAccessibleFunds = () => {
  const { permissions } = useAuth();
  
  return Object.keys(permissions.funds).filter(
    fundId => permissions.funds[fundId] === true
  );
};

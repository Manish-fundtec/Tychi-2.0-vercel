/**
 * Permission Helper Utilities
 * Use these functions to check permissions in your components
 */

import { useUserPermissions } from '@/hooks/useUserPermissions';
import { hasPermission, canView, canAdd, canEdit, canDelete } from '@/config/menu-module-mapping';

/**
 * Get permission status for a module
 * Can be used outside of React components
 */
export const getModulePermissions = (moduleKey, userPermissions) => {
  if (!userPermissions || !userPermissions.modules) {
    return {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    };
  }

  return {
    canView: canView(moduleKey, userPermissions),
    canAdd: canAdd(moduleKey, userPermissions),
    canEdit: canEdit(moduleKey, userPermissions),
    canDelete: canDelete(moduleKey, userPermissions),
  };
};

/**
 * Check if user can perform an action
 * @param {string} moduleKey - Module key (e.g., 'trade', 'fund')
 * @param {string} action - Action type ('view', 'add', 'edit', 'delete')
 * @param {Object} userPermissions - User permissions object
 * @returns {boolean}
 */
export const canPerformAction = (moduleKey, action, userPermissions) => {
  const actionMap = {
    view: 'can_view',
    add: 'can_add',
    edit: 'can_update',
    update: 'can_update',
    delete: 'can_delete',
  };

  const permissionType = actionMap[action.toLowerCase()];
  if (!permissionType) {
    return false;
  }

  return hasPermission(moduleKey, permissionType, userPermissions);
};

/**
 * Filter array of items based on permissions
 * Useful for filtering action buttons or menu items
 */
export const filterByPermission = (items, moduleKey, action, userPermissions) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.filter(item => {
    // If item has a module property, use it; otherwise use the provided moduleKey
    const itemModule = item.module || moduleKey;
    return canPerformAction(itemModule, action, userPermissions);
  });
};

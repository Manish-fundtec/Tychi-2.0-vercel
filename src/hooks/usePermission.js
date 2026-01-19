'use client';
import { useUserPermissions } from './useUserPermissions';
import { hasPermission, canView, canAdd, canEdit, canDelete } from '@/config/menu-module-mapping';

/**
 * Hook to check user permissions for a specific module
 * Usage:
 *   const { canView, canAdd, canEdit, canDelete, loading } = usePermission('trade');
 */
export const usePermission = (moduleKey) => {
  const { permissions, loading } = useUserPermissions();

  return {
    canView: canView(moduleKey, permissions),
    canAdd: canAdd(moduleKey, permissions),
    canEdit: canEdit(moduleKey, permissions),
    canDelete: canDelete(moduleKey, permissions),
    hasPermission: (permissionType) => hasPermission(moduleKey, permissionType, permissions),
    loading,
    permissions
  };
};

/**
 * Hook to check multiple permissions at once
 * Usage:
 *   const permissions = usePermissions(['trade', 'fund', 'pricing']);
 */
export const usePermissions = (moduleKeys) => {
  const { permissions, loading } = useUserPermissions();

  if (!Array.isArray(moduleKeys)) {
    return { loading, permissions: {} };
  }

  const result = {};
  moduleKeys.forEach(key => {
    result[key] = {
      canView: canView(key, permissions),
      canAdd: canAdd(key, permissions),
      canEdit: canEdit(key, permissions),
      canDelete: canDelete(key, permissions),
    };
  });

  return { loading, permissions: result };
};

// Mapping between menu items and module keys
// This maps menu URLs/keys to the module_key used in permissions
// IMPORTANT: Module keys must match the backend module_key values

export const MENU_MODULE_MAPPING = {
  // Main menu items - Update these to match your backend module_key values
  '/dashboards/analytics': 'dashboard', // or 'dashboards' - check backend
  '/configuration': 'configuration',
  '/trades': 'trade', // Backend uses 'trade' not 'trades'
  '/valuation': 'pricing', // or 'valuation' - check backend
  '/reports-period': 'reporting', // or 'reports' - check backend
  
  // General Ledger sub-menu items
  '/chartofaccounts': 'chart_of_accounts', // or 'chartofaccounts' - check backend
  '/journals': 'journal', // or 'journals' - check backend
  '/manualjournal': 'manual_journal', // or 'manualjournal' - check backend
  '/reconciliation': 'reconciliation',
  '/bookclosure': 'bookclosure',
  '/migration': 'migration',
  
  // Menu keys mapping (alternative to URLs)
  'dashboards': 'dashboard',
  'configuration': 'configuration',
  'trades': 'trade',
  'reviews': 'pricing', // reviews is the key for Valuation
  'messages': 'reporting', // messages is the key for Reports
  'customers': 'general_ledger', // customers is the key for General Ledger parent
  'list-view': 'chart_of_accounts',
  'grid-view': 'journal',
  'customer-details': 'manual_journal',
  'add-customer': 'reconciliation',
  'add-customer-2': 'bookclosure',
  'migration': 'migration',
};

// Helper function to get module key from menu item
export const getModuleKeyFromMenuItem = (menuItem) => {
  // First try URL mapping
  if (menuItem.url && MENU_MODULE_MAPPING[menuItem.url]) {
    return MENU_MODULE_MAPPING[menuItem.url];
  }
  
  // Then try key mapping
  if (menuItem.key && MENU_MODULE_MAPPING[menuItem.key]) {
    return MENU_MODULE_MAPPING[menuItem.key];
  }
  
  // Return null if no mapping found
  return null;
};

/**
 * Check if user has view permission for a menu item
 * @param {Object} menuItem - Menu item object
 * @param {Object} userPermissions - User permissions object from useUserPermissions hook
 * @returns {boolean} - True if user can view this menu item
 */
export const hasMenuPermission = (menuItem, userPermissions) => {
  // If no module mapping, show by default (for backward compatibility)
  const moduleKey = getModuleKeyFromMenuItem(menuItem);
  if (!moduleKey) {
    return true; // Show menu items without module mapping
  }
  
  // If no permissions provided, show by default
  if (!userPermissions || !userPermissions.modules) {
    return true;
  }
  
  // Check if module exists in permissions and has can_view = true
  const modulePerms = userPermissions.modules[moduleKey];
  return modulePerms?.can_view === true;
};

/**
 * Check if user has a specific permission for a module
 * @param {string} moduleKey - Module key (e.g., 'trade', 'fund', 'pricing')
 * @param {string} permissionType - 'can_view', 'can_add', 'can_update', 'can_delete'
 * @param {Object} userPermissions - User permissions object from useUserPermissions hook
 * @returns {boolean} - True if user has the permission
 */
export const hasPermission = (moduleKey, permissionType, userPermissions) => {
  if (!moduleKey || !permissionType || !userPermissions || !userPermissions.modules) {
    return false;
  }
  
  const modulePerms = userPermissions.modules[moduleKey];
  if (!modulePerms) {
    return false;
  }
  
  // Map permission types (handle both can_update and can_edit)
  const permKey = permissionType === 'can_edit' ? 'can_update' : permissionType;
  
  return modulePerms[permKey] === true;
};

/**
 * Convenience functions for common permission checks
 */
export const canView = (moduleKey, userPermissions) => {
  return hasPermission(moduleKey, 'can_view', userPermissions);
};

export const canAdd = (moduleKey, userPermissions) => {
  return hasPermission(moduleKey, 'can_add', userPermissions);
};

export const canEdit = (moduleKey, userPermissions) => {
  return hasPermission(moduleKey, 'can_update', userPermissions);
};

export const canDelete = (moduleKey, userPermissions) => {
  return hasPermission(moduleKey, 'can_delete', userPermissions);
};

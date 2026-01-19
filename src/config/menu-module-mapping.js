// Mapping between menu items and module keys
// This maps menu URLs/keys to the module_key used in permissions

export const MENU_MODULE_MAPPING = {
  // Main menu items
  '/dashboards/analytics': 'dashboards',
  '/configuration': 'configuration',
  '/trades': 'trades',
  '/valuation': 'valuation',
  '/reports-period': 'reports',
  
  // General Ledger sub-menu items
  '/chartofaccounts': 'chart_of_accounts',
  '/journals': 'journals',
  '/manualjournal': 'manual_journal',
  '/reconciliation': 'reconciliation',
  '/bookclosure': 'bookclosure',
  '/migration': 'migration',
  
  // Menu keys mapping (alternative to URLs)
  'dashboards': 'dashboards',
  'configuration': 'configuration',
  'trades': 'trades',
  'reviews': 'valuation', // reviews is the key for Valuation
  'messages': 'reports', // messages is the key for Reports
  'customers': 'general_ledger', // customers is the key for General Ledger parent
  'list-view': 'chart_of_accounts',
  'grid-view': 'journals',
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

// Helper function to check if menu item should be visible based on permissions
export const hasMenuPermission = (menuItem, userPermissions, fundId) => {
  // If no module mapping, show by default (for backward compatibility)
  const moduleKey = getModuleKeyFromMenuItem(menuItem);
  if (!moduleKey) {
    return true; // Show menu items without module mapping
  }
  
  // If no permissions provided, show by default
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return true;
  }
  
  // Find permission for this module and fund
  const permission = userPermissions.find(
    perm => 
      perm.module_key === moduleKey && 
      perm.fund_id === fundId &&
      perm.can_view === true
  );
  
  return !!permission;
};

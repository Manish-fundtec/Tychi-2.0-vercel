/**
 * Mapping between module keys (from permissions) and menu item keys
 * This maps which modules control which menu items in the sidebar
 * Supports multiple naming conventions (snake_case, camelCase, lowercase)
 */
export const MODULE_MENU_MAPPING = {
  // Regular user menu mappings - support multiple key formats
  'trade': 'trades',
  'trades': 'trades',
  'Trade': 'trades',
  'TRADE': 'trades',
  
  'reports': 'messages',           // Reports module -> Reports menu (key: messages)
  'report': 'messages',
  'Reports': 'messages',
  'REPORTS': 'messages',
  
  'valuation': 'reviews',         // Valuation module -> Valuation menu
  'Valuation': 'reviews',
  'VALUATION': 'reviews',
  
  'dashboard': 'dashboards',       // Dashboard module -> Dashboards menu
  'dashboards': 'dashboards',
  'Dashboard': 'dashboards',
  'Dashboards': 'dashboards',
  
  'configuration': 'configuration', // Configuration module -> Configuration menu
  'config': 'configuration',
  'Configuration': 'configuration',
  'CONFIGURATION': 'configuration',
  
  'general_ledger': 'customers',  // General Ledger module -> General Ledger menu (key: customers)
  'generalLedger': 'customers',
  'general ledger': 'customers',
  'General Ledger': 'customers',
  'GENERAL_LEDGER': 'customers',
  
  'chart_of_accounts': 'list-view', // Chart of Accounts submenu
  'chartOfAccounts': 'list-view',
  'chart of accounts': 'list-view',
  'Chart of Accounts': 'list-view',
  
  'journals': 'grid-view',        // Journals submenu
  'journal': 'grid-view',
  'Journals': 'grid-view',
  'JOURNALS': 'grid-view',
  
  'manual_journal': 'customer-details', // Manual Journal submenu
  'manualJournal': 'customer-details',
  'manual journal': 'customer-details',
  'Manual Journal': 'customer-details',
  
  'reconciliation': 'add-customer', // Reconciliation submenu
  'Reconciliation': 'add-customer',
  'RECONCILIATION': 'add-customer',
  
  'bookclosure': 'add-customer-2', // Bookclosure submenu
  'book_closure': 'add-customer-2',
  'bookClosure': 'add-customer-2',
  'Bookclosure': 'add-customer-2',
  'Book Closure': 'add-customer-2',
  
  'migration': 'migration',       // Migration submenu
  'Migration': 'migration',
  'MIGRATION': 'migration',

  // Admin menu mappings (if needed)
  'admin_dashboard': 'admin-dashboards',
  'adminDashboard': 'admin-dashboards',
  'admin dashboard': 'admin-dashboards',
  
  'organizations': 'admin-organization',
  'organization': 'admin-organization',
  'Organizations': 'admin-organization',
  
  'funds': 'admin-funds',
  'fund': 'admin-funds',
  'Funds': 'admin-funds',
  
  'users': 'admin-users',
  'user': 'admin-users',
  'Users': 'admin-users',
  
  'roles': 'admin-roles',
  'role': 'admin-roles',
  'Roles': 'admin-roles',
  'roles_permissions': 'admin-roles',
  'rolesPermissions': 'admin-roles',
  
  'settings': 'admin-settings',
  'setting': 'admin-settings',
  'Settings': 'admin-settings',
};

/**
 * Get menu keys that should be visible based on module permissions
 * @param {Array} permissions - Array of permission objects with module_key and can_view
 * @param {string} fundId - Current fund ID (optional, for fund-specific permissions)
 * @returns {Set} Set of menu keys that should be visible
 */
export const getVisibleMenuKeys = (permissions = [], fundId = null) => {
  const visibleMenuKeys = new Set();
  
  if (!permissions || permissions.length === 0) {
    // If no permissions, return empty set (show nothing)
    return new Set();
  }

  console.log('🔍 Processing permissions:', permissions);
  console.log('🔍 Fund ID filter:', fundId);

  permissions.forEach(permission => {
    // If fundId is provided, only consider permissions for that fund
    if (fundId && permission.fund_id && String(permission.fund_id) !== String(fundId)) {
      console.log(`⏭️ Skipping permission - fund mismatch: ${permission.fund_id} !== ${fundId}`);
      return;
    }

    // Check if user has view permission for this module
    if (permission.can_view === true || permission.can_view === 1 || permission.can_view === 'true') {
      const moduleKey = permission.module_key || permission.moduleKey || permission.module;
      console.log(`✅ Found permission with can_view=true for module: ${moduleKey}`);
      
      // Try to find menu key with case-insensitive matching
      const menuKey = MODULE_MENU_MAPPING[moduleKey] || 
                      MODULE_MENU_MAPPING[moduleKey?.toLowerCase()] ||
                      MODULE_MENU_MAPPING[moduleKey?.toUpperCase()];
      
      if (menuKey) {
        visibleMenuKeys.add(menuKey);
        console.log(`✅ Mapped module "${moduleKey}" to menu key "${menuKey}"`);
        
        // Handle parent-child relationships
        // If a child menu is visible, ensure parent is also visible
        if (menuKey === 'list-view' || menuKey === 'grid-view' || 
            menuKey === 'customer-details' || menuKey === 'add-customer' || 
            menuKey === 'add-customer-2' || menuKey === 'migration') {
          visibleMenuKeys.add('customers'); // General Ledger parent
          console.log(`✅ Added parent menu "customers" for child "${menuKey}"`);
        }
      } else {
        console.warn(`⚠️ No menu mapping found for module key: ${moduleKey}`);
      }
    } else {
      console.log(`⏭️ Skipping permission - can_view is false for module: ${permission.module_key || permission.moduleKey}`);
    }
  });

  console.log('📋 Final visible menu keys:', Array.from(visibleMenuKeys));
  return visibleMenuKeys;
};

/**
 * Check if a menu item should be visible based on permissions
 * @param {Object} menuItem - Menu item object
 * @param {Set|null} visibleMenuKeys - Set of visible menu keys (null means show all)
 * @returns {boolean} Whether the menu item should be visible
 */
export const shouldShowMenuItem = (menuItem, visibleMenuKeys) => {
  // If visibleMenuKeys is null or undefined, don't show (shouldn't happen, but safety check)
  if (visibleMenuKeys === null || visibleMenuKeys === undefined) {
    return false;
  }

  // Always show title items
  if (menuItem.isTitle) {
    return true;
  }

  // Check if this menu item's key is in visible keys
  if (visibleMenuKeys.has(menuItem.key)) {
    return true;
  }

  // Check if any child menu item is visible
  if (menuItem.children && menuItem.children.length > 0) {
    const hasVisibleChild = menuItem.children.some(child => 
      visibleMenuKeys.has(child.key) || shouldShowMenuItem(child, visibleMenuKeys)
    );
    if (hasVisibleChild) {
      return true;
    }
  }

  return false;
};

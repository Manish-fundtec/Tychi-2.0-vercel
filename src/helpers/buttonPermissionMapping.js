/**
 * Mapping between module keys (from permissions) and button actions
 * This maps which modules control which button permissions in different pages
 * Supports multiple naming conventions (snake_case, camelCase, lowercase)
 * 
 * Format: 'module_key': { button_key: 'permission_action' }
 * Example: 'trade': { delete: 'can_delete', add: 'can_add', edit: 'can_edit' }
 */
import { canModuleAction } from './permissionActions';

export const BUTTON_PERMISSION_MAPPING = {
  // Trade module buttons
  'trade': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'trades': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Trade': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'TRADE': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Reports module buttons
  'reports': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'report': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Reports': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'REPORTS': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Valuation module buttons
  'valuation': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Valuation': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'VALUATION': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Dashboard module buttons
  'dashboard': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'dashboards': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Dashboard': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Dashboards': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Configuration module buttons
  'configuration': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'config': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Configuration': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'CONFIGURATION': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Configuration sub-modules
  'configuration_basic': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationBasic': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'basic': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_brokerage': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationBrokerage': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'brokerage': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_bank': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationBank': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'bank': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_exchange': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationExchange': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'exchange': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_asset_type': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationAssetType': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'asset_type': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'assetType': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_symbol': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationSymbol': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'symbol': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Symbol': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configuration_mapping': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'configurationMapping': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'mapping': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Mapping': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // General Ledger module buttons
  'general_ledger': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'generalLedger': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'general ledger': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'General Ledger': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'GENERAL_LEDGER': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Chart of Accounts
  'chart_of_accounts': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'chartOfAccounts': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'chart of accounts': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Chart of Accounts': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Journals
  'journals': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'journal': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Journals': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'JOURNALS': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Manual Journal
  'manual_journal': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'manualJournal': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'manual journal': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Manual Journal': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Reconciliation
  'reconciliation': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Reconciliation': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'RECONCILIATION': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Bookclosure
  'bookclosure': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'book_closure': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'bookClosure': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Bookclosure': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Book Closure': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Migration
  'migration': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Migration': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'MIGRATION': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },

  // Admin modules
  'admin_dashboard': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'adminDashboard': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'admin dashboard': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'organizations': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'organization': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Organizations': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'funds': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'fund': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Funds': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'users': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'user': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Users': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'roles': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'role': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Roles': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'roles_permissions': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'rolesPermissions': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'settings': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'setting': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
  'Settings': {
    add: 'can_add',
    edit: 'can_edit',
    delete: 'can_delete',
    view: 'can_view',
  },
};

/**
 * Get the permission action key for a button in a module
 * @param {string} moduleKey - The module key (e.g., 'trade', 'trades')
 * @param {string} buttonKey - The button key (e.g., 'delete', 'add', 'edit', 'view')
 * @returns {string|null} The permission action key (e.g., 'can_delete') or null if not found
 */
export const getButtonPermissionAction = (moduleKey, buttonKey) => {
  if (!moduleKey || !buttonKey) return null;

  const normalize = (s) => (s ?? '').toString().trim().toLowerCase();
  const normalizedModuleKey = normalize(moduleKey);
  const normalizedButtonKey = normalize(buttonKey);

  // Try to find mapping with case-insensitive matching
  const mapping = BUTTON_PERMISSION_MAPPING[moduleKey] ||
                  BUTTON_PERMISSION_MAPPING[normalizedModuleKey] ||
                  BUTTON_PERMISSION_MAPPING[moduleKey?.toUpperCase()];

  if (!mapping) {
    console.warn(`⚠️ No button permission mapping found for module: ${moduleKey}`);
    return null;
  }

  const permissionAction = mapping[buttonKey] || mapping[normalizedButtonKey];
  
  if (!permissionAction) {
    console.warn(`⚠️ No permission action found for button "${buttonKey}" in module "${moduleKey}"`);
    return null;
  }

  return permissionAction;
};

/**
 * Check if user can perform a button action on a module
 * @param {Array} permissions - Array of permission objects
 * @param {string|string[]} moduleKeys - Module key(s) to check (e.g., 'trade', ['trade', 'trades'])
 * @param {string} buttonKey - Button key (e.g., 'delete', 'add', 'edit', 'view')
 * @param {string|number|null} fundId - Optional fund ID filter
 * @returns {boolean} Whether the user can perform the action
 */
export const canButtonAction = (permissions, moduleKeys, buttonKey, fundId = null) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;

  const keys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];
  
  // Try to find permission action for any of the module keys
  for (const moduleKey of keys) {
    const permissionAction = getButtonPermissionAction(moduleKey, buttonKey);
    if (permissionAction) {
      // Use the existing canModuleAction helper
      const canPerform = canModuleAction(permissions, moduleKey, permissionAction, fundId);
      if (canPerform) return true;
    }
  }

  return false;
};

import { getUserRolePermissions } from './getUserPermissions';

/**
 * Configuration tab to module key mapping
 */
export const CONFIG_TAB_MODULE_MAP = {
  '1': 'configuration_basic',      // Basic tab
  '2': 'configuration_brokerage',   // Brokerage Account tab
  '3': 'configuration_bank',       // Bank tab
  '4': 'configuration_exchange',   // Exchange tab
  '5': 'configuration_asset_type', // Asset Type tab
  '6': 'configuration_symbol',     // Symbol tab
  '7': 'configuration_mapping',    // Mapping tab
};

/**
 * Filter configuration tabs based on user permissions
 * @param {Array} tabContents - Array of tab objects
 * @param {Array} permissions - Array of permission objects
 * @param {string} fundId - Optional fund ID
 * @returns {Array} Filtered array of tabs
 */
export const filterConfigurationTabs = (tabContents, permissions = [], fundId = null) => {
  if (!permissions || permissions.length === 0) {
    console.log('⚠️ No permissions provided for configuration tabs, showing all');
    return tabContents; // Show all if no permissions
  }

  console.log('🔐 Filtering configuration tabs with permissions:', permissions.length);

  // Get visible module keys from permissions
  const visibleModules = new Set();
  permissions.forEach(permission => {
    // Filter by fund if fundId is provided
    if (fundId && permission.fund_id && String(permission.fund_id) !== String(fundId)) {
      return;
    }

    // Check if user has view permission
    if (permission.can_view === true || permission.can_view === 1 || permission.can_view === 'true') {
      const moduleKey = permission.module_key || permission.moduleKey || permission.module;
      visibleModules.add(moduleKey);
      visibleModules.add(moduleKey?.toLowerCase());
      visibleModules.add(moduleKey?.toUpperCase());
      console.log(`✅ Configuration module with access: ${moduleKey}`);
    }
  });

  // Filter tabs based on permissions
  const filteredTabs = tabContents.filter(tab => {
    const tabModuleKey = CONFIG_TAB_MODULE_MAP[tab.id];
    
    if (!tabModuleKey) {
      // If tab doesn't have a module mapping, show it (fallback)
      console.log(`⚠️ Tab ${tab.id} (${tab.title}) has no module mapping, showing by default`);
      return true;
    }

    // Check if this tab's module is in visible modules
    const hasAccess = visibleModules.has(tabModuleKey) || 
                     visibleModules.has(tabModuleKey.toLowerCase()) ||
                     visibleModules.has(tabModuleKey.toUpperCase()) ||
                     visibleModules.has(tabModuleKey.replace(/_/g, '')) ||
                     visibleModules.has(tabModuleKey.replace(/_/g, '-'));
    
    if (hasAccess) {
      console.log(`✅ Showing tab: ${tab.title} (module: ${tabModuleKey})`);
      return true;
    } else {
      console.log(`🚫 Hiding tab: ${tab.title} (module: ${tabModuleKey})`);
      return false;
    }
  });

  console.log(`📋 Filtered tabs: ${filteredTabs.length} of ${tabContents.length}`);
  return filteredTabs;
};

/**
 * Get user permissions and filter configuration tabs
 * @param {Array} tabContents - Array of tab objects
 * @param {Object} tokenData - User token data
 * @param {string} fundId - Optional fund ID
 * @returns {Promise<Array>} Filtered array of tabs
 */
export const getFilteredConfigurationTabs = async (tabContents, tokenData, fundId = null) => {
  try {
    const permissions = await getUserRolePermissions(tokenData, fundId);
    return filterConfigurationTabs(tabContents, permissions, fundId);
  } catch (error) {
    console.error('Error filtering configuration tabs:', error);
    return tabContents; // Return all tabs on error
  }
};

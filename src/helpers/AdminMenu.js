import { ADMIN_DASHBOARD_MENU_ITEMS } from '@/assets/data/admin-dashboard-menu-items';

// Mapping of admin menu keys to module keys for permission checking
const ADMIN_MENU_MODULE_MAP = {
  'admin-dashboards': 'admin_dashboard',
  'admin-organization': 'organization',
  'admin-funds': 'fund',
  'admin-users': 'user',
  'admin-roles': 'role',
  'admin-permissions': 'permission',
  'admin-settings': 'settings',
};

/**
 * Check if user is admin based on tokenData
 * @param {Object} tokenData - Token data from JWT
 * @param {boolean} hasDashboardToken - Whether user has dashboardToken (admin indicator)
 * @returns {boolean} - True if user is admin
 */
const isAdminUser = (tokenData, hasDashboardToken = false) => {
  // If dashboardToken exists, user is definitely admin
  if (hasDashboardToken) {
    return true;
  }
  
  if (!tokenData) {
    return false;
  }
  
  // Check admin flags in token
  return tokenData.isAdmin === true ||
         tokenData.role_tag?.toUpperCase() === 'ADMIN' ||
         tokenData.role_name?.toLowerCase() === 'admin' ||
         tokenData.user_type?.toLowerCase() === 'admin';
};

/**
 * Filter admin menu items based on user permissions
 * @param {Array} items - Menu items to filter
 * @param {Object} permissions - User permissions object { modules: {}, funds: {} }
 * @param {boolean} isAdmin - Whether user is admin (skip permission checks if true)
 * @returns {Array} - Filtered menu items
 */
const filterAdminMenuByPermissions = (items, permissions, isAdmin = false) => {
  // If user is admin, show all admin menu items without filtering
  if (isAdmin) {
    return items;
  }

  // If no permissions data, show all items (backward compatibility)
  if (!permissions || !permissions.modules) {
    return items;
  }

  return items
    .filter(item => {
      // Keep title items
      if (item.isTitle) {
        return true;
      }

      // Check if item has children - filter children first
      if (item.children) {
        const filteredChildren = filterAdminMenuByPermissions(item.children, permissions, isAdmin);
        // Keep parent if it has at least one visible child
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
          return true;
        }
        return false;
      }

      // Check permission for this menu item
      const moduleKey = ADMIN_MENU_MODULE_MAP[item.key];
      if (!moduleKey) {
        // If no mapping, show by default (for backward compatibility)
        return true;
      }

      // Check if user has view permission for this module
      return permissions.modules[moduleKey]?.can_view === true;
    })
    .map(item => {
      // Deep clone to avoid mutating original
      const cloned = { ...item };
      if (item.children) {
        cloned.children = [...item.children];
      }
      return cloned;
    });
};

export const getAdminMenuItems = (tokenData, permissions = null, hasDashboardToken = false) => {
  // Clone menu items to avoid mutating original
  const menuItems = JSON.parse(JSON.stringify(ADMIN_DASHBOARD_MENU_ITEMS));
  
  // Check if user is admin
  const isAdmin = isAdminUser(tokenData, hasDashboardToken);
  
  // Filter menu items based on permissions (skip if admin)
  return filterAdminMenuByPermissions(menuItems, permissions, isAdmin);
};

export const findAllParent = (menuItems, menuItem) => {
  let parents = [];
  const parent = findMenuItem(menuItems, menuItem.parentKey);
  if (parent) {
    parents.push(parent.key);
    if (parent.parentKey) {
      parents = [...parents, ...findAllParent(menuItems, parent)];
    }
  }
  return parents;
};

export const getMenuItemFromURL = (items, url) => {
  if (items instanceof Array) {
    for (const item of items) {
      const foundItem = getMenuItemFromURL(item, url);
      if (foundItem) {
        return foundItem;
      }
    }
  } else {
    if (items.url == url) return items;
    if (items.children != null) {
      for (const item of items.children) {
        if (item.url == url) return item;
      }
    }
  }
};

export const findMenuItem = (menuItems, menuItemKey) => {
  if (menuItems && menuItemKey) {
    for (const item of menuItems) {
      if (item.key === menuItemKey) {
        return item;
      }
      const found = findMenuItem(item.children, menuItemKey);
      if (found) return found;
    }
  }
  return null;
};

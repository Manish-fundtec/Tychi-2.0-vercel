import { ADMIN_DASHBOARD_MENU_ITEMS } from '@/assets/data/admin-dashboard-menu-items';
import { getVisibleMenuKeys, shouldShowMenuItem } from './moduleMenuMapping';

export const getAdminMenuItems = (tokenData, permissions = [], fundId = null) => {
  // Clone menu items to avoid mutating original
  const menuItems = JSON.parse(JSON.stringify(ADMIN_DASHBOARD_MENU_ITEMS));
  
  // Filter menu items based on permissions
  // Note: Admin menus might not need permission filtering, but we'll support it
  if (permissions && permissions.length > 0) {
    const visibleMenuKeys = getVisibleMenuKeys(permissions, fundId);
    
    // Filter menu items based on permissions
    const filteredMenuItems = menuItems.filter(item => {
      // Always keep title items
      if (item.isTitle) {
        return true;
      }

      // Check if this item should be visible
      if (!shouldShowMenuItem(item, visibleMenuKeys)) {
        return false;
      }

      // Filter children if they exist
      if (item.children && item.children.length > 0) {
        item.children = item.children.filter(child => 
          shouldShowMenuItem(child, visibleMenuKeys)
        );
        
        // If no children are visible, hide the parent (unless it has a direct URL)
        if (item.children.length === 0 && !item.url) {
          return false;
        }
      }

      return true;
    });

    return filteredMenuItems;
  }
  
  return menuItems;
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

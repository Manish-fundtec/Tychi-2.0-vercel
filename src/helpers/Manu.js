import { MENU_ITEMS } from '@/assets/data/menu-items';
import { hasMenuPermission } from '@/config/menu-module-mapping';

/**
 * Filter menu items based on user permissions
 * Recursively filters menu items and their children
 */
const filterMenuItemsByPermissions = (items, userPermissions) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => {
      // Don't filter title items
      if (item.isTitle) {
        return item;
      }

      // Check if this menu item has permission
      const hasPermission = hasMenuPermission(item, userPermissions);

      // If item has children, filter them first
      let filteredChildren = null;
      if (item.children && Array.isArray(item.children)) {
        filteredChildren = filterMenuItemsByPermissions(item.children, userPermissions);
        
        // If parent has permission OR has visible children, show parent
        if (hasPermission || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : undefined
          };
        }
        // If parent doesn't have permission and no visible children, hide it
        return null;
      }

      // If no children, check permission directly
      if (hasPermission) {
        return item;
      }

      // No permission, hide item
      return null;
    })
    .filter(item => item !== null); // Remove null items
};

export const getMenuItems = (tokenData, userPermissions = null) => {
  // Clone menu items to avoid mutating original
  const menuItems = JSON.parse(JSON.stringify(MENU_ITEMS));
  
  // Find General Ledger menu (key: 'customers')
  const generalLedger = menuItems.find(item => item.key === 'customers');
  
  if (generalLedger && generalLedger.children) {
    // Check multiple possible paths for onboarding mode
    const onboardingMode = 
      tokenData?.fund?.onboardingmode || 
      tokenData?.fund?.onboarding_mode ||
      tokenData?.onboardingmode ||
      tokenData?.onboarding_mode;
    
    // Normalize the value - check for both 'existing' and 'Existing Fund'
    const normalizedMode = onboardingMode?.toLowerCase().trim();
    // Strict check: only match exactly 'existing' or 'existing fund', and explicitly exclude 'new' or 'new fund'
    const isNew = normalizedMode === 'new' || normalizedMode === 'new fund';
    const isExisting = !isNew && (normalizedMode === 'existing' || normalizedMode === 'existing fund');
    
    console.log('onboardingMode:', onboardingMode);
    console.log('normalizedMode:', normalizedMode);
    console.log('isNew:', isNew);
    console.log('isExisting:', isExisting);
    
    if (isExisting) {
      // Check if Migration already exists
      const migrationExists = generalLedger.children.some(child => child.key === 'migration');
      
      if (!migrationExists) {
        // Add Migration menu item
        generalLedger.children.push({
          key: 'migration',
          label: 'Migration',
          icon: 'ri:upload-cloud-2-line',
          url: '/migration',
          parentKey: 'customers',
        });
      }
    } else {
      // Remove Migration if onboarding mode is not 'existing'
      generalLedger.children = generalLedger.children.filter(child => child.key !== 'migration');
    }
  }
  
  // Filter menu items based on permissions if provided
  if (userPermissions && userPermissions.modules) {
    return filterMenuItemsByPermissions(menuItems, userPermissions);
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
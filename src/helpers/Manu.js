import { MENU_ITEMS } from '@/assets/data/menu-items';
import { getVisibleMenuKeys, shouldShowMenuItem } from './moduleMenuMapping';

export const getMenuItems = (tokenData, permissions = [], fundId = null) => {
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

  // Filter menu items based on permissions
  // If permissions array is provided (even if empty), we filter
  // If permissions is undefined/null, it means we haven't loaded them yet or user is admin - show all temporarily
  if (permissions !== undefined && permissions !== null) {
    console.log('🔐 Filtering menu with permissions:', permissions);
    
    if (permissions.length === 0) {
      // User has no permissions - return only title
      console.log('⚠️ No permissions found, showing only title');
      return menuItems.filter(item => item.isTitle); // Only show title
    }
    
    const visibleMenuKeys = getVisibleMenuKeys(permissions, fundId);
    console.log('🔍 Visible menu keys:', Array.from(visibleMenuKeys || []));
    console.log('🔍 Total permissions:', permissions.length);
    
    // If no visible menu keys, show only title
    if (!visibleMenuKeys || visibleMenuKeys.size === 0) {
      console.log('⚠️ No visible menu keys found, showing only title');
      return menuItems.filter(item => item.isTitle);
    }
    
    // Filter menu items based on permissions
    const filteredMenuItems = menuItems.filter(item => {
      // Always keep title items
      if (item.isTitle) {
        return true;
      }

      // Check if this item should be visible
      const shouldShow = shouldShowMenuItem(item, visibleMenuKeys);
      if (!shouldShow) {
        console.log(`🚫 Hiding menu: ${item.key} (${item.label})`);
        return false;
      }

      // Filter children if they exist
      if (item.children && item.children.length > 0) {
        const originalCount = item.children.length;
        item.children = item.children.filter(child => 
          shouldShowMenuItem(child, visibleMenuKeys)
        );
        
        console.log(`📁 Menu ${item.key}: ${originalCount} children -> ${item.children.length} visible`);
        
        // If no children are visible, hide the parent (unless it has a direct URL)
        if (item.children.length === 0 && !item.url) {
          console.log(`🚫 Hiding parent menu (no visible children): ${item.key}`);
          return false;
        }
      }

      console.log(`✅ Showing menu: ${item.key} (${item.label})`);
      return true;
    });

    console.log('✅ Final filtered menu items count:', filteredMenuItems.length);
    return filteredMenuItems;
  }
  
  // If permissions is undefined/null, show all (fallback - might be loading or admin)
  console.log('ℹ️ Permissions not provided (undefined/null), showing all menus (might be loading or admin)');
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
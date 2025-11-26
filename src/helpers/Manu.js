import { MENU_ITEMS } from '@/assets/data/menu-items';

export const getMenuItems = (tokenData) => {
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
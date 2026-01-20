// src/components/layout/VerticalNavigationBar/page.jsx
'use client';

import LogoBox from '@/components/LogoBox';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import HoverMenuToggle from './components/HoverMenuToggle';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import AppMenu from './components/AppMenu';
import { getMenuItems } from '@/helpers/Manu';
import { getAdminMenuItems } from '@/helpers/AdminMenu';
import { getFundDetails } from '@/lib/api/fund';
import { ADMIN_DASHBOARD_MENU_ITEMS } from '@/assets/data/admin-dashboard-menu-items';
import { getUserRolePermissions } from '@/helpers/getUserPermissions';

// Helper function to get all admin menu URLs (including nested children)
const getAllAdminMenuUrls = (menuItems) => {
  const urls = [];
  menuItems.forEach(item => {
    if (item.url) {
      urls.push(item.url);
    }
    if (item.children) {
      item.children.forEach(child => {
        if (child.url) {
          urls.push(child.url);
        }
      });
    }
  });
  return urls;
};

const VerticalNavigationBar = ({ tokenData, isAdminDashboard = false }) => {
  const pathname = usePathname();
  
  // Get all admin menu URLs
  const adminMenuUrls = getAllAdminMenuUrls(ADMIN_DASHBOARD_MENU_ITEMS);
  
  // Check if we're in admin route (admindashboards or any admin menu URL)
  const isAdminDashboardRoute = isAdminDashboard || 
    pathname?.startsWith('/admindashboards') ||
    adminMenuUrls.some(url => pathname === url || pathname?.startsWith(url + '/'));
  
  // Get fund ID from token (define before useState)
  const fundId = tokenData?.fund_id || tokenData?.fundId || null;
  
  const [fundData, setFundData] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]); // Start with empty array, not undefined
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  // Initialize menu items - will be updated when permissions load
  // Start with empty array to avoid any initialization errors
  const [menuItems, setMenuItems] = useState([]);

  // Fetch user permissions
  useEffect(() => {
    if (!tokenData) {
      setLoadingPermissions(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const permissions = await getUserRolePermissions(tokenData, fundId);
        console.log('🔐 Fetched user permissions:', permissions);
        console.log('🔐 Permissions count:', permissions?.length || 0);
        console.log('🔐 Token data:', tokenData);
        console.log('🔐 Fund ID:', fundId);
        
        // Always set to array, never undefined
        const permissionsArray = Array.isArray(permissions) ? permissions : [];
        setUserPermissions(permissionsArray);
        
        console.log('🔐 Set userPermissions to:', permissionsArray);
      } catch (error) {
        console.error('❌ Error fetching user permissions:', error);
        // On error, set empty array so menu shows only title
        setUserPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [tokenData, fundId]);

  // Update menu items when tokenData, permissions, or route changes
  useEffect(() => {
    // Don't update if still loading or no tokenData
    if (loadingPermissions || !tokenData) {
      return;
    }

    try {
      if (isAdminDashboardRoute) {
        // For admin dashboard, update menu items with permissions
        const items = getAdminMenuItems(tokenData, userPermissions, fundId);
        setMenuItems(items || []);
        return;
      }

      const onboardingMode = 
        tokenData?.fund?.onboardingmode || 
        tokenData?.fund?.onboarding_mode ||
        tokenData?.onboardingmode ||
        tokenData?.onboarding_mode;
        
      // If onboarding mode is not in token, fetch fund details
      if (!onboardingMode && tokenData?.fund_id) {
        getFundDetails(tokenData.fund_id)
          .then((data) => {
            setFundData(data);
            // Merge fund data into tokenData structure
            const enhancedTokenData = {
              ...tokenData,
              fund: {
                ...tokenData.fund,
                onboardingmode: data.onboardingmode || data.onboarding_mode,
              },
            };
            const items = getMenuItems(enhancedTokenData, userPermissions, fundId);
            setMenuItems(items || []);
          })
          .catch((err) => {
            console.error('Failed to fetch fund details for menu:', err);
            // Still update menu with permissions even if fund fetch fails
            const items = getMenuItems(tokenData, userPermissions, fundId);
            setMenuItems(items || []);
          });
      } else {
        // Update menu items when tokenData changes
        const items = getMenuItems(tokenData, userPermissions, fundId);
        setMenuItems(items || []);
      }
    } catch (error) {
      console.error('Error updating menu items:', error);
      // Fallback to empty array on error
      setMenuItems([]);
    }
  }, [tokenData, isAdminDashboardRoute, userPermissions, fundId, loadingPermissions]);

  // Ensure menuItems is always an array
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

  return (
    <div className="main-nav" id="leftside-menu-container">
      <LogoBox />
      <HoverMenuToggle />
      <SimplebarReactClient className="scrollbar" data-simplebar>
        <AppMenu menuItems={safeMenuItems} tokenData={tokenData} />
      </SimplebarReactClient>
    </div>
  );
};

export default VerticalNavigationBar; 

// import LogoBox from '@/components/LogoBox';
// import React from 'react';
// import HoverMenuToggle from './components/HoverMenuToggle';
// import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
// import AppMenu from './components/AppMenu';
// import { getMenuItems } from '@/helpers/Manu';
// const page = () => {
//   const menuItems = getMenuItems();
//   return <div className="main-nav" id='leftside-menu-container'>
//       <LogoBox />
//       <HoverMenuToggle />
//       <SimplebarReactClient className="scrollbar" data-simplebar>
//         <AppMenu menuItems={menuItems} />
//       </SimplebarReactClient>
//     </div>;
// };
// export default page;
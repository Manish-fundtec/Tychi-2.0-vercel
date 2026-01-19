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
import { useAuth } from '@/context/useAuthContext';
import Cookies from 'js-cookie';

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
  const { permissions } = useAuth();
  
  // Check if user has dashboardToken (admin indicator)
  const hasDashboardToken = typeof window !== 'undefined' && !!Cookies.get('dashboardToken');
  
  // Get all admin menu URLs
  const adminMenuUrls = getAllAdminMenuUrls(ADMIN_DASHBOARD_MENU_ITEMS);
  
  // Check if we're in admin route (admindashboards or any admin menu URL)
  const isAdminDashboardRoute = isAdminDashboard || 
    pathname?.startsWith('/admindashboards') ||
    adminMenuUrls.some(url => pathname === url || pathname?.startsWith(url + '/'));
  
  const [menuItems, setMenuItems] = useState(() => {
    if (isAdminDashboardRoute) {
      return getAdminMenuItems(tokenData, permissions, hasDashboardToken);
    }
    return getMenuItems(tokenData, permissions, hasDashboardToken);
  });
  const [fundData, setFundData] = useState(null);

  // Fetch fund details if onboarding mode is not in token (only for regular menu)
  useEffect(() => {
    // Re-check dashboardToken on each render
    const currentHasDashboardToken = typeof window !== 'undefined' && !!Cookies.get('dashboardToken');
    
    if (isAdminDashboardRoute) {
      // For admin dashboard, just update menu items when tokenData or permissions change
      setMenuItems(getAdminMenuItems(tokenData, permissions, currentHasDashboardToken));
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
          setMenuItems(getMenuItems(enhancedTokenData, permissions, currentHasDashboardToken));
        })
        .catch((err) => {
          console.error('Failed to fetch fund details for menu:', err);
        });
      } else {
      // Update menu items when tokenData or permissions change
      setMenuItems(getMenuItems(tokenData, permissions, currentHasDashboardToken));
    }
  }, [tokenData, isAdminDashboardRoute, permissions]);

  return (
    <div className="main-nav" id="leftside-menu-container">
      <LogoBox />
      <HoverMenuToggle />
      <SimplebarReactClient className="scrollbar" data-simplebar>
        <AppMenu menuItems={menuItems} tokenData={tokenData} />
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
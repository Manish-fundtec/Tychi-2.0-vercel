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

const VerticalNavigationBar = ({ tokenData, isAdminDashboard = false }) => {
  const pathname = usePathname();
  // Check if we're in admin dashboards route
  const isAdminDashboardRoute = isAdminDashboard || pathname?.startsWith('/admindashboards/analytics');
  
  const [menuItems, setMenuItems] = useState(() => {
    if (isAdminDashboardRoute) {
      return getAdminMenuItems(tokenData);
    }
    return getMenuItems(tokenData);
  });
  const [fundData, setFundData] = useState(null);

  // Fetch fund details if onboarding mode is not in token (only for regular menu)
  useEffect(() => {
    if (isAdminDashboardRoute) {
      // For admin dashboard, just update menu items when tokenData changes
      setMenuItems(getAdminMenuItems(tokenData));
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
          setMenuItems(getMenuItems(enhancedTokenData));
        })
        .catch((err) => {
          console.error('Failed to fetch fund details for menu:', err);
        });
      } else {
      // Update menu items when tokenData changes
      setMenuItems(getMenuItems(tokenData));
    }
  }, [tokenData, isAdminDashboardRoute]);

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
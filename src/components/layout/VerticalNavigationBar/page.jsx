// src/components/layout/VerticalNavigationBar/page.jsx
'use client';

import LogoBox from '@/components/LogoBox';
import React from 'react';
import HoverMenuToggle from './components/HoverMenuToggle';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import AppMenu from './components/AppMenu';
import { getMenuItems } from '@/helpers/Manu';

const VerticalNavigationBar = ({ tokenData }) => {
  const menuItems = getMenuItems(tokenData); // <-- pass it if needed

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
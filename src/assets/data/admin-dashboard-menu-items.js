// Icon Mapping for Admin Dashboard Menu Labels
const ADMIN_ICON_MAP = {
  'Admin Dashboards': 'ri:dashboard-2-line',
  'Analytics': 'ri:bar-chart-line',
  'Customer': 'ri:user-line',
  'Users': 'ri:team-line',
  'Settings': 'ri:settings-3-line',
  'Reports': 'ri:file-chart-line',
  'System': 'ri:computer-line',
  'Roles': 'ri:user-settings-line',
  'Permissions': 'ri:shield-user-line',
  'Funds': 'ri:money-dollar-circle-line',
  'Organization': 'ri:building-2-line',
}

// Admin Dashboard Menu Items
export const ADMIN_DASHBOARD_MENU_ITEMS = [
  {
    key: 'admin-menu',
    label: 'ADMIN MENU',
    isTitle: true,
  },
  {
    key: 'admin-dashboards',
    label: 'Admin Dashboards',
    icon: ADMIN_ICON_MAP['Admin Dashboards'],
    url: '/admindashboards/analytics',
    
  },
  {
    key: 'admin-organization',
    label: 'Organizations',
    icon: ADMIN_ICON_MAP['Organization'],
    url: '/organizations',
  },
  {
    key: 'admin-funds',
    label: 'Funds',
    icon: ADMIN_ICON_MAP['Funds'],
    url: '/funds',
  },
  {
    key: 'admin-users',
    label: 'Users',
    icon: ADMIN_ICON_MAP['Users'],
    url: '/users',
  },
  {
    key: 'admin-roles',
    label: 'Roles & Permissions',
    icon: ADMIN_ICON_MAP['Roles'],
    url: '/roles',
  },
  // {
  //   key: 'admin-permissions',
  //   label: 'Permissions',
  //   icon: ADMIN_ICON_MAP['Permissions'],
  //   url: '/permissions',
  // },
  {
    key: 'admin-settings',
    label: 'Settings',
    icon: ADMIN_ICON_MAP['Settings'],
    url: '/settings',
  },
];

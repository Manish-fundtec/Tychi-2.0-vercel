// Icon Mapping for Admin Dashboard Menu Labels
const ADMIN_ICON_MAP = {
  'Admin Dashboards': 'ri:dashboard-2-line',
  'Analytics': 'ri:bar-chart-line',
  'Customer': 'ri:user-line',
  'Users': 'ri:team-line',
  'Settings': 'ri:settings-3-line',
  'Reports': 'ri:file-chart-line',
  'System': 'ri:computer-line',
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
    key: 'admin-reports',
    label: 'Funds',
    icon: ADMIN_ICON_MAP['Reports'],
    url: '/admin/funds',
  },
  {
    key: 'admin-users',
    label: 'Users',
    icon: ADMIN_ICON_MAP['Users'],
    url: '/admin/users',
  },
  {
    key: 'admin-system',
    label: 'Roles',
    icon: ADMIN_ICON_MAP['Roles'],
    url: '/admin/roles',
  },
  {
    key: 'admin-system',
    label: 'Permissions',
    icon: ADMIN_ICON_MAP['Permissions'],
    url: '/admin/permissions',
  },
  {
    key: 'admin-settings',
    label: 'Settings',
    icon: ADMIN_ICON_MAP['Settings'],
    url: '/admin/settings',
  },
];

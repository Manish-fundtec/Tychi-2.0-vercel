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
    children: [
      {
        key: 'admin-analytics',
        label: 'Analytics',
        icon: ADMIN_ICON_MAP['Analytics'],
        url: '/admindashboards/analytics',
        parentKey: 'admin-dashboards',
      },
      {
        key: 'admin-customer',
        label: 'Customer',
        icon: ADMIN_ICON_MAP['Customer'],
        url: '/admindashboards/customer',
        parentKey: 'admin-dashboards',
      },
    ],
  },
  {
    key: 'admin-users',
    label: 'Users',
    icon: ADMIN_ICON_MAP['Users'],
    url: '/admin/users',
  },
  {
    key: 'admin-settings',
    label: 'Settings',
    icon: ADMIN_ICON_MAP['Settings'],
    url: '/admin/settings',
  },
  {
    key: 'admin-reports',
    label: 'Reports',
    icon: ADMIN_ICON_MAP['Reports'],
    url: '/admin/reports',
  },
  {
    key: 'admin-system',
    label: 'System',
    icon: ADMIN_ICON_MAP['System'],
    url: '/admin/system',
  },
];

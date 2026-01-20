'use client';
import { useDashboardToken } from '@/hooks/useDashboardToken';
import { useUserToken } from '@/hooks/useUserToken';
import MappingTab from './MappingTab'; // ✅ import MappingTab here
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Col, Nav, NavItem, NavLink, Row, Tab, TabContainer, TabContent, TabPane, Tabs } from 'react-bootstrap';
import { tabContents } from './data';
import { filterConfigurationTabs } from '@/helpers/filterConfigurationTabs';
import { getUserRolePermissions } from '@/helpers/getUserPermissions';
import { useEffect, useState } from 'react';

export const NavPills = () => {
  const token = useDashboardToken(); // ✅ correctly inside component
  const userToken = useUserToken(); // Get user token for permissions
  const [filteredTabs, setFilteredTabs] = useState(tabContents);
  const [loading, setLoading] = useState(true);

  // Get fund ID
  const fundId = token?.fund_id || token?.fundId || null;

  // Fetch permissions and filter tabs
  useEffect(() => {
    const fetchAndFilterTabs = async () => {
      try {
        setLoading(true);
        
        // Use userToken if available, otherwise use token
        const tokenData = userToken || token;
        
        if (!tokenData) {
          console.log('⚠️ No token data, showing all tabs');
          setFilteredTabs(tabContents);
          setLoading(false);
          return;
        }

        // Fetch user permissions
        const permissions = await getUserRolePermissions(tokenData, fundId);
        console.log('🔐 Configuration tabs - permissions:', permissions);

        // Filter tabs based on permissions
        const filtered = filterConfigurationTabs(tabContents, permissions, fundId);
        setFilteredTabs(filtered);
      } catch (error) {
        console.error('❌ Error filtering configuration tabs:', error);
        // On error, show all tabs
        setFilteredTabs(tabContents);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterTabs();
  }, [token, userToken, fundId]);

  // If no tabs after filtering, show message
  if (!loading && filteredTabs.length === 0) {
    return (
      <div className="p-4 text-center text-muted">
        <p>No configuration tabs available based on your permissions.</p>
      </div>
    );
  }

  // Get default active key from first available tab
  const defaultActiveKey = filteredTabs.length > 0 ? filteredTabs[0].id : '1';

  return (
    <TabContainer defaultActiveKey={defaultActiveKey}>
      <Nav as={'ul'} variant="pills">
        {filteredTabs.map((tab, idx) => (
          <NavItem as={'li'} key={tab.id || idx}>
            <NavLink eventKey={tab.id}>
              <span className="d-block d-sm-none">
                <IconifyIcon icon={tab.icon} />
              </span>
              <span className="d-none d-sm-block">{tab.title}</span>
            </NavLink>
          </NavItem>
        ))} 
      </Nav>
      <TabContent className="pt-2 text-muted">
        {filteredTabs.map((tab, idx) => (
          <TabPane eventKey={tab.id} key={tab.id || idx}>
            {tab.description === "MAPPING_TAB" ? (
              <MappingTab fund_id={token?.fund_id} /> // ✅ Correctly inject fund_id here
            ) : (
              tab.description
            )}
          </TabPane>
        ))}
      </TabContent>
    </TabContainer>
  );
};

  const configurationTabs = () => {
    return <>
        <NavPills />
      </>;
  };
  export default configurationTabs;
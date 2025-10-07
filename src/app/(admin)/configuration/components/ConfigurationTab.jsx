'use client';
import { useDashboardToken } from '@/hooks/useDashboardToken';
import MappingTab from './MappingTab'; // ✅ import MappingTab here
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Col, Nav, NavItem, NavLink, Row, Tab, TabContainer, TabContent, TabPane, Tabs } from 'react-bootstrap';
import { tabContents } from './data';
export const NavPills = () => {
  const token = useDashboardToken(); // ✅ correctly inside component
    return (
        <TabContainer defaultActiveKey={'1'}>
          <Nav as={'ul'} variant="pills">
            {tabContents.map((tab, idx) => <NavItem as={'li'} key={idx}>
                <NavLink eventKey={tab.id}>
                  <span className="d-block d-sm-none">
                    <IconifyIcon icon={tab.icon} />
                  </span>
                  <span className="d-none d-sm-block">{tab.title}</span>
                </NavLink>
              </NavItem>)} 
          </Nav>
          <TabContent className="pt-2 text-muted">
            {tabContents.map((tab, idx) => (
              <TabPane eventKey={tab.id} key={idx}>
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
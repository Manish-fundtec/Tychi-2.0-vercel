'use client';

import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { useState, useEffect } from 'react';
import { Col, Nav, NavItem, NavLink, Row, Tab, TabContainer, TabContent, TabPane } from 'react-bootstrap';
import { tabContents } from './data';

export const NavPills = () => {
  // Retrieve the last selected tab from localStorage or default to the first tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('activeTab') || '1';
  });

  // Update localStorage when tab changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  return (
    <TabContainer activeKey={activeTab} onSelect={(key) => setActiveTab(key || '1')}>
      <Nav as="ul" variant="pills">
        {tabContents.map((tab, idx) => (
          <NavItem as="li" key={idx}>
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
        {tabContents.map((tab, idx) => (
          <TabPane eventKey={tab.id} key={idx}>
            <p className="mb-0">{tab.description}</p>
          </TabPane>
        ))}
      </TabContent>
    </TabContainer>
  );
};

export default NavPills;
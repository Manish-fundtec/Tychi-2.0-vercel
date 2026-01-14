'use client';
import Footer from '@/components/layout/Footer';
import AuthProtectionWrapper from '@/components/wrappers/AuthProtectionWrapper';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Container } from 'react-bootstrap';
import { useDashboardToken } from '@/hooks/useDashboardToken';

const TopNavigationBar = dynamic(() => import('@/components/layout/TopNavigationBar/page'));
const VerticalNavigationBar = dynamic(() => import('@/components/layout/VerticalNavigationBar/page'));

const AdminDashboardsLayout = ({ children }) => {
  const tokenData = useDashboardToken();

  if (!tokenData) {
    return <div className="m-4">⏳ Loading dashboard context...</div>;
  }

  return (
    <AuthProtectionWrapper>
      <div className="wrapper">
        <Suspense fallback={<div>Loading top navigation...</div>}>
          <TopNavigationBar />
        </Suspense>

        <Suspense fallback={<div>Loading sidebar...</div>}>
          <VerticalNavigationBar tokenData={tokenData} isAdminDashboard={true} />
        </Suspense>

        <div className="page-content">
          <Container fluid>{children}</Container>
          <Footer />
        </div>
      </div>
    </AuthProtectionWrapper>
  );
};

export default AdminDashboardsLayout;

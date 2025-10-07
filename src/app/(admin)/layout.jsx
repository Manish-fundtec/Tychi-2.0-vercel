'use client';
import Footer from '@/components/layout/Footer';
import AuthProtectionWrapper from '@/components/wrappers/AuthProtectionWrapper';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Container } from 'react-bootstrap';
import { useDashboardToken } from '@/hooks/useDashboardToken';

const TopNavigationBar = dynamic(() => import('@/components/layout/TopNavigationBar/page'));
const VerticalNavigationBar = dynamic(() => import('@/components/layout/VerticalNavigationBar/page'));

const AdminLayout = ({ children }) => {
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
          <VerticalNavigationBar tokenData={tokenData} />
        </Suspense>

        <div className="page-content">
          <Container fluid>{children}</Container>
          <Footer />
        </div>
      </div>
    </AuthProtectionWrapper>
  );
};

export default AdminLayout;


// 'use client';

// import Footer from '@/components/layout/Footer';
// import AuthProtectionWrapper from '@/components/wrappers/AuthProtectionWrapper';
// import dynamic from 'next/dynamic';
// import { Suspense } from 'react';
// import { Container } from 'react-bootstrap';
// import { useDashboardToken } from '@/hooks/useDashboardToken';
// import { useUserToken } from '@/hooks/useUserToken';
// import SetTokenFromUrl from '@/components/SetTokenFromUrl'; // 🆕 make sure it's included

// const TopNavigationBar = dynamic(() => import('@/components/layout/TopNavigationBar/page'));
// const VerticalNavigationBar = dynamic(() => import('@/components/layout/VerticalNavigationBar/page'));

// const AdminLayout = ({ children }) => {
//   const tokenData = useUserToken();

//   if (!tokenData) {
//     return (
//       <>
//         <SetTokenFromUrl /> {/* 🆕 store token if it's in query param */}
//         <div className="m-4">⏳ Loading dashboard context...</div>
//       </>
//     );
//   }

//   return (
//     <AuthProtectionWrapper>
//       <div className="wrapper">
//         <SetTokenFromUrl /> {/* still needed to store token if someone refreshes with ?token=... */}

//         <Suspense fallback={<div>Loading top navigation...</div>}>
//           <TopNavigationBar />
//         </Suspense>

//         <Suspense fallback={<div>Loading sidebar...</div>}>
//           <VerticalNavigationBar tokenData={tokenData} />
//         </Suspense>

//         <div className="page-content">
//           <Container fluid>{children}</Container>
//           <Footer />
//         </div>
//       </div>
//     </AuthProtectionWrapper>
//   );
// };

// export default AdminLayout;


// 'use client';

// import Footer from '@/components/layout/Footer';
// import AuthProtectionWrapper from '@/components/wrappers/AuthProtectionWrapper';
// import dynamic from 'next/dynamic';
// import { Suspense } from 'react';
// import { Container } from 'react-bootstrap';
// import { useDashboardToken } from '@/hooks/useDashboardToken';

// const TopNavigationBar = dynamic(() => import('@/components/layout/TopNavigationBar/page'));
// const VerticalNavigationBar = dynamic(() => import('@/components/layout/VerticalNavigationBar/page'));

// const AdminLayout = ({ children }) => {
//   const tokenData = useDashboardToken();

//   if (!tokenData) {
//     return <div className="m-4">⏳ Loading dashboard context...</div>;
//   }

//   return (
//     <AuthProtectionWrapper>
//       <div className="wrapper">
//         <Suspense>
//           <TopNavigationBar />
//         </Suspense>
//         <VerticalNavigationBar tokenData={tokenData} />
//         <div className="page-content">
//           <Container fluid>{children}</Container>
//           <Footer />
//         </div>
//       </div>
//     </AuthProtectionWrapper>
//   );
// };

// export default AdminLayout;
// import Footer from '@/components/layout/Footer';
// import AuthProtectionWrapper from '@/components/wrappers/AuthProtectionWrapper';
// import dynamic from 'next/dynamic';
// import { Suspense } from 'react';
// import { Container } from 'react-bootstrap';
// const TopNavigationBar = dynamic(() => import('@/components/layout/TopNavigationBar/page'));
// const VerticalNavigationBar = dynamic(() => import('@/components/layout/VerticalNavigationBar/page'));
// const AdminLayout = ({
//   children
// }) => {
//   return <AuthProtectionWrapper>
//       <div className="wrapper">
//         <Suspense>
//           <TopNavigationBar />
//         </Suspense>
//         <VerticalNavigationBar />
//         <div className="page-content">
//           <Container fluid>{children}</Container>
//           <Footer />
//         </div>
//       </div>
//     </AuthProtectionWrapper>;
// };
// export default AdminLayout;
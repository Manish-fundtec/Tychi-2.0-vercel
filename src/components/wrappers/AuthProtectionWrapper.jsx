'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import FallbackLoading from '../FallbackLoading';

const AuthProtectionWrapper = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('dashboardToken'); // or dashboardToken if you want

    if (!token) {
      console.warn('🔒 No dashboardToken found — redirecting to login');
      const redirectTo = encodeURIComponent(pathname);
      router.push(`/auth/sign-in?redirectTo=${redirectTo}`);
    } else {
      try {
        const decoded = jwtDecode(token);
        console.log('✅ Decoded dashboardToken:', decoded);
      } catch (err) {
        console.error('❌ Invalid dashboardToken, redirecting to login');
        router.push(`/auth/sign-in?redirectTo=${pathname}`);
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
};

export default AuthProtectionWrapper;


// 'use client';

// import { useSession } from 'next-auth/react';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import FallbackLoading from '../FallbackLoading';

// const AuthProtectionWrapper = ({ children }) => {
//   const { status } = useSession();
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     if (status === 'unauthenticated') {
//       const redirectTo = encodeURIComponent(pathname);
//       router.push(`/auth/sign-in?redirectTo=${redirectTo}`);
//     }
//   }, [status, pathname, router]);

//   if (status === 'loading') return <FallbackLoading />;
//   if (status === 'unauthenticated') return null;

//   return <>{children}</>;
// };

// export default AuthProtectionWrapper;

// 'use client';

// import { useSession } from 'next-auth/react';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import FallbackLoading from '../FallbackLoading';

// const AuthProtectionWrapper = ({ children }) => {
//   const { status } = useSession();
//   const { push } = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     // Only trigger redirect if the user is unauthenticated
//     if (status === 'unauthenticated') {
//       push(`/auth/sign-in?redirectTo=${pathname}`);
//     }
//   }, [status, pathname, push]);

//   if (status === 'unauthenticated') {
//     return <FallbackLoading />;
//   }

//   return <>{children}</>;
// };

// export default AuthProtectionWrapper;




// 'use client';

// import { useSession } from 'next-auth/react';
// import { usePathname, useRouter } from 'next/navigation';
// import { Suspense } from 'react';
// import FallbackLoading from '../FallbackLoading';
// const AuthProtectionWrapper = ({
//   children
// }) => {
//   const {
//     status
//   } = useSession();
//   const {
//     push
//   } = useRouter();
//   const pathname = usePathname();
//   if (status == 'unauthenticated') {
//     push(`/auth/sign-in?redirectTo=${pathname}`);
//     return <FallbackLoading />;
//   }
//   return <Suspense>{children}</Suspense>;
// };
// export default AuthProtectionWrapper; 
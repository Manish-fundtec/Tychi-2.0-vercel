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
    const token = Cookies.get('dashboardToken');

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
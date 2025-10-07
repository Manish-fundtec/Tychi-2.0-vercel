'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // ✅ FIXED

export const useDashboardToken = () => {
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const token = Cookies.get('dashboardToken');
    console.log('📊 dashboardToken from cookies:', token);

    if (token) {
      try {
        const decoded = jwtDecode(token); // ✅ FIXED
        console.log('🔓 Decoded dashboardToken:', decoded);
        setTokenData(decoded);
      } catch (error) {
        console.error('❌ Invalid dashboardToken:', error);
        setTokenData(null);
      }
    } else {
      console.warn('⚠️ No dashboardToken found in cookies');
    }
  }, []);

  return tokenData;
};

'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // ✅ FIXED

export const useUserToken = () => {
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const token = Cookies.get('userToken');
    console.log('🔐 userToken from cookies:', token);

    if (token) {
      try {
        const decoded = jwtDecode(token); // ✅ FIXED
        console.log('🧩 Decoded userToken:', decoded);
        setTokenData(decoded);
      } catch (err) {
        console.warn('⚠️ Invalid userToken:', err);
        setTokenData(null);
      }
    } else {
      console.warn('⚠️ No userToken found in cookies');
    }
  }, []);

  return tokenData;
};

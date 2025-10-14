'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const useUserToken = () => {
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    const cookieToken = Cookies.get('userToken');
    const lsToken = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
    const token = cookieToken || lsToken;

    console.log('🔐 userToken (cookie/localStorage):', token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('🧩 Decoded userToken:', decoded);
        setTokenData(decoded);
      } catch (err) {
        console.warn('⚠️ Invalid userToken:', err);
        setTokenData(null);
      }
    } else {
      console.warn('⚠️ No userToken found');
    }
  }, []);

  return tokenData;
};



// 'use client';
// import { useEffect, useState } from 'react';
// import Cookies from 'js-cookie';
// import { jwtDecode } from 'jwt-decode'; // ✅ FIXED

// export const useUserToken = () => {
//   const [tokenData, setTokenData] = useState(null);

//   useEffect(() => {
//     const token = Cookies.get('userToken');
//     console.log('🔐 userToken from cookies:', token);

//     if (token) {
//       try {
//         const decoded = jwtDecode(token); // ✅ FIXED
//         console.log('🧩 Decoded userToken:', decoded);
//         setTokenData(decoded);
//       } catch (err) {
//         console.warn('⚠️ Invalid userToken:', err);
//         setTokenData(null);
//       }
//     } else {
//       console.warn('⚠️ No userToken found in cookies');
//     }
//   }, []);

//   return tokenData;
// };

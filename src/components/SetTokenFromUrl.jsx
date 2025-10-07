'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

const SetTokenFromUrl = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      console.log('🪝 Setting dashboardToken from URL query');
      Cookies.set('dashboardToken', token, {
        path: '/',
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
      });
    
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    
  }, [token]);

  return null;
};

export default SetTokenFromUrl;



// 'use client';

// import { useSearchParams } from 'next/navigation';
// import { useEffect } from 'react';
// import Cookies from 'js-cookie';

// const SetTokenFromUrl = () => {
//   const searchParams = useSearchParams();
//   const token = searchParams.get('token');

//   useEffect(() => {
//     if (token) {
//       console.log('🔐 Setting userToken from URL');
//       Cookies.set('userToken', token, {
//         path: '/',
//         sameSite: 'Lax',
//         secure: process.env.NODE_ENV === 'production',
//       });

//       const cleanUrl = window.location.origin + window.location.pathname;
//       window.history.replaceState({}, '', cleanUrl);
//     }
//   }, [token]);

//   return null;
// };

// export default SetTokenFromUrl;

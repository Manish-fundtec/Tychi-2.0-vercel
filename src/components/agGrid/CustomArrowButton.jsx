'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getTokenForFund } from '@/lib/api/fund';
import Cookies from 'js-cookie';
import { signIn } from 'next-auth/react';

const CustomArrowButton = (params) => {
  const router = useRouter();
  const fundId = params.data.fund_id;

  const handleClick = async () => {
    try {
      const { token } = await getTokenForFund(fundId);
      console.log('📦 Dashboard token received:', token);

      if (token) {
        // ✅ Store dashboardToken
        Cookies.set('dashboardToken', token, {
          path: '/',
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
        });

        // // ✅ Trigger signIn to register token with next-auth session
        // await signIn('credentials', {
        //   redirect: false,
        //   token,
        // });

        // ✅ Then navigate
        router.push('/dashboards/analytics');
      } else {
        alert('Token generation failed');
      }
    } catch (error) {
      console.error('❌ Error fetching token:', error);
      alert('Error occurred');
    }
  };

  return (
    <button className="btn btn-sm btn-primary" onClick={handleClick}>
      ➡️
    </button>
  );
};

export default CustomArrowButton;

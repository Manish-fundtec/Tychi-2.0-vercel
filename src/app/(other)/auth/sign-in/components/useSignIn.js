'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNotificationContext } from '@/context/useNotificationContext';
import useQueryParams from '@/hooks/useQueryParams';
import { signIn } from 'next-auth/react';
import axios from '@/lib/api/axios';
import Cookies from 'js-cookie';
const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const { showNotification } = useNotificationContext();
  const queryParams = useQueryParams();

  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password')
  });

  const {
    control,
    handleSubmit
  } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const login = handleSubmit(async (values) => {
    // 🕐 PERFORMANCE DEBUGGING - Start tracking
    const performanceLog = {
      startTime: performance.now(),
      steps: []
    };

    const logStep = (stepName, details = '') => {
      const elapsed = performance.now() - performanceLog.startTime;
      performanceLog.steps.push({ step: stepName, time: elapsed, details });
      console.log(`⏱️ [LOGIN DEBUG] ${stepName} - ${elapsed.toFixed(2)}ms ${details ? `(${details})` : ''}`);
    };

    logStep('🚀 LOGIN STARTED', `Email: ${values.email}`);
    setLoading(true);

    try {
      logStep('✅ Form validation passed');
      logStep('📡 Preparing API request');

      // 🔐 Call backend login API
      const apiStartTime = performance.now();
      logStep('🌐 API REQUEST START', 'Sending to /api/v1/user_signin');
      
      const response = await axios.post('/api/v1/user_signin', {
        email: values.email,
        password: values.password,
      });

      const apiEndTime = performance.now();
      const apiDuration = apiEndTime - apiStartTime;
      logStep('✅ API RESPONSE RECEIVED', `${apiDuration.toFixed(2)}ms - Status: ${response.status}`);

      const { accessToken } = response.data;
      logStep('🔓 Token extracted from response', accessToken ? 'Token found' : 'NO TOKEN!');

      if (accessToken) {
        const cookieStartTime = performance.now();
        logStep('🍪 Setting cookie - START');

        // ✅ Store token in cookie for backend to read
        Cookies.set('userToken', accessToken, {
          path: '/',
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
        });

        const cookieEndTime = performance.now();
        logStep('✅ Cookie set complete', `${(cookieEndTime - cookieStartTime).toFixed(2)}ms`);

        const notificationStartTime = performance.now();
        logStep('📢 Showing notification - START');

        showNotification({
          message: 'Successfully logged in. Redirecting...',
          variant: 'success',
        });

        const notificationEndTime = performance.now();
        logStep('✅ Notification shown', `${(notificationEndTime - notificationStartTime).toFixed(2)}ms`);

        const redirectPath = queryParams['redirectTo'] ?? '/fundlist';
        logStep('🚀 Initiating redirect', `To: ${redirectPath}`);
        
        const redirectStartTime = performance.now();
        
        // 🚀 Redirect after successful login
        push(redirectPath);
        
        const redirectEndTime = performance.now();
        logStep('✅ Redirect initiated', `${(redirectEndTime - redirectStartTime).toFixed(2)}ms`);

        // Final summary
        const totalTime = performance.now() - performanceLog.startTime;
        console.log(`\n🎯 ===== LOGIN PERFORMANCE SUMMARY =====`);
        console.log(`⏱️  TOTAL TIME: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
        console.log(`📊 Time breakdown:`);
        performanceLog.steps.forEach((step, idx) => {
          const prevTime = idx > 0 ? performanceLog.steps[idx - 1].time : 0;
          const stepDuration = step.time - prevTime;
          console.log(`   ${idx + 1}. ${step.step}: ${stepDuration.toFixed(2)}ms`);
        });
        console.log(`=========================================\n`);
        
      } else {
        logStep('❌ NO TOKEN IN RESPONSE');
        showNotification({
          message: 'Login failed. No token returned from server.',
          variant: 'danger',
        });
      }
    } catch (error) {
      const errorTime = performance.now() - performanceLog.startTime;
      logStep('❌ ERROR OCCURRED', `${errorTime.toFixed(2)}ms`);
      console.error('❌ Login error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        timeout: error?.code === 'ECONNABORTED' ? 'Request timeout!' : null
      });
      
      showNotification({
        message: error?.response?.data?.message || 'Something went wrong during login',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
      logStep('🏁 Loading state cleared', 'Final cleanup');
    }
  });

  return {
    loading,
    login,
    control
  };
};

export default useSignIn;

// 'use client';

// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import * as yup from 'yup';
// import { yupResolver } from '@hookform/resolvers/yup';
// import { useNotificationContext } from '@/context/useNotificationContext';
// import useQueryParams from '@/hooks/useQueryParams';
// import { loginUser } from '@/lib/api/authService'; // ✅ Import your login API

// const useSignIn = () => {
//   const [loading, setLoading] = useState(false);
//   const { push } = useRouter();
//   const { showNotification } = useNotificationContext();
//   const queryParams = useQueryParams();

//   const loginFormSchema = yup.object({
//     email: yup.string().email('Please enter a valid email').required('Please enter your email'),
//     password: yup.string().required('Please enter your password')
//   });

//   const {
//     control,
//     handleSubmit
//   } = useForm({
//     resolver: yupResolver(loginFormSchema),
//     defaultValues: {
//       email: '',
//       password: ''
//     }
//   });

//   const login = handleSubmit(async (values) => {
//     setLoading(true);
//     try {
//       const response = await loginUser({
//         username: values.email, // ✅ Send as username, because your backend expects `username`
//         password: values.password
//       });

//       // ✅ Save access token (or ID token) to localStorage
//       localStorage.setItem('token', response.accessToken);
//       sessionStorage.setItem('userSession', JSON.stringify(response)); // Add to session storage if necessary

//       showNotification({
//         message: 'Successfully logged in. Redirecting...',
//         variant: 'success'
//       });

//       // ✅ Redirect to dashboard
//       push(queryParams['redirectTo'] ?? '/fundlist');

//     } catch (error) {
//       showNotification({
//         message: error?.message || 'Login failed',
//         variant: 'danger'
//       });
//     } finally {
//       setLoading(false);
//     }
//   });

//   return {
//     loading,
//     login,
//     control
//   };
// };

// export default useSignIn;

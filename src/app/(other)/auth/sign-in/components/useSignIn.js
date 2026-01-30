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
    setLoading(true);
    try {
      // 🔐 Call backend login API
      const response = await axios.post('/api/v1/user_signin', {
        email: values.email,
        password: values.password,
      });

      const { accessToken, user, dashboardToken, userAuthToken } = response.data;

      if (accessToken) {
        // ✅ Store token in cookie for backend to read
        Cookies.set('userToken', accessToken, {
          path: '/',
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
        });

        // ✅ Store userAuthToken (contains role_id for permissions)
        // Check multiple sources: response body, response headers (Set-Cookie), or fetch from /me
        let authToken = userAuthToken;
        
        // Check if backend set userAuthToken as cookie in response headers
        if (!authToken && response.headers?.['set-cookie']) {
          const setCookieHeaders = Array.isArray(response.headers['set-cookie']) 
            ? response.headers['set-cookie'] 
            : [response.headers['set-cookie']];
          
          for (const cookieHeader of setCookieHeaders) {
            if (cookieHeader && cookieHeader.includes('userAuthToken=')) {
              const match = cookieHeader.match(/userAuthToken=([^;]+)/);
              if (match) {
                authToken = decodeURIComponent(match[1]);
                console.log('✅ Found userAuthToken in response Set-Cookie header');
                break;
              }
            }
          }
        }
        
        // If backend doesn't send userAuthToken, try to fetch user details from /me endpoint
        if (!authToken) {
          try {
            // Fetch current user details from /me endpoint to get role_id
            const meResponse = await axios.get('/api/v1/me', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            const userData = meResponse.data?.data || meResponse.data;
            
            // Check if /me response has userAuthToken
            authToken = userData?.userAuthToken || userData?.token;
            
            // If still no userAuthToken, check if user object from signin has role_id
            // and we can use accessToken (assuming it contains role_id)
            if (!authToken && (user?.role_id || userData?.role_id)) {
              // If user has role_id, use accessToken as userAuthToken
              // (assuming backend accessToken includes role_id for authenticated users)
              authToken = accessToken;
              console.log('✅ Using accessToken as userAuthToken (user has role_id)');
            } else if (!authToken) {
              // Final fallback to accessToken
              authToken = accessToken;
              console.warn('⚠️ No userAuthToken found, using accessToken as fallback');
            }
          } catch (err) {
            console.warn('Could not fetch user details from /me endpoint, using accessToken:', err);
            // Fallback to accessToken if /me endpoint fails
            authToken = accessToken;
          }
        }
        
        Cookies.set('userAuthToken', authToken, {
          path: '/',
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
        });
        
        console.log('✅ userAuthToken set in cookie:', !!authToken);

        // 🚀 Check if user is admin and redirect accordingly
        const isAdmin = user?.isAdmin || 
                       user?.role_tag?.toUpperCase() === 'ADMIN' || 
                       user?.role_name?.toLowerCase() === 'admin';
        
        // ✅ For admin users, set dashboardToken from backend response
        if (isAdmin && dashboardToken) {
          Cookies.set('dashboardToken', dashboardToken, {
            path: '/',
            sameSite: 'Lax',
            secure: process.env.NODE_ENV === 'production',
            expires: 6 / 24, // 6 hours (matching backend expiry)
          });
        }

        showNotification({
          message: 'Successfully logged in. Redirecting...',
          variant: 'success',
        });
        
        const redirectPath = queryParams['redirectTo'] ?? 
                            (isAdmin ? '/admindashboards/analytics' : '/fundlist');

        push(redirectPath);
      } else {
        showNotification({
          message: 'Login failed. No token returned from server.',
          variant: 'danger',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification({
        message: error?.response?.data?.message || 'Something went wrong during login',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
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

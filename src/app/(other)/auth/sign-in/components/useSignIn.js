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

      const { accessToken, user } = response.data;

      if (accessToken) {
        // ✅ Store token in cookie for backend to read
        Cookies.set('userToken', accessToken, {
          path: '/',
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
        });

        showNotification({
          message: 'Successfully logged in. Redirecting...',
          variant: 'success',
        });

        // 🚀 Check if user is admin and redirect accordingly
        const isAdmin = user?.isAdmin || 
                       user?.role_tag?.toUpperCase() === 'ADMIN' || 
                       user?.role_name?.toLowerCase() === 'admin';
        
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

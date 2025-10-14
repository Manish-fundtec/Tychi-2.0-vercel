import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// ⭐️ Add a request interceptor ⭐️
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from cookies
    const token = Cookies.get('userToken');

    // 2. If the token exists, set the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Optional: Log a warning or handle navigation to the login page
      console.warn('⚠️ No userToken found for request to', config.url);
    }

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default api;

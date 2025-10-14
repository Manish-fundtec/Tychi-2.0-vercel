import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Attach Authorization header from localStorage if present
api.interceptors.request.use((config) => {
  try {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});


export default api;

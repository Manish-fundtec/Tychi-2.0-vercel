import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Attach Authorization header from storage/cookies if present
api.interceptors.request.use((config) => {
  try {
    let token = null;
    if (typeof window !== 'undefined') {
      // Try tokens from localStorage first
      token = localStorage.getItem('accessToken')
        || localStorage.getItem('idToken');

      // Fallback: try cookie tokens if present
      if (!token) {
        const cookieString = document.cookie || '';
        const getCookie = (name) => {
          const match = cookieString.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : null;
        };
        token = getCookie('userToken') || getCookie('dashboardToken');
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV !== 'production' && !config.headers['X-Auth-Debug']) {
        config.headers['X-Auth-Debug'] = '1';
        // eslint-disable-next-line no-console
        console.debug('[axios] Authorization header attached');
      }
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});


export default api;

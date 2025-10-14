import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Attach Authorization header from storage/cookies if present
api.interceptors.request.use((config) => {
  try {
    let token = null;
    let tokenType = null;
    if (typeof window !== 'undefined') {
      // Try tokens from localStorage first
      const idToken = localStorage.getItem('idToken');
      const accessToken = localStorage.getItem('accessToken');
      // Prefer idToken (usually carries user/org claims), else accessToken
      if (idToken) {
        token = idToken;
        tokenType = 'idToken';
      } else if (accessToken) {
        token = accessToken;
        tokenType = 'accessToken';
      }

      // Fallback: try cookie tokens if present
      if (!token) {
        const cookieString = document.cookie || '';
        const getCookie = (name) => {
          const match = cookieString.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : null;
        };
        if (!token) {
          const cookieUser = getCookie('userToken');
          const cookieDash = getCookie('dashboardToken');
          token = cookieUser || cookieDash;
          tokenType = cookieUser ? 'userToken' : (cookieDash ? 'dashboardToken' : null);
        }
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV !== 'production' && !config.headers['X-Auth-Debug']) {
        config.headers['X-Auth-Debug'] = '1';
        if (tokenType) {
          config.headers['X-Token-Type'] = tokenType;
        }
        // eslint-disable-next-line no-console
        console.debug('[axios] Authorization header attached', tokenType ? `(type=${tokenType})` : '');
      }
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});


export default api;

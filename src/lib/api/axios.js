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
      // Prefer legacy cookie tokens first (aligns with hooks)
      const cookieString = document.cookie || '';
      const getCookie = (name) => {
        const match = cookieString.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
      };
      const cookieUser = getCookie('userToken');
      const cookieDash = getCookie('dashboardToken');
      if (cookieUser) {
        token = cookieUser;
        tokenType = 'userToken';
      } else if (cookieDash) {
        token = cookieDash;
        tokenType = 'dashboardToken';
      }

      // Fallback to localStorage tokens if cookies missing
      if (!token) {
        const idToken = localStorage.getItem('idToken');
        const accessToken = localStorage.getItem('accessToken');
        if (idToken) {
          token = idToken;
          tokenType = 'idToken';
        } else if (accessToken) {
          token = accessToken;
          tokenType = 'accessToken';
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

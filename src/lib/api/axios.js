import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Attach Authorization header from storage/cookies if present
// 🕐 PERFORMANCE DEBUGGING - Request Interceptor with Timing
api.interceptors.request.use((config) => {
  // Track request timing
  config.metadata = { startTime: performance.now() };
  
  // Log request details for sign-in endpoint
  const isSignInRequest = config.url?.includes('user_signin') || config.url?.includes('login');
  if (isSignInRequest && typeof window !== 'undefined') {
    console.log(`\n🌐 [AXIOS] ===== API REQUEST START =====`);
    console.log(`📡 URL: ${config.baseURL}${config.url}`);
    console.log(`⏰ Request started at: ${new Date().toISOString()}`);
    console.log(`🔧 Method: ${config.method?.toUpperCase()}`);
  }

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

// 🕐 PERFORMANCE DEBUGGING - Response Interceptor with Timing
api.interceptors.response.use(
  (response) => {
    const isSignInRequest = response.config?.url?.includes('user_signin') || response.config?.url?.includes('login');
    
    if (response.config.metadata) {
      const duration = performance.now() - response.config.metadata.startTime;
      
      if (isSignInRequest && typeof window !== 'undefined') {
        console.log(`\n✅ [AXIOS] ===== API RESPONSE RECEIVED =====`);
        console.log(`⏱️  TOTAL REQUEST TIME: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}s)`);
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📦 Response size: ${JSON.stringify(response.data).length} bytes`);
        console.log(`⏰ Response received at: ${new Date().toISOString()}`);
        
        // Check if response took too long
        if (duration > 1000) {
          console.warn(`⚠️  WARNING: Request took ${(duration / 1000).toFixed(2)}s - This is SLOW!`);
        }
        if (duration > 5000) {
          console.error(`🚨 CRITICAL: Request took ${(duration / 1000).toFixed(2)}s - This is VERY SLOW!`);
        }
        console.log(`==========================================\n`);
      }
    }
    
    return response;
  },
  (error) => {
    const isSignInRequest = error.config?.url?.includes('user_signin') || error.config?.url?.includes('login');
    const isTradeUploadRequest = error.config?.url?.includes('trade/upload');
    
    // Don't log expected 400 errors for trade upload (validation errors are expected)
    const isExpectedError = isTradeUploadRequest && error.response?.status === 400;
    
    if (error.config?.metadata) {
      const duration = performance.now() - error.config.metadata.startTime;
      
      // Only log errors for sign-in requests or unexpected errors (not 400 for trade upload)
      if (isSignInRequest && typeof window !== 'undefined') {
        console.error(`\n❌ [AXIOS] ===== API REQUEST FAILED =====`);
        console.error(`⏱️  FAILED AFTER: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}s)`);
        console.error(`📊 Status: ${error.response?.status || 'No response'}`);
        console.error(`🔴 Error: ${error.message}`);
        console.error(`🌐 URL: ${error.config?.baseURL}${error.config?.url}`);
        
        if (error.code === 'ECONNABORTED') {
          console.error(`⏰ REQUEST TIMEOUT - The server took too long to respond!`);
        }
        if (error.code === 'ERR_NETWORK') {
          console.error(`🌐 NETWORK ERROR - Check your internet connection or server status!`);
        }
        console.error(`==========================================\n`);
      } else if (!isExpectedError && typeof window !== 'undefined') {
        // Log unexpected errors (not 400 for trade upload)
        if (error.response?.status >= 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          console.error(`\n❌ [AXIOS] ===== API REQUEST FAILED =====`);
          console.error(`📊 Status: ${error.response?.status || 'No response'}`);
          console.error(`🔴 Error: ${error.message}`);
          console.error(`🌐 URL: ${error.config?.baseURL}${error.config?.url}`);
          console.error(`==========================================\n`);
        }
      }
    }
    
    return Promise.reject(error);
  }
);


export default api;

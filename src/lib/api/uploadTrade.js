import Cookies from 'js-cookie'; // ✅ Add this
import api from './axios';
 
export const uploadTradeFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
 
  // ✅ Make sure token exists
  const token = Cookies.get('dashboardToken');
  console.log('Bearer token:', token);
 
  return api.post('/api/v1/trade/upload', formData, {
    headers: {
      'dashboard': `Bearer ${token}`, // manually attach token
      'Content-Type': 'multipart/form-data', // optional but good
    },
  });
};
 
export const createTrade = (payload) => {
  const token = Cookies.get('dashboardToken');
  return api.post('/api/v1/trade', payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};
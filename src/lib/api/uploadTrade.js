// lib/api/uploadTrade.js
import api from './axios';

export const uploadTradeFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  console.log(`Bearer ${Cookies.get('dashboardToken')}`);
  return api.post('/api/v1/trade/upload', formData, {
    // headers: { 'Content-Type': 'multipart/form-data' },
    headers: {
      'Authorization': `Bearer ${Cookies.get('dashboardToken')}`, // Send dashboard token here
    },
  });
};

export const createTrade = (payload) => api.post('/api/v1/trade', payload);
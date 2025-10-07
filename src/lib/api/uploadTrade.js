// lib/api/uploadTrade.js
import api from './axios';

export const uploadTradeFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/api/v1/trade/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const createTrade = (payload) => api.post('/api/v1/trade', payload);
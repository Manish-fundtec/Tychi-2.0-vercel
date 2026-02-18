import api from './axios'; 

export const createSymbol = (payload) => api.post('/api/v1/symbols', payload);
export const getSymbols = () => api.get('/api/v1/symbols');
export const getSymbolsByFundId = async (fundId) => {
  const { data } = await api.get(`/api/v1/symbols/fund/${fundId}`);
  return data; // array or object with data
};
export const getSymbolById = (id) => api.get(`/api/v1/symbols/${id}`);
export const updateSymbol = (id, payload) => api.put(`/api/v1/symbols/${id}`, payload);
export const deleteSymbol = (id) => api.delete(`/api/v1/symbols/${id}`);
export const bulkDeleteSymbols = (symbolIds) => api.post('/api/v1/symbols/bulk-delete', { symbolIds });

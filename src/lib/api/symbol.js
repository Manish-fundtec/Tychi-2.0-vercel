import api from './axios'; 

export const createSymbol = (payload) => api.post('/api/v1/symbols', payload);
export const getSymbols = () => api.get('/api/v1/symbols');
export const getSymbolsByFundId = async (fundId, page = 1, limit = 10) => {
  const { data } = await api.get(`/api/v1/symbols/fund/${fundId}`, {
    params: { page, limit }
  });
  return data; // Should return { data: [], total: number, page: number, limit: number, totalPages: number }
};
export const getSymbolById = (id) => api.get(`/api/v1/symbols/${id}`);
export const updateSymbol = (id, payload) => api.put(`/api/v1/symbols/${id}`, payload);
export const deleteSymbol = (id) => api.delete(`/api/v1/symbols/${id}`);
export const bulkDeleteSymbols = (symbolIds) => api.post('/api/v1/symbols/bulk-delete', { symbolIds });

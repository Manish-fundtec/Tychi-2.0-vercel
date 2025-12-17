import api from './axios'; 

export const createSymbol = (payload) => api.post('/api/v1/symbols', payload);
export const getSymbols = () => api.get('/api/v1/symbols');
export const getSymbolsByFundId = (fundId) => api.get(`/api/v1/symbols/fund/${fundId}`);
export const getSymbolById = (id) => api.get(`/api/v1/symbols/${id}`);
export const updateSymbol = (id, payload) => api.put(`/api/v1/symbols/${id}`, payload);
export const deleteSymbol = (id) => api.delete(`/api/v1/symbols/${id}`);
export const bulkDeleteSymbols = (symbolIds) => api.post('/api/v1/symbols/bulk-delete', { data: { symbolIds } });

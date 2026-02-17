import api from './axios'; 

export const createSymbol = (payload) => api.post('/api/v1/symbols', payload);
export const getSymbols = () => api.get('/api/v1/symbols');
export const getSymbolsByFundId = (fundId, options = {}) => {
  const { page = 1, limit = 100, ...otherParams } = options;
  const params = new URLSearchParams();
  
  // Add pagination parameters
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  
  // Add any other query parameters
  Object.entries(otherParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = `/api/v1/symbols/fund/${fundId}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};
export const getSymbolById = (id) => api.get(`/api/v1/symbols/${id}`);
export const updateSymbol = (id, payload) => api.put(`/api/v1/symbols/${id}`, payload);
export const deleteSymbol = (id) => api.delete(`/api/v1/symbols/${id}`);
export const bulkDeleteSymbols = (symbolIds) => api.post('/api/v1/symbols/bulk-delete', { symbolIds });

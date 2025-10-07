import api from './axios';

// export const getBanks = () => api.get('/api/v1/bank');
export const createBank = (data) => api.post('/api/v1/bank', data);
export const updateBank = (id, data) => api.put(`/api/v1/bank/${id}`, data);
export const deleteBank = (id) => api.delete(`/api/v1/bank/${id}`);
export const getBanks = async (fund_id) => {
  const { data } = await api.get('/api/v1/bank', { params: { fund_id } });
  return data; // array
};

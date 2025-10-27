// src/lib/api/broker.js
import api from './axios'

export const createBroker = async (data) => {
  const res = await api.post('/api/v1/broker', data)
  return res.data
}

// export const getBrokers = () => {
//   return api.get('/api/v1/broker'); // your route
// };
// Read (fund-scoped)
// Usage: getBrokers({ fund_id, limit, offset })
// Read (fund-scoped, simple)
export const getBrokers = async (fund_id) => {
  if (!fund_id) throw new Error('fund_id is required');
  const res = await api.get('/api/v1/broker', { params: { fund_id } });
  // Controller sends an array; return it directly
  return res.data;
};


export const updateBroker = (id, data) => api.put(`api/v1/broker/${id}`, data);
export const deleteBroker = (id) => {
  return api.delete(`/api/v1/broker/${id}`)
}
// export const getBrokersByFundId = (fundId) => api.get('/api/v1/broker', { params: { fund_id: fundId } })

export const getBrokersByFundId = (fundId) => api.get(`/api/v1/broker/fund/${fundId}`);

// ??

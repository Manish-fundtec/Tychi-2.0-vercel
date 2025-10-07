// src/lib/api/exchange.js
import api from './axios'

export const getExchanges = () => api.get('/api/v1/exchange')
export const createExchange = (data) => api.post('/api/v1/exchange', data)
export const updateExchange = (exchange_uid, data) => api.put(`/api/v1/exchange/${exchange_uid}`, data)
export const deleteExchange = (exchange_uid) => api.delete(`/api/v1/exchange/${exchange_uid}`)
export const getExchangesByFundId = (fundId) => api.get(`/api/v1/exchange/fund/${fundId}`)

// import axios from '@/lib/api/axios';
import api from './axios'
import Cookies from 'js-cookie';

export const fetchFunds = async () => {
  const response = await api.get('/api/v1/fund', {
    headers: {
      'Authorization': `Bearer ${Cookies.get('dashboardToken')}`, // Send dashboard token here
    },
    params: { t: Date.now() },
  })
  return response.data
}
export const createFund = async (formData) => {
  const res = await api.post('/api/v1/fund/create', formData)
  return res.data
}

// ✅ CORRECT CODE - USE THIS INSTEAD:
export const getTokenForFund = async (fundId) => {
  const res = await api.post('/api/v1/fund/token', { fundId })
  return res.data
}

// ✅ NEW: Fetch single fund details by ID
export const getFundDetails = async (fundId) => {
  const res = await api.get(`/api/v1/fund/${fundId}`)
  return res.data
}

export const getTradeCount = async (fundId) => {
  const res = await api.get(`/api/v1/fund/tradecount/${encodeURIComponent(fundId)}`)
  return Number(res.data?.count || 0)
}

// Update fund (PUT)
export const updateFund = async (fundId, payload) => {
  const res = await api.put(`/api/v1/fund/${encodeURIComponent(fundId)}`, payload)
  return res.data
}

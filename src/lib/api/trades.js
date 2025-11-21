import api from './axios'
import Cookies from 'js-cookie'

// Tiny safe JWT payload decoder (no external jwt-decode)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export const getAllTrades = async () => {
  // 1) Read token from cookies (client-side)
  const token = Cookies.get('dashboardToken') // or 'userToken' if that’s your source
  if (!token) throw new Error('Missing dashboardToken')

  // 2) Decode fund_id from token (no hooks)
  const payload = decodeJwtPayload(token)
  const fund_id = payload?.fund_id
  if (!fund_id) throw new Error('fund_id not found in token')

  // 3) Hit your backend route
  const res = await api.get(`/api/v1/trade/fund/${fund_id}`)

  // 4) Return an array for AG Grid
  return res?.data?.data ?? []
}

export const deleteTrade = async (trade_id) => {
  if (!trade_id) throw new Error('trade_id is required')
  const res = await api.delete(`/api/v1/trade/${trade_id}`, {
    withCredentials: true, // keep if your backend checks cookies/JWT
  })
  if (!res?.data?.success) {
    throw new Error(res?.data?.message || 'Failed to delete trade')
  }
  return res.data // { success, message, details }
}

// Bulk delete trades - single API call for multiple trades
export const deleteBulkTrades = async (tradeIds) => {
  if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
    throw new Error('tradeIds array is required and must not be empty')
  }
  const res = await api.post(
    '/api/v1/trade/bulk/delete',
    { trade_ids: tradeIds },
    {
      withCredentials: true,
    }
  )
  // Backend should return: { success, message, data: { successful: [], failed: [] } }
  return res.data
}

// NEW: Add trade (POST /api/v1/trade)
export async function addTrade(payload) {
  // Ensure org_id exists (backend requires it)
  // const { org_id: tokenOrgId } = getIdsFromToken()
   // ✅ Make sure token exists
   const token = Cookies.get('dashboardToken');
   console.log('Bearer token:', token);
   
  const body = {
    ...payload,
    org_id: payload.org_id ?? tokenOrgId,
    file_row_no: 1, // always 1 as requested
  }

  const res = await api.post('/api/v1/trade', body, {
    headers: {
      'dashboard': `Bearer ${token}`, // manually attach token
      'Content-Type': 'application/json', // optional but good
    },
  })
  
  if (res?.data?.success === false) {
    throw new Error(res?.data?.message || 'Trade creation failed')
  }
  return res.data
}

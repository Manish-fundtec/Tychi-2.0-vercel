// import axios from '@/lib/api/axios';
import api from './axios'
import { looksEncrypted, decryptPayload } from '@/lib/utils/decrypt'

/**
 * If the API returns { payload: "encrypted..." }, decrypt and return the fund object.
 * Otherwise return data as-is.
 */
function unwrapEncryptedPayload(data) {
  if (!data || typeof data !== 'object') return data
  const raw = data.payload
  if (typeof raw !== 'string' || !looksEncrypted(raw)) return data
  const dec = decryptPayload(raw)
  if (!dec) return data
  // Backend may wrap as { data: fund }; unwrap so form gets { fund_name, fund_id, ... }
  if (dec && typeof dec === 'object' && !Array.isArray(dec) && dec.data != null && typeof dec.data === 'object') {
    const inner = dec.data
    if (inner.fund_id != null || inner.fund_name != null) return inner
  }
  return dec
}


export const fetchFunds = async () => {
  try {
    const response = await api.get('/api/v1/fund', {
      params: { t: Date.now() },
      withCredentials: true,
    })
    
    // Log response for debugging
    if (process.env.NODE_ENV !== 'production') {
      const debugEnc = String(process.env.NEXT_PUBLIC_DEBUG_ENCRYPTION || '').trim() === '1'
      const data = response.data
      const possibleEncryptedFields = ['payload', 'encrypted', 'encryptedPayload', 'cipher', 'ciphertext', 'data']
      const firstEncryptedHit = possibleEncryptedFields.find((k) => looksEncrypted(data?.[k]))

      console.log('📡 fetchFunds API response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: data ? Object.keys(data) : 'no data',
        dataType: typeof data,
        isArray: Array.isArray(data),
        ...(debugEnc
          ? {
              encryptionDebug: true,
              hasPayloadField: typeof data?.payload === 'string',
              payloadLen: typeof data?.payload === 'string' ? data.payload.length : null,
              firstEncryptedField: firstEncryptedHit || null,
            }
          : {}),
      })
    }
    
    return response.data
  } catch (error) {
    console.error('❌ fetchFunds API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    })
    throw error
  }
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
  const unwrapped = unwrapEncryptedPayload(res.data)
  return unwrapped != null ? unwrapped : res.data
}

export const getTradeCount = async (fundId) => {
  const res = await api.get(`/api/v1/fund/tradecount/${encodeURIComponent(fundId)}`)
  return Number(res.data?.count || 0)
}

// Update fund (PUT)
export const updateFund = async (fundId, payload) => {
  const res = await api.put(`/api/v1/fund/${encodeURIComponent(fundId)}`, payload)
  const unwrapped = unwrapEncryptedPayload(res.data)
  return unwrapped != null ? unwrapped : res.data
}

// ✅ Admin: Get all funds (used by Edit Role Select Funds, etc.)
export const getAllFundsAdmin = async () => {
  const res = await api.get('/api/v1/fund/admin/all')
  const unwrapped = unwrapEncryptedPayload(res.data)
  return unwrapped != null ? unwrapped : res.data
}

// ✅ Admin: Get funds by organization
export const getFundsByOrganizationAdmin = async () => {
  const res = await api.get('/api/v1/fund/admin/by-organization')
  const unwrapped = unwrapEncryptedPayload(res.data)
  return unwrapped != null ? unwrapped : res.data
}
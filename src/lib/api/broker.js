// src/lib/api/broker.js
import api from './axios'
import { looksEncrypted, decryptPayload } from '@/lib/utils/decrypt'

export const createBroker = async (data) => {
  const res = await api.post('/api/v1/broker', data)
  return res.data
}

/**
 * If the API returns { payload: "U2FsdGVkX1..." }, decrypt and return the brokers array.
 * Same pattern as bank/fund: middleware encrypts the whole response.
 */
function unwrapEncryptedPayload(data) {
  if (!data || typeof data !== 'object') return null
  const raw = data.payload
  if (typeof raw !== 'string' || !looksEncrypted(raw)) return null
  const dec = decryptPayload(raw)
  if (!dec) return null
  if (Array.isArray(dec)) return dec
  if (dec && typeof dec === 'object' && Array.isArray(dec.data)) return dec.data
  if (dec && typeof dec === 'object' && Array.isArray(dec.brokers)) return dec.brokers
  return dec
}

/**
 * Decrypt broker_name from API when response is plain (BYTEA / encrypted per field).
 * Handles: encrypted string, Buffer-like { type: 'Buffer', data: [...] }, or plain string.
 */
function decryptBrokerName(value) {
  if (value == null) return ''
  if (typeof value === 'string') {
    return looksEncrypted(value) ? (decryptPayload(value) ?? value) : value
  }
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    const base64 = btoa(String.fromCharCode.apply(null, value.data))
    const dec = decryptPayload(base64)
    return dec != null ? (typeof dec === 'string' ? dec : String(dec)) : ''
  }
  return ''
}

/** Normalize list so every broker has decrypted broker_name for UI display. */
function normalizeBrokerNames(list) {
  if (!Array.isArray(list)) return []
  return list.map((b) => ({
    ...b,
    broker_name: decryptBrokerName(b.broker_name) ?? b.broker_name ?? '',
  }))
}

// Read (fund-scoped)
export const getBrokers = async (fund_id) => {
  if (!fund_id) throw new Error('fund_id is required')
  const res = await api.get('/api/v1/broker', { params: { fund_id } })
  const data = res.data

  const unwrapped = unwrapEncryptedPayload(data)
  if (unwrapped != null) {
    const list = Array.isArray(unwrapped) ? unwrapped : []
    return normalizeBrokerNames(list)
  }
  if (!Array.isArray(data)) return data ?? []
  return normalizeBrokerNames(data)
}

export const updateBroker = (id, data) => api.put(`api/v1/broker/${id}`, data)
export const deleteBroker = (id) => {
  return api.delete(`/api/v1/broker/${id}`)
}

export const getBrokersByFundId = async (fundId) => {
  const res = await api.get(`/api/v1/broker/fund/${fundId}`)
  const data = res.data

  const unwrapped = unwrapEncryptedPayload(data)
  if (unwrapped != null) {
    const list = Array.isArray(unwrapped) ? unwrapped : []
    return normalizeBrokerNames(list)
  }
  // Handle axios shape: res.data might be { data: [...] }
  const rawList = Array.isArray(data) ? data : (data?.data ?? [])
  if (!Array.isArray(rawList)) return []
  return normalizeBrokerNames(rawList)
}

// ??

import api from './axios'
import { looksEncrypted, decryptPayload } from '@/lib/utils/decrypt'

// export const getBanks = () => api.get('/api/v1/bank');
export const createBank = (data) => api.post('/api/v1/bank', data)
export const updateBank = (id, data) => api.put(`/api/v1/bank/${id}`, data)
export const deleteBank = (id) => api.delete(`/api/v1/bank/${id}`)

/**
 * If the API returns { payload: "U2FsdGVkX1..." }, decrypt and return the banks array.
 * Same pattern as fund: middleware encrypts the whole response.
 */
function unwrapEncryptedPayload(data) {
  if (!data || typeof data !== 'object') return null
  const raw = data.payload
  if (typeof raw !== 'string' || !looksEncrypted(raw)) return null
  const dec = decryptPayload(raw)
  if (!dec) return null
  if (Array.isArray(dec)) return dec
  if (dec && typeof dec === 'object' && Array.isArray(dec.data)) return dec.data
  if (dec && typeof dec === 'object' && Array.isArray(dec.banks)) return dec.banks
  return dec
}

/**
 * Decrypt bank_name from API when response is plain (legacy BYTEA per field).
 * Handles: encrypted string, Buffer-like { type: 'Buffer', data: [...] }, or plain string.
 */
function decryptBankName(value) {
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

/** Normalize list so every bank has decrypted bank_name for UI display. */
function normalizeBankNames(list) {
  if (!Array.isArray(list)) return []
  return list.map((b) => ({
    ...b,
    bank_name: decryptBankName(b.bank_name) ?? b.bank_name ?? '',
  }))
}

export const getBanks = async (fund_id) => {
  const res = await api.get('/api/v1/bank', { params: { fund_id } })
  const data = res.data

  const unwrapped = unwrapEncryptedPayload(data)
  if (unwrapped != null) {
    const list = Array.isArray(unwrapped) ? unwrapped : []
    return normalizeBankNames(list)
  }

  // Legacy: plain response (no payload or not encrypted)
  if (!Array.isArray(data)) return data ?? []
  return normalizeBankNames(data)
}

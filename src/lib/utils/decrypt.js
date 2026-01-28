import CryptoJS from 'crypto-js'

function isEncryptionDebugEnabled() {
  try {
    return (
      process.env.NODE_ENV !== 'production' &&
      String(process.env.NEXT_PUBLIC_DEBUG_ENCRYPTION || '').trim() === '1'
    )
  } catch {
    return false
  }
}

function safePreview(value, maxLen = 24) {
  if (typeof value !== 'string') return String(value)
  const trimmed = value.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen)}…`
}

// Heuristic only (ELI5): encrypted strings usually look like "random letters/numbers"
// and are much longer than normal IDs/JSON keys.
export function looksEncrypted(value) {
  if (typeof value !== 'string') return false
  const s = value.trim()
  if (s.length < 40) return false
  // CryptoJS AES outputs base64-ish or "Salted__" formats commonly
  const base64ish = /^[A-Za-z0-9+/=]+$/.test(s)
  const salted = s.startsWith('U2FsdGVkX1') || s.startsWith('Salted__')
  return base64ish || salted
}

/**
 * Decrypts an encrypted payload using AES decryption
 * @param {string} encryptedPayload - The encrypted payload string
 * @param {string} secretKey - The decryption key (defaults to env variable)
 * @returns {any} - The decrypted data (parsed as JSON if possible)
 */
export function decryptPayload(encryptedPayload, secretKey = null) {
  try {
    if (!encryptedPayload || typeof encryptedPayload !== 'string') {
      if (isEncryptionDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.debug('[decrypt] invalid payload type', typeof encryptedPayload)
      }
      console.warn('⚠️ Invalid encrypted payload:', encryptedPayload)
      return null
    }

    // Use provided key or fallback to environment variable
    const key = secretKey || process.env.NEXT_PUBLIC_PAYLOAD_KEY
    
    if (!key) {
      console.error('❌ No decryption key found. Set NEXT_PUBLIC_PAYLOAD_KEY in .env.local')
      return null
    }

    if (isEncryptionDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug('[decrypt] input', {
        len: encryptedPayload.length,
        preview: safePreview(encryptedPayload),
        looksEncrypted: looksEncrypted(encryptedPayload),
      })
    }

    // Decrypt using CryptoJS AES
    const decrypted = CryptoJS.AES.decrypt(encryptedPayload, key)
    
    // Convert to UTF-8 string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedString) {
      console.error('❌ Failed to decrypt payload. Invalid key or corrupted data.')
      return null
    }

    if (isEncryptionDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.debug('[decrypt] output', {
        len: decryptedString.length,
        preview: safePreview(decryptedString),
        isJsonLike: decryptedString.trim().startsWith('{') || decryptedString.trim().startsWith('['),
      })
    }

    // Try to parse as JSON
    try {
      return JSON.parse(decryptedString)
    } catch (parseError) {
      // If not JSON, return as string
      console.warn('⚠️ Decrypted payload is not valid JSON, returning as string')
      return decryptedString
    }
  } catch (error) {
    console.error('❌ Error decrypting payload:', error)
    return null
  }
}

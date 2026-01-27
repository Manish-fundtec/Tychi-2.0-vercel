import CryptoJS from 'crypto-js'

/**
 * Decrypts an encrypted payload using AES decryption
 * @param {string} encryptedPayload - The encrypted payload string
 * @param {string} secretKey - The decryption key (defaults to env variable)
 * @returns {any} - The decrypted data (parsed as JSON if possible)
 */
export function decryptPayload(encryptedPayload, secretKey = null) {
  try {
    if (!encryptedPayload || typeof encryptedPayload !== 'string') {
      console.warn('⚠️ Invalid encrypted payload:', encryptedPayload)
      return null
    }

    // Use provided key or fallback to environment variable
    const key = secretKey || process.env.NEXT_PUBLIC_PAYLOAD_KEY
    
    if (!key) {
      console.error('❌ No decryption key found. Set NEXT_PUBLIC_PAYLOAD_KEY in .env.local')
      return null
    }

    // Decrypt using CryptoJS AES
    const decrypted = CryptoJS.AES.decrypt(encryptedPayload, key)
    
    // Convert to UTF-8 string
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedString) {
      console.error('❌ Failed to decrypt payload. Invalid key or corrupted data.')
      return null
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

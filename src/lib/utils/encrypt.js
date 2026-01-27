import CryptoJS from 'crypto-js'

/**
 * Encrypts a payload using AES encryption
 * @param {any} payload - The data to encrypt (object, string, etc.)
 * @param {string} secretKey - The encryption key (defaults to env variable)
 * @returns {string} - The encrypted payload string
 */
export function encryptPayload(payload, secretKey = null) {
  try {
    if (payload === null || payload === undefined) {
      console.warn('⚠️ Invalid payload: null or undefined')
      return null
    }

    // Use provided key or fallback to environment variable
    const key = secretKey || process.env.NEXT_PUBLIC_PAYLOAD_KEY
    
    if (!key) {
      console.error('❌ No encryption key found. Set NEXT_PUBLIC_PAYLOAD_KEY in .env.local')
      return null
    }

    // Convert payload to JSON string if it's an object
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)

    // Encrypt using CryptoJS AES
    const encrypted = CryptoJS.AES.encrypt(payloadString, key).toString()
    
    return encrypted
  } catch (error) {
    console.error('❌ Error encrypting payload:', error)
    return null
  }
}

import * as crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'

// Ensure the key is exactly 32 bytes for AES-256
function getEncryptionKey(): string {
  if (ENCRYPTION_KEY.length === 32) {
    return ENCRYPTION_KEY
  } else if (ENCRYPTION_KEY.length > 32) {
    return ENCRYPTION_KEY.substring(0, 32)
  } else {
    // Pad the key if it's too short
    return ENCRYPTION_KEY.padEnd(32, '0')
  }
}

export async function encrypt(text: string): Promise<string> {
  if (!text) return ''
  
  try {
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(getEncryptionKey(), 'utf8')
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) return ''
  
  try {
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(getEncryptionKey(), 'utf8')
    
    const parts = encryptedData.split(':')
    if (parts.length !== 2) return ''
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

// Simplified encryption for API keys (compatible with existing format)
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  
  try {
    const algorithm = 'aes-256-cbc'
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(apiKey, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    // Return base64 encoded result with IV
    return Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64')
  } catch (error) {
    console.error('API key encryption error:', error)
    return apiKey
  }
}

export function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey) return ''
  
  try {
    const algorithm = 'aes-256-cbc'
    const key = getEncryptionKey()
    
    const combined = Buffer.from(encryptedApiKey, 'base64')
    const iv = combined.subarray(0, 16)
    const encrypted = combined.subarray(16)
    
    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('API key decryption error:', error)
    // Return empty string on decryption failure
    return ''
  }
}
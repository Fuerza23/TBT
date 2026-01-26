import { Keypair } from '@solana/web3.js'
import crypto from 'crypto'

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production!'

/**
 * Generate a new Solana keypair
 */
export function generateKeypair(): { publicKey: string; secretKey: Uint8Array } {
  const keypair = Keypair.generate()
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: keypair.secretKey
  }
}

/**
 * Encrypt a secret key using AES-256-GCM
 */
export function encryptSecretKey(secretKey: Uint8Array): string {
  // Derive a 32-byte key from the encryption key
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12)
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(secretKey)),
    cipher.final()
  ])
  
  // Get auth tag
  const authTag = cipher.getAuthTag()
  
  // Combine iv + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted])
  
  return combined.toString('base64')
}

/**
 * Decrypt a secret key
 */
export function decryptSecretKey(encryptedData: string): Uint8Array {
  // Derive the same key
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  
  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64')
  
  // Extract iv (12 bytes), authTag (16 bytes), and encrypted data
  const iv = combined.subarray(0, 12)
  const authTag = combined.subarray(12, 28)
  const encrypted = combined.subarray(28)
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  
  return new Uint8Array(decrypted)
}

/**
 * Get Keypair from encrypted secret key
 */
export function getKeypairFromEncrypted(encryptedSecretKey: string): Keypair {
  const secretKey = decryptSecretKey(encryptedSecretKey)
  return Keypair.fromSecretKey(secretKey)
}

/**
 * Create and encrypt a new wallet
 */
export function createEncryptedWallet(): { publicKey: string; encryptedSecretKey: string } {
  const { publicKey, secretKey } = generateKeypair()
  const encryptedSecretKey = encryptSecretKey(secretKey)
  
  return { publicKey, encryptedSecretKey }
}

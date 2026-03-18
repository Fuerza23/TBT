import { Keypair } from '@solana/web3.js'
import crypto from 'crypto'

if (!process.env.WALLET_ENCRYPTION_KEY) {
  throw new Error('WALLET_ENCRYPTION_KEY environment variable is required')
}

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY

// Format version byte for new ciphertexts (random salt per encryption)
const FORMAT_VERSION = 0x02

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
 * Encrypt a secret key using AES-256-GCM.
 * Format: [version=0x02 (1B)] [salt (16B)] [iv (12B)] [authTag (16B)] [ciphertext]
 */
export function encryptSecretKey(secretKey: Uint8Array): string {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32)
  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(secretKey)),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([
    Buffer.from([FORMAT_VERSION]),
    salt,
    iv,
    authTag,
    encrypted,
  ])

  return combined.toString('base64')
}

/**
 * Decrypt a secret key.
 * Supports both legacy format (v1: no version byte) and current format (v2: with random salt).
 */
export function decryptSecretKey(encryptedData: string): Uint8Array {
  const combined = Buffer.from(encryptedData, 'base64')

  let key: Buffer
  let iv: Buffer
  let authTag: Buffer
  let encrypted: Buffer

  if (combined[0] === FORMAT_VERSION) {
    // v2 format: [0x02][salt 16B][iv 12B][authTag 16B][ciphertext]
    const salt = combined.subarray(1, 17)
    key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32)
    iv = combined.subarray(17, 29)
    authTag = combined.subarray(29, 45)
    encrypted = combined.subarray(45)
  } else {
    // Legacy v1 format: [iv 12B][authTag 16B][ciphertext]
    key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    iv = combined.subarray(0, 12)
    authTag = combined.subarray(12, 28)
    encrypted = combined.subarray(28)
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

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

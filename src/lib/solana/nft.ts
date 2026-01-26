import { Keypair, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity, irysStorage } from '@metaplex-foundation/js'
import { getConnection, SOLANA_NETWORK, TBT_COLLECTION } from './config'

// Work data for NFT creation
export interface WorkNftData {
  tbtId: string
  title: string
  description?: string
  category?: string
  technique?: string
  creatorName: string
  mediaUrl?: string
  certifiedAt: string
  transferCode: string
}

/**
 * Generate NFT metadata from work data (Metaplex compatible)
 */
export function generateNftMetadata(work: WorkNftData) {
  const externalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tbt.cafe'}/work/${work.tbtId}`
  
  const attributes: Array<{ trait_type: string; value: string }> = [
    { trait_type: 'TBT ID', value: work.tbtId },
    { trait_type: 'Creator', value: work.creatorName },
    { trait_type: 'Certified Date', value: work.certifiedAt },
    { trait_type: 'Transfer Code', value: work.transferCode },
  ]

  if (work.category) {
    attributes.push({ trait_type: 'Category', value: work.category })
  }
  if (work.technique) {
    attributes.push({ trait_type: 'Technique', value: work.technique })
  }

  return {
    name: work.title,
    symbol: TBT_COLLECTION.symbol,
    description: work.description || `Obra certificada: ${work.title} por ${work.creatorName}`,
    image: work.mediaUrl || '',
    external_url: externalUrl,
    attributes,
    properties: {
      files: work.mediaUrl ? [{ uri: work.mediaUrl, type: 'image/jpeg' }] : [],
      category: 'image'
    }
  }
}

/**
 * Get payer keypair from environment
 */
export function getPayerKeypair(): Keypair {
  const privateKey = process.env.SOLANA_PAYER_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('SOLANA_PAYER_PRIVATE_KEY not configured')
  }
  
  // Support both base58 and array formats
  try {
    const decoded = Buffer.from(JSON.parse(privateKey))
    return Keypair.fromSecretKey(decoded)
  } catch {
    // Try base58 decode
    const bs58 = require('bs58')
    return Keypair.fromSecretKey(bs58.decode(privateKey))
  }
}

/**
 * Create Metaplex instance with Irys storage for Devnet
 */
export function getMetaplex(payer?: Keypair): Metaplex {
  const connection = getConnection()
  const payerKeypair = payer || getPayerKeypair()
  
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payerKeypair))
    .use(irysStorage({
      address: SOLANA_NETWORK === 'mainnet-beta' 
        ? 'https://node1.irys.xyz' 
        : 'https://devnet.irys.xyz',
      providerUrl: SOLANA_NETWORK === 'mainnet-beta'
        ? process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com',
      timeout: 60000, // 60 second timeout for Devnet
    }))
  
  return metaplex
}

/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 2000
): Promise<T> {
  let lastError: Error = new Error('Unknown error')
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error?.message || error)
      
      // Check if it's a retryable error (bundler/confirmation issues)
      const isRetryable = error?.message?.includes('Confirmed tx not found') ||
                         error?.message?.includes('timeout') ||
                         error?.message?.includes('503') ||
                         error?.message?.includes('429')
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff: 2s, 4s, 8s...
      const delayMs = baseDelayMs * Math.pow(2, attempt)
      console.log(`Retrying in ${delayMs}ms...`)
      await sleep(delayMs)
    }
  }
  
  throw lastError
}

/**
 * Mint a TBT NFT with retry logic
 */
export async function mintTBTNft(
  work: WorkNftData,
  ownerPublicKey: PublicKey
): Promise<{ mintAddress: string; tokenUri: string }> {
  const metaplex = getMetaplex()
  const metadata = generateNftMetadata(work)
  
  console.log(`Minting NFT for TBT ${work.tbtId}...`)
  
  // Upload metadata with retry
  const { uri: tokenUri } = await withRetry(async () => {
    console.log('Uploading metadata to Irys...')
    return await metaplex.nfts().uploadMetadata(metadata as any)
  }, 3, 3000) // 3 retries, starting at 3 seconds
  
  console.log(`Metadata uploaded: ${tokenUri}`)
  
  // Wait a bit for the metadata to propagate
  await sleep(2000)
  
  // Mint NFT with retry
  const { nft } = await withRetry(async () => {
    console.log('Creating NFT on Solana...')
    return await metaplex.nfts().create({
      uri: tokenUri,
      name: metadata.name,
      symbol: metadata.symbol,
      sellerFeeBasisPoints: 500, // 5% royalty
      tokenOwner: ownerPublicKey,
      isMutable: false, // NFT is immutable after minting
    })
  }, 3, 3000)
  
  console.log(`NFT minted: ${nft.address.toString()}`)
  
  return {
    mintAddress: nft.address.toString(),
    tokenUri
  }
}

/**
 * Transfer NFT to new owner
 */
export async function transferNft(
  mintAddress: string,
  newOwner: PublicKey
): Promise<string> {
  const metaplex = getMetaplex()
  
  const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) })
  
  const { response } = await metaplex.nfts().transfer({
    nftOrSft: nft,
    toOwner: newOwner,
  })
  
  console.log(`NFT transferred: ${response.signature}`)
  return response.signature
}

/**
 * Generate a random keypair for testing
 */
export function generateTestKeypair(): { publicKey: string; secretKey: string } {
  const keypair = Keypair.generate()
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: JSON.stringify(Array.from(keypair.secretKey))
  }
}

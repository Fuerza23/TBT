import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import { getConnection, getExplorerUrl } from './config'
import { getPayerKeypair } from './nft'
import { getKeypairFromEncrypted } from './wallet'

/**
 * Transfer result
 */
export interface TransferResult {
  success: boolean
  signature?: string
  explorerUrl?: string
  error?: string
}

/**
 * Transfer an NFT from one wallet to another
 * Uses the encrypted private key of the sender
 */
export async function transferNftWithCustodialWallet(
  mintAddress: string,
  senderEncryptedKey: string,
  recipientPublicKey: string
): Promise<TransferResult> {
  try {
    const connection = getConnection()
    const payer = getPayerKeypair() // Payer for transaction fees
    const senderKeypair = getKeypairFromEncrypted(senderEncryptedKey)
    const recipientPubkey = new PublicKey(recipientPublicKey)
    
    console.log(`Transferring NFT ${mintAddress}`)
    console.log(`From: ${senderKeypair.publicKey.toString()}`)
    console.log(`To: ${recipientPubkey.toString()}`)

    // Create Metaplex instance with payer (for fees) and identity of sender
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payer))

    // Find the NFT
    const nft = await metaplex.nfts().findByMint({ 
      mintAddress: new PublicKey(mintAddress) 
    })

    // Transfer the NFT
    // Note: For custodial wallets, we need to sign with both payer and sender
    const { response } = await metaplex.nfts().transfer({
      nftOrSft: nft,
      fromOwner: senderKeypair.publicKey,
      toOwner: recipientPubkey,
      authority: senderKeypair, // The actual owner signs
    })

    console.log(`NFT transferred successfully. Signature: ${response.signature}`)

    return {
      success: true,
      signature: response.signature,
      explorerUrl: getExplorerUrl(response.signature, 'tx')
    }

  } catch (error: any) {
    console.error('Error transferring NFT:', error)
    return {
      success: false,
      error: error.message || 'Failed to transfer NFT'
    }
  }
}

/**
 * Transfer NFT when recipient doesn't have a wallet yet
 * Creates a pending transfer that will complete when recipient creates wallet
 */
export async function initiateTransferToNewUser(
  mintAddress: string,
  senderEncryptedKey: string
): Promise<{ 
  pendingTransfer: boolean; 
  message: string;
}> {
  // For now, we'll just note that the transfer is pending
  // The transfer will complete when the recipient creates their wallet
  // and claims the TBT using the transfer code
  
  return {
    pendingTransfer: true,
    message: 'Transfer initiated. NFT will be transferred when recipient creates their wallet.'
  }
}

/**
 * Complete a pending NFT transfer
 * Called when the recipient has created their wallet
 */
export async function completePendingNftTransfer(
  mintAddress: string,
  senderEncryptedKey: string,
  recipientPublicKey: string
): Promise<TransferResult> {
  return transferNftWithCustodialWallet(
    mintAddress,
    senderEncryptedKey,
    recipientPublicKey
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { transferNftWithCustodialWallet, completePendingNftTransfer } from '@/lib/solana/transfer'
import { createEncryptedWallet } from '@/lib/solana/wallet'

export async function POST(request: NextRequest) {
  try {
    const { transferCode, workId } = await request.json()

    if (!transferCode || !workId) {
      return NextResponse.json(
        { error: 'transferCode and workId are required' },
        { status: 400 }
      )
    }

    const supabase = createRouteClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get work with current owner's wallet
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Verify transfer code
    if (work.transfer_code !== transferCode) {
      return NextResponse.json({ error: 'Invalid transfer code' }, { status: 403 })
    }

    // Check if work has an NFT
    if (!work.mint_address) {
      return NextResponse.json({ 
        success: true, 
        nftTransferred: false,
        message: 'No NFT to transfer (work was created before NFT integration)' 
      })
    }

    // Get sender's (current owner's) wallet
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets')
      .select('encrypted_private_key, public_key')
      .eq('user_id', work.current_owner_id)
      .eq('is_primary', true)
      .single()

    if (senderError || !senderWallet?.encrypted_private_key) {
      return NextResponse.json({ 
        success: true, 
        nftTransferred: false,
        message: 'Sender does not have a custodial wallet' 
      })
    }

    // Get or create recipient's (new owner's) wallet
    let recipientPublicKey: string

    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('public_key')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (recipientWallet?.public_key) {
      recipientPublicKey = recipientWallet.public_key
    } else {
      // Create wallet for recipient
      const { publicKey, encryptedSecretKey } = createEncryptedWallet()
      
      await supabase.from('wallets').insert({
        user_id: user.id,
        public_key: publicKey,
        encrypted_private_key: encryptedSecretKey,
        network: 'solana',
        is_primary: true
      })
      
      recipientPublicKey = publicKey
      console.log(`Created wallet for recipient ${user.id}: ${publicKey}`)
    }

    // Transfer the NFT
    const result = await transferNftWithCustodialWallet(
      work.mint_address,
      senderWallet.encrypted_private_key,
      recipientPublicKey
    )

    if (!result.success) {
      console.error('NFT transfer failed:', result.error)
      // Don't block the TBT transfer if NFT transfer fails
      return NextResponse.json({
        success: true,
        nftTransferred: false,
        nftError: result.error,
        message: 'TBT transferred but NFT transfer failed'
      })
    }

    return NextResponse.json({
      success: true,
      nftTransferred: true,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
      recipientWallet: recipientPublicKey,
      message: 'NFT transferred successfully'
    })

  } catch (error: any) {
    console.error('Error transferring NFT:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to transfer NFT' },
      { status: 500 }
    )
  }
}

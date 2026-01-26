import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { PublicKey } from '@solana/web3.js'
import { mintTBTNft, WorkNftData, getExplorerUrl } from '@/lib/solana'

export async function POST(request: NextRequest) {
  try {
    const { workId } = await request.json()

    if (!workId) {
      return NextResponse.json({ error: 'workId is required' }, { status: 400 })
    }

    const supabase = createRouteClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get work with creator info
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        *,
        creator:profiles!works_creator_id_fkey(display_name)
      `)
      .eq('id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Verify user owns this work
    if (work.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to mint this work' }, { status: 403 })
    }

    // Check if already minted
    if (work.mint_address) {
      return NextResponse.json({
        mintAddress: work.mint_address,
        tokenUri: work.token_uri,
        explorerUrl: getExplorerUrl(work.mint_address),
        message: 'Already minted'
      })
    }

    // Get or create wallet for user
    let ownerPublicKey: PublicKey

    // Check if user has a wallet
    const { data: userWallet } = await supabase
      .from('wallets')
      .select('public_key')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (userWallet?.public_key) {
      ownerPublicKey = new PublicKey(userWallet.public_key)
    } else {
      // Create wallet for user
      const { createEncryptedWallet } = await import('@/lib/solana/wallet')
      const { publicKey, encryptedSecretKey } = createEncryptedWallet()
      
      await supabase.from('wallets').insert({
        user_id: user.id,
        public_key: publicKey,
        encrypted_private_key: encryptedSecretKey,
        network: 'solana',
        is_primary: true
      })
      
      ownerPublicKey = new PublicKey(publicKey)
      console.log(`Created wallet for user ${user.id}: ${publicKey}`)
    }

    // Prepare work data for NFT
    const workNftData: WorkNftData = {
      tbtId: work.tbt_id,
      title: work.title,
      description: work.description,
      category: work.category,
      technique: work.technique,
      creatorName: work.creator?.display_name || 'Unknown Artist',
      mediaUrl: work.media_url,
      certifiedAt: new Date(work.certified_at || work.created_at).toISOString().split('T')[0],
      transferCode: work.transfer_code || 'N/A'
    }

    // Mint NFT
    const { mintAddress, tokenUri } = await mintTBTNft(workNftData, ownerPublicKey)

    // Update work with mint info
    await supabase
      .from('works')
      .update({
        mint_address: mintAddress,
        token_uri: tokenUri,
        blockchain: 'solana',
        nft_status: 'minted'
      })
      .eq('id', workId)

    return NextResponse.json({
      success: true,
      mintAddress,
      tokenUri,
      explorerUrl: getExplorerUrl(mintAddress),
      message: 'NFT minted successfully'
    })

  } catch (error: any) {
    console.error('Error minting NFT:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mint NFT' },
      { status: 500 }
    )
  }
}

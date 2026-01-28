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

    // Get work with creator info, context, and commerce data
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        *,
        creator:profiles!works_creator_id_fkey(display_name, public_alias),
        context:context_snapshots(location_name, weather_data, elaboration_type),
        commerce:work_commerce(initial_price, currency, royalty_type, royalty_value)
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

    // Get creator name (prefer public_alias)
    const creatorData = work.creator as any
    const creatorName = creatorData?.public_alias || creatorData?.display_name || 'Unknown Artist'

    // Get context data (first entry)
    const contextData = Array.isArray(work.context) ? work.context[0] : work.context
    const weatherData = contextData?.weather_data as any

    // Get commerce data (first entry)
    const commerceData = Array.isArray(work.commerce) ? work.commerce[0] : work.commerce

    // Prepare work data for NFT with complete provenance
    const workNftData: WorkNftData = {
      tbtId: work.tbt_id,
      title: work.title,
      description: work.description,
      category: work.category,
      technique: work.technique,
      creatorName,
      mediaUrl: work.media_url,
      certifiedAt: new Date(work.certified_at || work.created_at).toISOString().split('T')[0],
      transferCode: work.transfer_code || 'N/A',
      // Context and provenance data
      creationLocation: contextData?.location_name,
      creationWeather: weatherData?.conditions,
      elaborationType: contextData?.elaboration_type,
      // Commerce data
      marketPrice: commerceData?.initial_price,
      currency: commerceData?.currency || 'USD',
      royaltyPercentage: commerceData?.royalty_type === 'percentage' 
        ? commerceData?.royalty_value 
        : undefined,
      // Initial transfer history (creation event)
      transferHistory: [{
        type: 'creation' as const,
        date: new Date(work.certified_at || work.created_at).toISOString().split('T')[0],
        toName: creatorName,
      }]
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

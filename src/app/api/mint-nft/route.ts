import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { createServiceClient } from '@/lib/supabase-service'
import { mintTBTNft, WorkNftData } from '@/lib/solana/nft'
import { getExplorerUrl } from '@/lib/solana/config'

export async function POST(request: NextRequest) {
  try {
    const { workId } = await request.json()

    if (!workId) {
      return NextResponse.json({ error: 'workId is required' }, { status: 400 })
    }

    const supabase = createRouteClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (work.creator_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to mint this work' }, { status: 403 })
    }

    if (work.mint_address) {
      return NextResponse.json({
        mintAddress: work.mint_address,
        tokenUri: work.token_uri,
        explorerUrl: getExplorerUrl(work.mint_address),
        message: 'Already minted'
      })
    }

    const creatorData = work.creator as any
    const creatorName = creatorData?.public_alias || creatorData?.display_name || 'Unknown Artist'

    const contextData = Array.isArray(work.context) ? work.context[0] : work.context
    const weatherData = contextData?.weather_data as any
    const commerceData = Array.isArray(work.commerce) ? work.commerce[0] : work.commerce

    const certDate = new Date(work.certified_at || work.created_at).toISOString().split('T')[0]

    const workNftData: WorkNftData = {
      tbtId: work.tbt_id,
      title: work.title,
      description: work.description,
      category: work.category,
      technique: work.technique,
      creatorName,
      mediaUrl: work.media_url,
      certifiedAt: certDate,
      transferCode: work.transfer_code || 'N/A',
      creationLocation: contextData?.location_name,
      creationWeather: weatherData?.conditions,
      elaborationType: contextData?.elaboration_type,
      marketPrice: commerceData?.initial_price,
      currency: commerceData?.currency || 'USD',
      royaltyPercentage: commerceData?.royalty_type === 'percentage'
        ? commerceData?.royalty_value
        : undefined,
      transferHistory: [{
        type: 'creation' as const,
        date: certDate,
        toName: creatorName,
      }]
    }

    const { mintAddress, tokenUri } = await mintTBTNft(workNftData)

    await supabase
      .from('works')
      .update({
        mint_address: mintAddress,
        token_uri: tokenUri,
        blockchain: 'solana',
        nft_status: 'minted'
      })
      .eq('id', workId)

    // Record first owner in ownership_history.
    // Service-role write: ownership_history is the immutable provenance
    // chain (RLS: public read, service-role-only writes).
    await createServiceClient().from('ownership_history').insert({
      work_id: workId,
      owner_name: creatorName,
      owner_user_id: user.id,
      event_type: 'creation',
      sequence_number: 1,
    })

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

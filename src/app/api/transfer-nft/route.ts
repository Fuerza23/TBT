import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { updateNftMetadata, WorkNftData, TransferHistoryEntry } from '@/lib/solana/nft'
import { getExplorerUrl } from '@/lib/solana/config'

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

    if (work.transfer_code !== transferCode) {
      return NextResponse.json({ error: 'Invalid transfer code' }, { status: 403 })
    }

    // Only the current owner can trigger NFT metadata updates
    if (work.current_owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: not the current owner' }, { status: 403 })
    }

    if (!work.mint_address) {
      return NextResponse.json({
        success: true,
        nftUpdated: false,
        message: 'No NFT to update (work was created before NFT integration)'
      })
    }

    // Build transfer history from ownership_history table
    const { data: fullHistory } = await supabase
      .from('ownership_history')
      .select('*')
      .eq('work_id', workId)
      .order('sequence_number', { ascending: true })

    const transferHistory: TransferHistoryEntry[] = (fullHistory || []).map(entry => ({
      type: entry.event_type as 'creation' | 'transfer',
      date: new Date(entry.created_at).toISOString().split('T')[0],
      fromName: entry.previous_owner_name || undefined,
      toName: entry.owner_name,
      transferType: entry.transfer_type as 'sale' | 'gift' | undefined,
      price: entry.price ? String(entry.price) : undefined,
      currency: entry.currency || undefined,
    }))

    const creatorData = work.creator as any
    const creatorName = creatorData?.public_alias || creatorData?.display_name || 'Unknown Artist'

    const contextData = Array.isArray(work.context) ? work.context[0] : work.context
    const weatherData = contextData?.weather_data as any
    const commerceData = Array.isArray(work.commerce) ? work.commerce[0] : work.commerce

    const updatedWorkData: WorkNftData = {
      tbtId: work.tbt_id,
      title: work.title,
      description: work.description,
      category: work.category,
      technique: work.technique,
      creatorName,
      mediaUrl: work.media_url,
      certifiedAt: new Date(work.certified_at || work.created_at).toISOString().split('T')[0],
      transferCode: work.transfer_code || 'N/A',
      creationLocation: contextData?.location_name,
      creationWeather: weatherData?.conditions,
      elaborationType: contextData?.elaboration_type,
      marketPrice: commerceData?.initial_price,
      currency: commerceData?.currency || 'USD',
      royaltyPercentage: commerceData?.royalty_type === 'percentage'
        ? commerceData?.royalty_value
        : undefined,
      transferHistory,
    }

    await updateNftMetadata(work.mint_address, updatedWorkData)

    return NextResponse.json({
      success: true,
      nftUpdated: true,
      explorerUrl: getExplorerUrl(work.mint_address),
      message: 'NFT metadata updated successfully with ownership history'
    })

  } catch (error: any) {
    console.error('Error updating NFT metadata:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update NFT metadata' },
      { status: 500 }
    )
  }
}

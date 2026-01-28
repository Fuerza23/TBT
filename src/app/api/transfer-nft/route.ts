import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { transferNftWithCustodialWallet, completePendingNftTransfer } from '@/lib/solana/transfer'
import { createEncryptedWallet } from '@/lib/solana/wallet'
import { updateNftMetadata, WorkNftData, TransferHistoryEntry } from '@/lib/solana/nft'

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

    // Get work with current owner's wallet and related data
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        *,
        creator:profiles!works_creator_id_fkey(display_name, public_alias),
        current_owner:profiles!works_current_owner_id_fkey(display_name, public_alias),
        context:context_snapshots(location_name, weather_data, elaboration_type),
        commerce:work_commerce(initial_price, currency, royalty_type, royalty_value)
      `)
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

    // Update NFT metadata with transfer history
    try {
      // Get recipient's profile
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('display_name, public_alias')
        .eq('id', user.id)
        .single()

      // Get complete transfer history
      const { data: transfers } = await supabase
        .from('transfers')
        .select(`
          id,
          transfer_type,
          transfer_amount,
          created_at,
          from_user:profiles!transfers_from_user_id_fkey(display_name, public_alias),
          to_user:profiles!transfers_to_user_id_fkey(display_name, public_alias)
        `)
        .eq('work_id', workId)
        .order('created_at', { ascending: true })

      // Build transfer history
      const creatorData = work.creator as any
      const creatorName = creatorData?.public_alias || creatorData?.display_name || 'Unknown Artist'
      
      const transferHistory: TransferHistoryEntry[] = [{
        type: 'creation',
        date: new Date(work.certified_at || work.created_at).toISOString().split('T')[0],
        toName: creatorName,
      }]

      // Add all transfers
      if (transfers) {
        for (const transfer of transfers) {
          const fromUserData = transfer.from_user as any
          const toUserData = transfer.to_user as any
          
          transferHistory.push({
            type: 'transfer',
            date: new Date(transfer.created_at).toISOString().split('T')[0],
            fromName: fromUserData?.public_alias || fromUserData?.display_name || 'Unknown',
            toName: toUserData?.public_alias || toUserData?.display_name || 'Unknown',
            transferType: transfer.transfer_type === 'sale' ? 'sale' : 'gift',
            price: transfer.transfer_amount?.toString(),
            currency: 'USD',
          })
        }
      }

      // Add current transfer
      const currentOwnerData = work.current_owner as any
      const recipientName = recipientProfile?.public_alias || recipientProfile?.display_name || 'Unknown'
      
      transferHistory.push({
        type: 'transfer',
        date: new Date().toISOString().split('T')[0],
        fromName: currentOwnerData?.public_alias || currentOwnerData?.display_name || 'Unknown',
        toName: recipientName,
        transferType: 'sale', // Assume sale for now, can be passed as parameter
      })

      // Get context and commerce data
      const contextData = Array.isArray(work.context) ? work.context[0] : work.context
      const weatherData = (contextData?.weather_data as any)
      const commerceData = Array.isArray(work.commerce) ? work.commerce[0] : work.commerce

      // Update NFT metadata
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
      console.log('NFT metadata updated with transfer history')
    } catch (metadataError) {
      console.warn('Failed to update NFT metadata (non-blocking):', metadataError)
    }

    return NextResponse.json({
      success: true,
      nftTransferred: true,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
      recipientWallet: recipientPublicKey,
      message: 'NFT transferred successfully with updated history'
    })

  } catch (error: any) {
    console.error('Error transferring NFT:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to transfer NFT' },
      { status: 500 }
    )
  }
}

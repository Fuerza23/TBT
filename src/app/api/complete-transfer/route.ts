import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { stripe } from '@/lib/stripe'
import { processTransferOnChain } from '@/lib/solana/transfer'
import { TransferHistoryEntry } from '@/lib/solana/nft'
import { generateTransferCode } from '@/lib/transfer-code'
import { isProduction } from '@/lib/app-env'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { transferId, sessionId } = requestBody

    if (!transferId) {
      return NextResponse.json({ error: 'transferId is required' }, { status: 400 })
    }

    const supabase = createRouteClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select('*, work:works(*)')
      .eq('id', transferId)
      .single()

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Only the transfer initiator (seller/owner) can complete it
    if (transfer.from_owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check payment status with fallback to Stripe verification
    if (transfer.payment_status !== 'completed') {
      const { couponCode } = requestBody
      let paymentBypassed = false

      if (!isProduction && couponCode && couponCode.trim().toUpperCase() === 'TBT') {
        paymentBypassed = true
        console.log('Payment bypassed with dev coupon:', couponCode)

        await supabase
          .from('transfers')
          .update({
            payment_status: 'completed',
            payment_reference: 'coupon:TBT'
          })
          .eq('id', transferId)

        transfer.payment_status = 'completed'
      }

      if (!paymentBypassed) {
        const stripeSessionId = requestBody.sessionId || transfer.stripe_checkout_session_id

        let verified = false
        if (stripeSessionId) {
          try {
            console.log('Verifying payment with Stripe for session:', stripeSessionId)
            const session = await stripe.checkout.sessions.retrieve(stripeSessionId)
            if (session.payment_status === 'paid') {
              verified = true
              await supabase
                .from('transfers')
                .update({
                  payment_status: 'completed',
                  payment_reference: session.payment_intent as string,
                  stripe_checkout_session_id: stripeSessionId
                })
                .eq('id', transferId)

              transfer.payment_status = 'completed'
              console.log('Payment verified via Stripe API')
            }
          } catch (stripeError) {
            console.error('Error verifying Stripe session:', stripeError)
          }
        }

        if (!verified) {
          return NextResponse.json({
            error: `Payment not completed. Current status: ${transfer.payment_status}`
          }, { status: 400 })
        }
      }
    }

    // Check if already processed (only when to_owner_id is set)
    if (transfer.to_owner_id && transfer.work.current_owner_id === transfer.to_owner_id) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        tbtId: transfer.work.tbt_id,
        workTitle: transfer.work.title,
      })
    }
    // Also check by transfer status
    if (transfer.work.transfer_status === 'transferred' && transfer.work.transferred_at) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        tbtId: transfer.work.tbt_id,
        workTitle: transfer.work.title,
      })
    }

    console.log('Completing transfer:', transferId)

    // Update work ownership in Supabase
    // When to_owner_id is null (owner-initiated transfer), keep current_owner_id as from_owner_id
    const { error: updateError } = await supabase
      .from('works')
      .update({
        current_owner_id: transfer.to_owner_id || transfer.from_owner_id,
        transfer_status: 'transferred',
        transferred_at: new Date().toISOString(),
      })
      .eq('id', transfer.work_id)

    if (updateError) {
      throw updateError
    }

    // Generate new transfer code for the new owner
    const newTransferCode = generateTransferCode()

    await supabase
      .from('works')
      .update({
        transfer_code: newTransferCode,
        transfer_status: 'active',
      })
      .eq('id', transfer.work_id)

    // Get the current sequence number for this work
    const { count: historyCount } = await supabase
      .from('ownership_history')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', transfer.work_id)

    const sequenceNumber = (historyCount || 0) + 1

    // Build the new owner name from the transfer form
    const newOwnerName = transfer.new_owner_name || 'Unknown'
    const previousOwnerName = transfer.from_owner_name || 'Unknown'

    // Record in ownership_history
    await supabase.from('ownership_history').insert({
      work_id: transfer.work_id,
      owner_name: newOwnerName,
      owner_user_id: transfer.to_owner_id,
      event_type: 'transfer',
      previous_owner_name: previousOwnerName,
      transfer_type: transfer.transfer_type || 'sale',
      price: transfer.payment_amount || null,
      currency: transfer.payment_currency || 'USD',
      sequence_number: sequenceNumber,
    })

    // Update NFT metadata on-chain with the new owner and history
    let solscanUrl = ''
    let nftUpdated = false

    if (transfer.work.mint_address) {
      try {
        console.log('Updating on-chain metadata for mint:', transfer.work.mint_address)

        // Build full transfer history from Supabase
        const { data: fullHistory } = await supabase
          .from('ownership_history')
          .select('*')
          .eq('work_id', transfer.work_id)
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

        // Get creator info for metadata
        const { data: workWithCreator } = await supabase
          .from('works')
          .select(`
            *,
            creator:profiles!works_creator_id_fkey(display_name, public_alias),
            context:context_snapshots(location_name, weather_data, elaboration_type),
            commerce:work_commerce(initial_price, currency, royalty_type, royalty_value)
          `)
          .eq('id', transfer.work_id)
          .single()

        if (workWithCreator) {
          const creatorInfo = workWithCreator.creator as any
          const creatorName = creatorInfo?.public_alias || creatorInfo?.display_name || 'Unknown Artist'
          const ctxData = Array.isArray(workWithCreator.context) ? workWithCreator.context[0] : workWithCreator.context
          const commData = Array.isArray(workWithCreator.commerce) ? workWithCreator.commerce[0] : workWithCreator.commerce
          const weatherInfo = ctxData?.weather_data as any

          const updatedWorkData = {
            tbtId: workWithCreator.tbt_id,
            title: workWithCreator.title,
            description: workWithCreator.description,
            category: workWithCreator.category,
            technique: workWithCreator.technique,
            creatorName,
            mediaUrl: workWithCreator.media_url,
            certifiedAt: new Date(workWithCreator.certified_at || workWithCreator.created_at).toISOString().split('T')[0],
            transferCode: newTransferCode,
            creationLocation: ctxData?.location_name,
            creationWeather: weatherInfo?.conditions,
            elaborationType: ctxData?.elaboration_type,
            marketPrice: commData?.initial_price,
            currency: commData?.currency || 'USD',
            royaltyPercentage: commData?.royalty_type === 'percentage' ? commData?.royalty_value : undefined,
            transferHistory,
          }

          const result = await processTransferOnChain(
            transfer.work.mint_address,
            updatedWorkData
          )

          if (result.success) {
            solscanUrl = result.explorerUrl || ''
            nftUpdated = true

            if (result.newTokenUri) {
              await supabase
                .from('works')
                .update({ token_uri: result.newTokenUri })
                .eq('id', transfer.work_id)
            }

            console.log('NFT metadata updated successfully')
          } else {
            console.error('NFT metadata update failed:', result.error)
          }
        }
      } catch (nftError) {
        console.error('Error during NFT metadata update:', nftError)
      }
    }

    // Create certificate snapshot for new owner
    await supabase.from('certificates').insert({
      work_id: transfer.work_id,
      owner_id: transfer.to_owner_id,
      qr_code_data: `${process.env.NEXT_PUBLIC_APP_URL}/work/${transfer.work.tbt_id}`,
      version: 1,
    })

    return NextResponse.json({
      success: true,
      tbtId: transfer.work.tbt_id,
      workTitle: transfer.work.title,
      newOwnerName,
      solscanUrl,
      nftUpdated,
      mintAddress: transfer.work.mint_address
    })

  } catch (error: any) {
    console.error('Error completing transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { createServiceClient } from '@/lib/supabase-service'
import { generateTransferCode } from '@/lib/transfer-code'
import { isProduction } from '@/lib/app-env'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { workId, couponCode, sessionId } = await request.json()
    console.log('Complete TBT request for workId:', workId)

    if (!workId) {
      return NextResponse.json({ error: 'workId is required' }, { status: 400 })
    }

    const supabase = createRouteClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('Authenticated user:', user.id)

    // Get the work with its stored form data
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('*')
      .eq('id', workId)
      .eq('creator_id', user.id)
      .single()

    console.log('Work query result:', { workId: work?.id, error: workError?.message })

    if (workError) {
      console.error('Work query error:', workError)
      return NextResponse.json({ 
        error: `Work not found: ${workError.message}`,
        details: workError 
      }, { status: 404 })
    }

    if (!work) {
      return NextResponse.json({ error: 'Work not found (null)' }, { status: 404 })
    }

    // Check if payment is completed OR if a valid free coupon is provided
    let paymentBypassed = false;
    
    // TBT coupon only valid outside production
    if (!isProduction && couponCode && couponCode.trim().toUpperCase() === 'TBT') {
       paymentBypassed = true
       console.log('Payment bypassed with dev coupon:', couponCode)
    }

    console.log('Work payment status:', work.payment_status)

    // If payment not yet confirmed by webhook, verify directly with Stripe
    if (!paymentBypassed && work.payment_status !== 'completed') {
      const stripeSessionId = sessionId || work.payment_intent_id
      let verified = false

      if (stripeSessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(stripeSessionId)
          if (session.payment_status === 'paid') {
            verified = true
            await supabase
              .from('works')
              .update({ payment_status: 'completed' })
              .eq('id', workId)
            work.payment_status = 'completed'
            console.log('Payment verified directly with Stripe')
          }
        } catch (stripeError) {
          console.error('Error verifying Stripe session:', stripeError)
        }
      }

      if (!verified) {
        return NextResponse.json({
          error: `Payment not completed. Current status: ${work.payment_status}`
        }, { status: 400 })
      }
    }

    // Check if already finalized (has tbt_id means already processed)
    if (work.tbt_id && work.status === 'certified') {
      console.log('Work already certified:', work.tbt_id)
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        tbtId: work.tbt_id,
        workTitle: work.title,
      })
    }

    const formData = work.context_data || {}
    const creatorData = formData.creatorData || {}
    const commProData = formData.commProData || {}
    const contextData = formData.contextData || {}

    console.log('Starting TBT completion process...')

    // Update profile with creator data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        creator_type: creatorData.creatorType || 'individual',
        legal_name: creatorData.legalName || null,
        public_alias: creatorData.publicAlias || null,
        collective_name: creatorData.collectiveName || null,
        lead_representative: creatorData.leadRepresentative || null,
        entity_name: creatorData.entityName || null,
        tax_id: creatorData.taxId || null,
        corporate_title: creatorData.corporateTitle || null,
        credentials: creatorData.credentials || null,
        social_linkedin: creatorData.socialLinkedin || null,
        social_website: creatorData.socialWebsite || null,
        social_instagram: creatorData.socialInstagram || null,
        social_facebook: creatorData.socialFacebook || null,
        social_youtube: creatorData.socialYoutube || null,
        social_other: creatorData.socialOther ? [creatorData.socialOther] : null,
        bio: creatorData.aboutCreator || null,
        email: creatorData.email || null,
      })
      .eq('id', user.id)
    
    if (profileError) {
      console.warn('Profile update error:', profileError)
    }

    // Generate transfer code and update work to certified
    const transferCode = generateTransferCode()
    
    const { error: workUpdateError } = await supabase
      .from('works')
      .update({
        status: 'certified',
        certified_at: new Date().toISOString(),
        transfer_code: transferCode,
        transfer_status: 'active',
        context_summary: contextData.userEditedSummary || contextData.aiSummary || null,
        context_signed_at: contextData.isSigned ? new Date().toISOString() : null,
        originality_type: commProData.originalityDeclaration || 'original',
        original_work_reference: commProData.derivativeReference || null,
        signature_phone: contextData.signaturePhone || null,
      })
      .eq('id', workId)

    if (workUpdateError) {
      console.error('Work update error:', workUpdateError)
      return NextResponse.json({ error: 'Failed to update work status' }, { status: 500 })
    }

    console.log('Work updated to certified')

    // Create work_commerce record
    const { error: commerceError } = await supabase
      .from('work_commerce')
      .upsert({
        work_id: workId,
        initial_price: commProData.marketPrice ? parseFloat(commProData.marketPrice) : 0,
        currency: commProData.currency || 'USD',
        royalty_type: commProData.royaltyType === 'none' ? null : commProData.royaltyType,
        royalty_value: commProData.royaltyType !== 'none' ? parseFloat(commProData.royaltyValue || '0') : 0,
        is_for_sale: true,
      }, { onConflict: 'work_id' })

    if (commerceError) {
      console.warn('Commerce insert error:', commerceError)
    }

    // Create context_snapshot record
    const { error: contextError } = await supabase
      .from('context_snapshots')
      .insert({
        work_id: workId,
        location_name: contextData.location || null,
        gps_coordinates: contextData.coordinates || null,
        weather_data: contextData.weather ? { conditions: contextData.weather } : null,
        top_headlines: contextData.headlines || null,
        ai_summary: contextData.aiSummary || null,
        user_edited_summary: contextData.userEditedSummary || null,
        signed_at: contextData.isSigned ? new Date().toISOString() : null,
      })

    if (contextError) {
      console.warn('Context snapshot insert error:', contextError)
    }

    // Get updated work to retrieve tbt_id
    const { data: updatedWork } = await supabase
      .from('works')
      .select('tbt_id')
      .eq('id', workId)
      .single()

    // Create certificate record
    const { error: certError } = await supabase
      .from('certificates')
      .insert({
        work_id: workId,
        owner_id: user.id,
        qr_code_data: `${process.env.NEXT_PUBLIC_APP_URL}/work/${updatedWork?.tbt_id || workId}`,
        version: 1,
      })

    if (certError) {
      console.warn('Certificate insert error:', certError)
    }

    console.log('TBT certified with ID:', updatedWork?.tbt_id)

    // Mint NFT on Solana — single-wallet model (project wallet owns all NFTs)
    let mintAddress = ''
    let solscanUrl = ''
    
    try {
      const { mintTBTNft } = await import('@/lib/solana/nft')
      const { getExplorerUrl } = await import('@/lib/solana/config')
      
      const { data: workWithCreator } = await supabase
        .from('works')
        .select(`
          *,
          creator:profiles!works_creator_id_fkey(display_name, public_alias),
          context:context_snapshots(location_name, weather_data, elaboration_type),
          commerce:work_commerce(initial_price, currency, royalty_type, royalty_value)
        `)
        .eq('id', workId)
        .single()
      
      if (workWithCreator && !workWithCreator.mint_address) {
        const creatorInfo = workWithCreator.creator as any
        const creatorName = creatorInfo?.public_alias || creatorInfo?.display_name || 'Unknown Artist'
        
        const ctxData = Array.isArray(workWithCreator.context) ? workWithCreator.context[0] : workWithCreator.context
        const commData = Array.isArray(workWithCreator.commerce) ? workWithCreator.commerce[0] : workWithCreator.commerce
        const weatherInfo = ctxData?.weather_data as any
        
        const certDate = new Date(workWithCreator.certified_at || workWithCreator.created_at).toISOString().split('T')[0]
        
        const workNftData = {
          tbtId: workWithCreator.tbt_id || updatedWork?.tbt_id,
          title: workWithCreator.title,
          description: workWithCreator.description,
          category: workWithCreator.category,
          technique: workWithCreator.technique,
          creatorName,
          mediaUrl: workWithCreator.media_url,
          certifiedAt: certDate,
          transferCode: workWithCreator.transfer_code || transferCode,
          creationLocation: ctxData?.location_name,
          creationWeather: weatherInfo?.conditions,
          elaborationType: ctxData?.elaboration_type,
          marketPrice: commData?.initial_price,
          currency: commData?.currency || 'USD',
          royaltyPercentage: commData?.royalty_type === 'percentage' ? commData?.royalty_value : undefined,
          transferHistory: [{
            type: 'creation' as const,
            date: certDate,
            toName: creatorName,
          }]
        }
        
        console.log('Minting NFT for TBT:', workNftData.tbtId)
        
        const mintResult = await mintTBTNft(workNftData)
        mintAddress = mintResult.mintAddress
        solscanUrl = getExplorerUrl(mintAddress)
        
        await supabase
          .from('works')
          .update({
            mint_address: mintAddress,
            token_uri: mintResult.tokenUri,
            blockchain: 'solana',
            nft_status: 'minted'
          })
          .eq('id', workId)
        
        // Record first owner in ownership_history (creator = first owner).
        // Service-role write: ownership_history is the immutable provenance
        // chain (RLS: public read, service-role-only writes).
        await createServiceClient().from('ownership_history').insert({
          work_id: workId,
          owner_name: creatorName,
          owner_user_id: user.id,
          event_type: 'creation',
          sequence_number: 1,
        })
        
        console.log('NFT minted successfully:', mintAddress)
      } else if (workWithCreator?.mint_address) {
        mintAddress = workWithCreator.mint_address
        solscanUrl = getExplorerUrl(mintAddress)
        console.log('NFT already minted:', mintAddress)
      }
    } catch (mintError: any) {
      console.warn('Error minting NFT:', mintError?.message || mintError)
    }

    // Get user contact info
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', user.id)
      .single()

    const userPhone = contextData.signaturePhone || profile?.phone || ''
    const userEmail = creatorData.email || profile?.email || ''

    let smsSent = false
    let emailSent = false

    // Send SMS/MMS notification
    if (userPhone) {
      try {
        const session = await supabase.auth.getSession()
        const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            phoneNumber: userPhone,
            workId: workId,
            userId: user.id,
          }),
        })
        smsSent = smsResponse.ok
      } catch (smsError) {
        console.warn('Error sending SMS:', smsError)
      }
    }

    // Send email notification
    if (userEmail) {
      try {
        const session = await supabase.auth.getSession()
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: userEmail,
            workId: workId,
            userId: user.id,
            mintAddress,
            solscanUrl,
          }),
        })
        emailSent = emailResponse.ok
      } catch (emailError) {
        console.warn('Error sending email:', emailError)
      }
    }

    console.log('TBT completion finished successfully')

    // Register image in vector DB for future plagiarism checks (non-blocking)
    if (work.media_url) {
      try {
        const imageRes = await fetch(work.media_url)
        if (imageRes.ok) {
          const blob = await imageRes.blob()
          const imageForm = new FormData()
          const fileName = work.media_url.split('/').pop() || 'image.jpg'
          imageForm.append('file', blob, fileName)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          fetch(`${appUrl}/api/tbt-image/register`, {
            method: 'POST',
            body: imageForm,
          }).catch((err) => console.warn('[tbt-image/register] background error:', err))
        }
      } catch (err) {
        console.warn('[tbt-image/register] Could not fetch media_url:', err)
      }
    }

    return NextResponse.json({
      success: true,
      tbtId: updatedWork?.tbt_id || workId,
      workTitle: work.title,
      phoneNumber: userPhone,
      email: userEmail,
      smsSent,
      emailSent,
      solscanUrl,
      mintAddress,
    })

  } catch (error: any) {
    console.error('Error completing TBT:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete TBT' },
      { status: 500 }
    )
  }
}

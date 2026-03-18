import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, CheckoutType } from '@/lib/stripe'
import { createRouteClient } from '@/lib/supabase-route'

export async function POST(request: NextRequest) {
  try {
    const { type, workId, transferId } = await request.json() as {
      type: CheckoutType
      workId: string
      transferId?: string
    }

    if (!type || !workId) {
      return NextResponse.json(
        { error: 'type and workId are required' },
        { status: 400 }
      )
    }

    if (!['tbt_creation', 'transfer'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    const supabase = createRouteClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ownership checks and server-side royalty calculation
    let royaltyAmount: number | undefined

    if (type === 'tbt_creation') {
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('id, creator_id')
        .eq('id', workId)
        .single()

      if (workError || !work) {
        return NextResponse.json({ error: 'Work not found' }, { status: 404 })
      }

      if (work.creator_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (type === 'transfer') {
      if (!transferId) {
        return NextResponse.json({ error: 'transferId is required for transfer type' }, { status: 400 })
      }

      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .select('id, from_owner_id, work_id')
        .eq('id', transferId)
        .single()

      if (transferError || !transfer) {
        return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
      }

      if (transfer.from_owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Compute royalty server-side from work_commerce
      const { data: commerce } = await supabase
        .from('work_commerce')
        .select('royalty_type, royalty_value, initial_price, currency')
        .eq('work_id', transfer.work_id)
        .single()

      if (commerce?.royalty_type === 'percentage' && commerce.royalty_value > 0 && commerce.initial_price) {
        royaltyAmount = (commerce.initial_price * commerce.royalty_value) / 100
      } else if (commerce?.royalty_type === 'fixed' && commerce.royalty_value > 0) {
        royaltyAmount = commerce.royalty_value
      }
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=${type}&workId=${workId}${transferId ? `&transferId=${transferId}` : ''}`
    const cancelUrl = `${baseUrl}/payment/cancel?type=${type}&workId=${workId}`

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      type,
      workId,
      userId: user.id,
      successUrl,
      cancelUrl,
      transferId,
      royaltyAmount,
    })

    // Store payment record
    if (type === 'tbt_creation') {
      await supabase.from('tbt_payments').insert({
        work_id: workId,
        user_id: user.id,
        amount: 5.00,
        currency: 'USD',
        stripe_checkout_session_id: session.id,
        status: 'pending',
      })

      await supabase
        .from('works')
        .update({ payment_status: 'pending', payment_intent_id: session.id })
        .eq('id', workId)
    } else if (type === 'transfer' && transferId) {
      await supabase
        .from('transfers')
        .update({
          payment_status: 'pending',
          payment_link: session.url,
          stripe_checkout_session_id: session.id,
        })
        .eq('id', transferId)
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

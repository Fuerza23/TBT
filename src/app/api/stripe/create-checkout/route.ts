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

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=${type}&workId=${workId}`
    const cancelUrl = `${baseUrl}/payment/cancel?type=${type}&workId=${workId}`

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      type,
      workId,
      userId: user.id,
      successUrl,
      cancelUrl,
      transferId,
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

      // Update work payment status
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
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

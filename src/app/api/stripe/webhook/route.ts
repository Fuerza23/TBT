import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role client for webhook (no user auth context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutExpired(session)
      break
    }
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { type, workId, userId, transferId } = session.metadata || {}

  console.log('Payment completed:', { type, workId, userId, transferId })

  if (type === 'tbt_creation' && workId) {
    // Update tbt_payments
    const { error: paymentError } = await supabase
      .from('tbt_payments')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id)

    if (paymentError) {
      console.error('Error updating tbt_payments:', paymentError)
    }

    // Update work payment status
    const { error: workError } = await supabase
      .from('works')
      .update({
        payment_status: 'completed',
        payment_intent_id: session.payment_intent as string,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('id', workId)

    if (workError) {
      console.error('Error updating work payment_status:', workError)
    } else {
      console.log(`Work payment_status updated to completed for: ${workId}`)
    }

    console.log(`TBT creation payment completed for work: ${workId}`)
  } else if (type === 'transfer' && transferId) {
    // Update transfer payment status
    const { error: transferError } = await supabase
      .from('transfers')
      .update({
        payment_status: 'completed',
        payment_reference: session.payment_intent as string,
      })
      .eq('id', transferId)

    if (transferError) {
      console.error('Error updating transfer:', transferError)
    }

    console.log(`Transfer payment completed for transfer: ${transferId}`)
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const { type, workId, transferId } = session.metadata || {}

  if (type === 'tbt_creation' && workId) {
    await supabase
      .from('tbt_payments')
      .update({ status: 'expired' })
      .eq('stripe_checkout_session_id', session.id)

    await supabase
      .from('works')
      .update({ payment_status: 'expired' })
      .eq('id', workId)
  } else if (type === 'transfer' && transferId) {
    await supabase
      .from('transfers')
      .update({ payment_status: 'expired' })
      .eq('id', transferId)
  }

  console.log('Checkout session expired:', session.id)
}

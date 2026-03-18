import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

// Payment configuration
export const PAYMENT_CONFIG = {
  tbtCreation: {
    amount: 500, // $5.00 in cents
    currency: 'usd',
    description: 'TBT Creation Fee',
  },
  transfer: {
    amount: 500, // $5.00 in cents
    currency: 'usd',
    description: 'TBT Transfer Fee',
  },
}

// Type for checkout session creation
export type CheckoutType = 'tbt_creation' | 'transfer'

export interface CreateCheckoutParams {
  type: CheckoutType
  workId: string
  userId: string
  successUrl: string
  cancelUrl: string
  transferId?: string
  /** Royalty amount in dollars (added on top of the base $5 for transfers) */
  royaltyAmount?: number
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { type, workId, userId, successUrl, cancelUrl, transferId, royaltyAmount = 0 } = params
  const config = type === 'tbt_creation' ? PAYMENT_CONFIG.tbtCreation : PAYMENT_CONFIG.transfer

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: config.currency,
        product_data: {
          name: config.description,
          description: `Work ID: ${workId}`,
        },
        unit_amount: config.amount,
      },
      quantity: 1,
    },
  ]

  // Add royalty line item for transfers
  if (type === 'transfer' && royaltyAmount > 0) {
    lineItems.push({
      price_data: {
        currency: config.currency,
        product_data: {
          name: 'Regalía del Artista',
          description: 'Royalty por transferencia de obra',
        },
        unit_amount: Math.round(royaltyAmount * 100), // convert to cents
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type,
      workId,
      userId,
      transferId: transferId || '',
    },
  })

  return session
}

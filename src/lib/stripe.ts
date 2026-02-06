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
    amount: 200, // $2.00 in cents
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
  transferId?: string // Only for transfer type
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { type, workId, userId, successUrl, cancelUrl, transferId } = params
  const config = type === 'tbt_creation' ? PAYMENT_CONFIG.tbtCreation : PAYMENT_CONFIG.transfer

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
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
    ],
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

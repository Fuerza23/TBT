import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { getProjectWalletPublicKey } from '@/lib/solana/nft'

/**
 * GET - Returns the project wallet public key.
 * In the single-wallet model, all NFTs are owned by the project wallet.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const publicKey = getProjectWalletPublicKey()

    return NextResponse.json({
      hasWallet: true,
      publicKey,
      network: process.env.SOLANA_NETWORK || 'devnet',
      model: 'single-wallet',
    })

  } catch (error: any) {
    console.error('Error getting wallet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get wallet' },
      { status: 500 }
    )
  }
}

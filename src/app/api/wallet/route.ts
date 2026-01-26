import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { createEncryptedWallet, getKeypairFromEncrypted } from '@/lib/solana/wallet'

/**
 * GET - Get user's wallet public key
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('public_key, network, created_at')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ 
        hasWallet: false,
        publicKey: null 
      })
    }

    return NextResponse.json({
      hasWallet: true,
      publicKey: wallet.public_key,
      network: wallet.network,
      createdAt: wallet.created_at
    })

  } catch (error: any) {
    console.error('Error getting wallet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get wallet' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new wallet for the user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a wallet
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id, public_key')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()

    if (existingWallet) {
      return NextResponse.json({
        success: true,
        publicKey: existingWallet.public_key,
        message: 'Wallet already exists'
      })
    }

    // Generate new wallet
    const { publicKey, encryptedSecretKey } = createEncryptedWallet()

    // Save to database
    const { error: insertError } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        public_key: publicKey,
        encrypted_private_key: encryptedSecretKey,
        network: 'solana',
        is_primary: true
      })

    if (insertError) {
      throw new Error(`Failed to save wallet: ${insertError.message}`)
    }

    console.log(`Wallet created for user ${user.id}: ${publicKey}`)

    return NextResponse.json({
      success: true,
      publicKey,
      message: 'Wallet created successfully'
    })

  } catch (error: any) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create wallet' },
      { status: 500 }
    )
  }
}

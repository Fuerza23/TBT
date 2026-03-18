import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase-route'
import { validateCouponCode } from '@/lib/google-sheets'
import { isProduction } from '@/lib/app-env'

export async function POST(request: NextRequest) {
  try {
    const { code, workId } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Optional: Check if workId exists and belongs to user (security)
    // For now we just validate the code

    // TBT dev coupon — only active outside production
    if (!isProduction && code.trim().toUpperCase() === 'TBT') {
      return NextResponse.json({
        valid: true,
        code: 'TBT',
        type: 'percentage',
        value: 100,
        isActive: true,
      })
    }

    const result: any = await validateCouponCode(code)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      type: result.type,
      value: result.value,
      isActive: result.isActive
    })

  } catch (error: any) {
    console.error('Error in validate-coupon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

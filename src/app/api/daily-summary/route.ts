import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: works, error } = await supabase
      .from('works')
      .select(`
        id,
        tbt_id,
        title,
        category,
        media_url,
        certified_at,
        created_at,
        work_commerce (
          initial_price,
          currency
        )
      `)
      .eq('status', 'certified')
      .gte('certified_at', todayStart.toISOString())
      .order('certified_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalRevenue = (works || []).reduce((sum, w) => {
      const commerce = Array.isArray(w.work_commerce)
        ? w.work_commerce[0]
        : w.work_commerce
      return sum + (commerce?.initial_price || 0)
    }, 0)

    return NextResponse.json({
      date: todayStart.toISOString(),
      count: works?.length || 0,
      totalRevenue,
      works: works || [],
    })
  } catch {
    return NextResponse.json(
      { error: 'Error fetching daily summary' },
      { status: 500 }
    )
  }
}

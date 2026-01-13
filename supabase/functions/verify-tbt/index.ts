// Edge Function: verify-tbt
// Endpoint público para verificar un TBT

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cliente público (no requiere autenticación)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Obtener TBT ID de query params o body
    let tbtId: string | null = null
    
    const url = new URL(req.url)
    tbtId = url.searchParams.get('tbt_id')
    
    if (!tbtId && req.method === 'POST') {
      const body = await req.json()
      tbtId = body.tbt_id
    }

    if (!tbtId) {
      return new Response(
        JSON.stringify({ error: 'Se requiere tbt_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalizar el TBT ID
    tbtId = tbtId.toUpperCase().trim()

    // Buscar la obra
    const { data: work, error: workError } = await supabaseClient
      .from('works')
      .select(`
        id,
        tbt_id,
        title,
        description,
        category,
        technique,
        media_url,
        status,
        created_at,
        certified_at,
        creator:profiles!works_creator_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        current_owner:profiles!works_current_owner_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        work_commerce (
          initial_price,
          currency,
          royalty_type,
          royalty_value,
          is_for_sale
        ),
        work_context (
          keywords,
          geographical_location,
          creation_timestamp,
          is_confirmed
        )
      `)
      .eq('tbt_id', tbtId)
      .eq('status', 'certified')
      .single()

    if (workError || !work) {
      return new Response(
        JSON.stringify({ 
          verified: false,
          error: 'TBT no encontrado o no certificado',
          tbt_id: tbtId
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener historial de transferencias
    const { data: transfers } = await supabaseClient
      .from('transfers')
      .select(`
        id,
        transfer_type,
        completed_at,
        from_owner:profiles!transfers_from_owner_id_fkey (display_name),
        to_owner:profiles!transfers_to_owner_id_fkey (display_name)
      `)
      .eq('work_id', work.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })

    // Obtener certificado actual
    const { data: certificate } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('work_id', work.id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    // Registrar la visualización (opcional - para estadísticas)
    const viewerIp = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    await supabaseClient
      .from('work_views')
      .insert({
        work_id: work.id,
        viewer_ip: viewerIp,
        user_agent: userAgent
      })

    // Construir historial de propiedad
    const ownershipHistory = [
      {
        owner: work.creator.display_name,
        event: 'Creación',
        date: work.certified_at || work.created_at
      },
      ...(transfers || []).map(t => ({
        owner: t.to_owner?.display_name,
        event: t.transfer_type === 'gift' ? 'Regalo' : 'Venta',
        date: t.completed_at
      }))
    ]

    // Respuesta de verificación
    const verificationResponse = {
      verified: true,
      tbt_id: work.tbt_id,
      work: {
        title: work.title,
        description: work.description,
        category: work.category,
        technique: work.technique,
        media_url: work.media_url,
        certified_at: work.certified_at
      },
      creator: {
        name: work.creator.display_name,
        avatar: work.creator.avatar_url
      },
      current_owner: {
        name: work.current_owner.display_name,
        avatar: work.current_owner.avatar_url,
        is_creator: work.creator.id === work.current_owner.id
      },
      commerce: work.work_commerce ? {
        price: work.work_commerce.initial_price,
        currency: work.work_commerce.currency,
        royalty: `${work.work_commerce.royalty_value}${work.work_commerce.royalty_type === 'percentage' ? '%' : ' ' + work.work_commerce.currency}`,
        for_sale: work.work_commerce.is_for_sale
      } : null,
      context: work.work_context ? {
        keywords: work.work_context.keywords,
        location: work.work_context.geographical_location,
        created_at: work.work_context.creation_timestamp
      } : null,
      certificate: certificate ? {
        id: certificate.id,
        version: certificate.version,
        generated_at: certificate.generated_at,
        qr_url: certificate.qr_code_data
      } : null,
      ownership_history: ownershipHistory,
      verification_url: `https://tbt.cafe/work/${work.tbt_id}`,
      verified_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(verificationResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: 'Error al verificar TBT' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

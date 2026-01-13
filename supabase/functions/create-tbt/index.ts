// Edge Function: create-tbt
// Crea un nuevo TBT con toda su información asociada

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTBTRequest {
  // La Obra
  title: string
  description: string
  category: string
  technique?: string
  media_url: string
  
  // Comercio
  initial_price: number
  currency?: string
  royalty_type: 'fixed' | 'percentage'
  royalty_value: number
  is_for_sale?: boolean
  
  // Contexto (opcional)
  keywords?: string[]
  geographical_location?: {
    lat: number
    lng: number
    city?: string
    country?: string
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase con el token del usuario
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar que el usuario está autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener datos del request
    const body: CreateTBTRequest = await req.json()

    // Validaciones básicas
    if (!body.title || !body.description || !body.media_url) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: title, description, media_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Crear la obra (el TBT ID se genera automáticamente via trigger)
    const { data: work, error: workError } = await supabaseClient
      .from('works')
      .insert({
        creator_id: user.id,
        current_owner_id: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        technique: body.technique,
        media_url: body.media_url,
        status: 'draft'
      })
      .select()
      .single()

    if (workError) {
      console.error('Error creating work:', workError)
      return new Response(
        JSON.stringify({ error: 'Error al crear la obra', details: workError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Crear configuración comercial
    const { error: commerceError } = await supabaseClient
      .from('work_commerce')
      .insert({
        work_id: work.id,
        initial_price: body.initial_price,
        currency: body.currency || 'USD',
        royalty_type: body.royalty_type,
        royalty_value: body.royalty_value,
        is_for_sale: body.is_for_sale || false
      })

    if (commerceError) {
      console.error('Error creating commerce:', commerceError)
      // Rollback: eliminar la obra
      await supabaseClient.from('works').delete().eq('id', work.id)
      return new Response(
        JSON.stringify({ error: 'Error al crear configuración comercial' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Crear contexto
    const { error: contextError } = await supabaseClient
      .from('work_context')
      .insert({
        work_id: work.id,
        keywords: body.keywords || [],
        geographical_location: body.geographical_location,
        creation_timestamp: new Date().toISOString(),
        is_confirmed: false
      })

    if (contextError) {
      console.error('Error creating context:', contextError)
    }

    // 4. Certificar la obra (cambiar status)
    const { data: certifiedWork, error: certifyError } = await supabaseClient
      .from('works')
      .update({
        status: 'certified',
        certified_at: new Date().toISOString()
      })
      .eq('id', work.id)
      .select()
      .single()

    if (certifyError) {
      console.error('Error certifying work:', certifyError)
    }

    // 5. Crear certificado inicial
    const certificateData = {
      work_id: work.id,
      owner_id: user.id,
      qr_code_data: `https://tbt.cafe/work/${work.tbt_id}`,
      version: 1,
      generated_at: new Date().toISOString()
    }

    const { data: certificate, error: certError } = await supabaseClient
      .from('certificates')
      .insert(certificateData)
      .select()
      .single()

    if (certError) {
      console.error('Error creating certificate:', certError)
    }

    // 6. Crear alerta de éxito
    await supabaseClient
      .from('alerts')
      .insert({
        user_id: user.id,
        work_id: work.id,
        type: 'system',
        title: '¡TBT Creado!',
        message: `Tu obra "${body.title}" ha sido certificada con el ID: ${certifiedWork?.tbt_id || work.tbt_id}`
      })

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        tbt_id: certifiedWork?.tbt_id || work.tbt_id,
        work: certifiedWork || work,
        certificate: certificate,
        verification_url: `https://tbt.cafe/work/${certifiedWork?.tbt_id || work.tbt_id}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

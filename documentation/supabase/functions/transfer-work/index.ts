// Edge Function: transfer-work
// Maneja la transferencia de propiedad de un TBT

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  tbt_id: string
  to_email?: string
  to_phone?: string
  transfer_type: 'manual' | 'gift'
  sale_price?: number
  notes?: string
}

interface PaymentLinkResponse {
  payment_url: string
  reference: string
}

// Función para generar link de pago via Transb.it (simulado)
async function generatePaymentLink(
  amount: number,
  currency: string,
  reference: string,
  description: string
): Promise<PaymentLinkResponse> {
  // TODO: Integrar con API real de Transb.it
  // Por ahora retornamos un link simulado
  const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    payment_url: `https://transb.it/pay/${paymentRef}?amount=${amount}&currency=${currency}&ref=${reference}`,
    reference: paymentRef
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: TransferRequest = await req.json()

    // Validar campos requeridos
    if (!body.tbt_id || (!body.to_email && !body.to_phone)) {
      return new Response(
        JSON.stringify({ error: 'Se requiere tbt_id y email o teléfono del destinatario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Buscar la obra por TBT ID
    const { data: work, error: workError } = await supabaseClient
      .from('works')
      .select(`
        *,
        work_commerce (*),
        creator:profiles!works_creator_id_fkey (id, display_name, email)
      `)
      .eq('tbt_id', body.tbt_id)
      .single()

    if (workError || !work) {
      return new Response(
        JSON.stringify({ error: 'Obra no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar que el usuario actual es el propietario
    if (work.current_owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No eres el propietario actual de esta obra' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Buscar o crear el perfil del destinatario
    let toUserId: string | null = null
    
    // Buscar por email primero
    if (body.to_email) {
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', body.to_email)
        .single()
      
      if (existingProfile) {
        toUserId = existingProfile.id
      }
    }
    
    // Si no se encuentra, buscar por teléfono
    if (!toUserId && body.to_phone) {
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('phone', body.to_phone)
        .single()
      
      if (existingProfile) {
        toUserId = existingProfile.id
      }
    }

    // Si el destinatario no existe, crear una invitación pendiente
    // (En producción, enviar email/SMS de invitación)
    if (!toUserId) {
      // Por ahora, requerimos que el destinatario tenga cuenta
      return new Response(
        JSON.stringify({ 
          error: 'El destinatario no tiene una cuenta TBT. Debe registrarse primero.',
          invite_required: true,
          invite_email: body.to_email,
          invite_phone: body.to_phone
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que no se transfiere a sí mismo
    if (toUserId === user.id) {
      return new Response(
        JSON.stringify({ error: 'No puedes transferir la obra a ti mismo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Calcular regalía
    let royaltyAmount = 0
    const commerce = work.work_commerce
    
    if (body.transfer_type !== 'gift' && body.sale_price && commerce) {
      if (commerce.royalty_type === 'percentage') {
        royaltyAmount = (body.sale_price * commerce.royalty_value) / 100
      } else {
        royaltyAmount = commerce.royalty_value
      }
    }

    // 5. Crear registro de transferencia
    const transferData = {
      work_id: work.id,
      from_owner_id: user.id,
      to_owner_id: toUserId,
      transfer_type: body.transfer_type,
      sale_price: body.sale_price || 0,
      royalty_amount: royaltyAmount,
      royalty_paid: body.transfer_type === 'gift', // Regalos no requieren pago
      notes: body.notes,
      status: body.transfer_type === 'gift' ? 'completed' : 'payment_pending'
    }

    // Si es un regalo, completar inmediatamente
    if (body.transfer_type === 'gift') {
      const { data: transfer, error: transferError } = await supabaseClient
        .from('transfers')
        .insert({
          ...transferData,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (transferError) {
        return new Response(
          JSON.stringify({ error: 'Error al crear transferencia', details: transferError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Actualizar propietario
      await supabaseClient
        .from('works')
        .update({ current_owner_id: toUserId })
        .eq('id', work.id)

      // Crear nuevo certificado
      await supabaseClient
        .from('certificates')
        .insert({
          work_id: work.id,
          owner_id: toUserId,
          qr_code_data: `https://tbt.cafe/work/${work.tbt_id}`,
          version: (await supabaseClient
            .from('certificates')
            .select('version')
            .eq('work_id', work.id)
            .order('version', { ascending: false })
            .limit(1)
            .single()).data?.version + 1 || 1
        })

      // Notificar a ambas partes
      await supabaseClient
        .from('alerts')
        .insert([
          {
            user_id: user.id,
            work_id: work.id,
            type: 'transfer_request',
            title: 'Obra transferida',
            message: `Has regalado "${work.title}" exitosamente.`
          },
          {
            user_id: toUserId,
            work_id: work.id,
            type: 'transfer_request',
            title: '¡Has recibido una obra!',
            message: `Has recibido "${work.title}" como regalo.`
          }
        ])

      return new Response(
        JSON.stringify({
          success: true,
          transfer_type: 'gift',
          transfer_id: transfer.id,
          message: 'Transferencia completada exitosamente'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Para ventas, generar link de pago
    const paymentInfo = await generatePaymentLink(
      royaltyAmount,
      commerce?.currency || 'USD',
      `TBT-${work.tbt_id}-${Date.now()}`,
      `Regalía por "${work.title}"`
    )

    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfers')
      .insert({
        ...transferData,
        payment_link: paymentInfo.payment_url,
        payment_reference: paymentInfo.reference
      })
      .select()
      .single()

    if (transferError) {
      return new Response(
        JSON.stringify({ error: 'Error al crear transferencia', details: transferError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Notificar al creador sobre regalía pendiente
    if (work.creator.id !== user.id) {
      await supabaseClient
        .from('alerts')
        .insert({
          user_id: work.creator.id,
          work_id: work.id,
          type: 'payment',
          title: 'Regalía pendiente',
          message: `Tu obra "${work.title}" está siendo vendida. Regalía: $${royaltyAmount}`
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_type: 'sale',
        transfer_id: transfer.id,
        royalty_amount: royaltyAmount,
        payment_url: paymentInfo.payment_url,
        payment_reference: paymentInfo.reference,
        message: 'Transferencia iniciada. El comprador debe completar el pago de regalía.'
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

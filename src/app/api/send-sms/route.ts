import { NextRequest, NextResponse } from 'next/server'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { createRouteClient } from '@/lib/supabase-route'
import twilio from 'twilio'

// Initialize SNS Client (fallback for simple SMS)
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

// Initialize Twilio client for MMS
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

interface SendSMSRequest {
  phoneNumber: string
  workId: string
  userId: string
  message?: string
  sendMMS?: boolean // Flag to send MMS with certificate image
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createRouteClient()
    
    // Get authorization header for user context
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado - falta token de autenticación' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SendSMSRequest = await request.json()
    const { phoneNumber, workId, userId, message, sendMMS = true } = body

    if (!phoneNumber || !workId || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: phoneNumber, workId, userId' },
        { status: 400 }
      )
    }

    // Get work details with creator info for the message
    const { data: work, error: workError } = await supabase
      .from('works')
      .select(`
        title, 
        tbt_id, 
        media_url,
        category,
        certified_at,
        creator:profiles!works_creator_id_fkey(display_name, public_alias),
        work_commerce(initial_price, currency)
      `)
      .eq('id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
    }

    // Get creator name
    const creatorData = work.creator as any
    const creatorName = Array.isArray(creatorData) 
      ? (creatorData[0]?.public_alias || creatorData[0]?.display_name)
      : (creatorData?.public_alias || creatorData?.display_name)

    // Get commerce data
    const commerce = Array.isArray(work.work_commerce) 
      ? work.work_commerce[0] 
      : work.work_commerce

    // Build enhanced MMS message with full TBT details
    const certifiedDate = work.certified_at 
      ? new Date(work.certified_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Hoy'

    const mmsMessage = message || 
      `🎨 ¡Tu TBT está certificado!\n\n` +
      `📜 "${work.title}"\n` +
      `👤 Creador: ${creatorName || 'Artista'}\n` +
      `🏷️ Categoría: ${work.category || 'Arte'}\n` +
      `📅 Certificado: ${certifiedDate}\n` +
      `🆔 ID: ${work.tbt_id}\n` +
      (commerce ? `💰 Valor: $${commerce.initial_price?.toLocaleString()} ${commerce.currency}\n` : '') +
      `\n🔗 Ver certificado:\n` +
      `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}\n\n` +
      `¡Gracias por proteger tu obra con TBT!`

    const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}`
    
    // Determine media URL for MMS (use work image or a default certificate image)
    const mediaUrl = work.media_url || `${process.env.NEXT_PUBLIC_APP_URL}/logos/transbit.png`

    // Try to send MMS via Twilio if configured
    if (sendMMS && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioMessage = await twilioClient.messages.create({
          body: mmsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
          mediaUrl: [mediaUrl], // Include certificate/work image
        })

        // Save delivery record to database
        await supabase.from('mms_deliveries').insert({
          work_id: workId,
          user_id: userId,
          phone_number: phoneNumber,
          twilio_message_sid: twilioMessage.sid,
          status: 'sent',
          certificate_url: certificateUrl,
          gif_url: mediaUrl,
          sent_at: new Date().toISOString(),
        })

        return NextResponse.json({
          success: true,
          messageId: twilioMessage.sid,
          message: 'MMS enviado exitosamente con imagen del certificado',
          type: 'mms',
        })
      } catch (twilioError: any) {
        console.error('Twilio MMS error:', twilioError)
        // Fall through to SMS fallback
      }
    }

    // Fallback: Check if AWS credentials are configured for simple SMS
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ No messaging service configured. Message would be sent to:', phoneNumber)
      console.log('Message:', mmsMessage)
      console.log('Media URL:', mediaUrl)
      
      // Save to mms_deliveries with simulated status
      await supabase.from('mms_deliveries').insert({
        work_id: workId,
        user_id: userId,
        phone_number: phoneNumber,
        status: 'simulated',
        certificate_url: certificateUrl,
        gif_url: mediaUrl,
      })

      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'MMS simulado (credenciales no configuradas)',
        messageId: `sim_${Date.now()}`,
        type: 'simulated',
      })
    }

    // Fallback: Send SMS via AWS SNS (no image support)
    const smsOnlyMessage = 
      `🎨 ¡Tu TBT está certificado!\n\n` +
      `"${work.title}" - ${creatorName || 'Artista'}\n` +
      `ID: ${work.tbt_id}\n\n` +
      `Ver certificado: ${certificateUrl}`

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: smsOnlyMessage,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'TBT',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    })

    const snsResponse = await snsClient.send(command)

    // Save delivery record to database
    await supabase.from('mms_deliveries').insert({
      work_id: workId,
      user_id: userId,
      phone_number: phoneNumber,
      status: 'sent',
      certificate_url: certificateUrl,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      messageId: snsResponse.MessageId,
      message: 'SMS enviado exitosamente (sin imagen)',
      type: 'sms',
    })

  } catch (error: any) {
    console.error('Error sending message:', error)

    return NextResponse.json(
      { 
        error: 'Error al enviar mensaje',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

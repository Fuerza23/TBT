import { NextRequest, NextResponse } from 'next/server'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { createRouteClient } from '@/lib/supabase-route'

// Initialize SNS Client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

interface SendSMSRequest {
  phoneNumber: string
  workId: string
  userId: string
  message?: string
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
    const { phoneNumber, workId, userId, message } = body

    if (!phoneNumber || !workId || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: phoneNumber, workId, userId' },
        { status: 400 }
      )
    }

    // Get work details for the SMS message
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('title, tbt_id')
      .eq('id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
    }

    // Build SMS message
    const smsMessage = message || `🎨 ¡Tu TBT está listo!\n\n` +
      `Obra: ${work.title}\n` +
      `ID: ${work.tbt_id}\n\n` +
      `Verifica tu certificado en:\n` +
      `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}`

    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ AWS credentials not configured. SMS would be sent to:', phoneNumber)
      console.log('Message:', smsMessage)
      
      // Save to mms_deliveries with simulated status
      await supabase.from('mms_deliveries').insert({
        work_id: workId,
        user_id: userId,
        phone_number: phoneNumber,
        status: 'simulated',
        certificate_url: `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}`,
      })

      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'SMS simulado (credenciales AWS no configuradas)',
        messageId: `sim_${Date.now()}`,
      })
    }

    // Send SMS via AWS SNS
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: smsMessage,
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
    const { error: insertError } = await supabase.from('mms_deliveries').insert({
      work_id: workId,
      user_id: userId,
      phone_number: phoneNumber,
      status: 'sent',
      certificate_url: `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}`,
      sent_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Error saving delivery record:', insertError)
    }

    return NextResponse.json({
      success: true,
      messageId: snsResponse.MessageId,
      message: 'SMS enviado exitosamente',
    })

  } catch (error: any) {
    console.error('Error sending SMS:', error)

    return NextResponse.json(
      { 
        error: 'Error al enviar SMS',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

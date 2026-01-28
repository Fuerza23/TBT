import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createRouteClient } from '@/lib/supabase-route'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

interface SendEmailRequest {
  email: string
  workId: string
  userId: string
  mintAddress?: string
  solscanUrl?: string
}

// HTML Email Template
function generateEmailTemplate(data: {
  title: string
  tbtId: string
  creatorName: string
  category: string
  certifiedDate: string
  price?: string
  currency?: string
  mediaUrl?: string
  tbtUrl: string
  solscanUrl?: string
  mintAddress?: string
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tu TBT está certificado!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logos/transbit.png" alt="TBT" width="120" style="max-width: 120px;">
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2d44;">
              
              <!-- Success Icon -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%); border-radius: 50%; display: inline-block; text-align: center; line-height: 80px;">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Title -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      ¡Tu TBT está certificado!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <p style="margin: 0; color: #a0a0b0; font-size: 16px;">
                      Gracias por proteger tu obra con TBT
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Work Image -->
              ${data.mediaUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <img src="${data.mediaUrl}" alt="${data.title}" width="400" style="max-width: 100%; border-radius: 12px; border: 2px solid #2d2d44;">
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Work Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0d0d15; border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <!-- Title -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Obra</p>
                          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">"${data.title}"</p>
                        </td>
                      </tr>
                      
                      <!-- TBT ID -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">ID de Certificación</p>
                          <p style="margin: 0; color: #00d4aa; font-size: 16px; font-family: monospace; font-weight: 600;">${data.tbtId}</p>
                        </td>
                      </tr>
                      
                      <!-- Creator -->
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Creador</p>
                          <p style="margin: 0; color: #ffffff; font-size: 16px;">${data.creatorName}</p>
                        </td>
                      </tr>
                      
                      <!-- Category & Date Row -->
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="50%" style="padding-bottom: 16px;">
                                <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Categoría</p>
                                <p style="margin: 0; color: #ffffff; font-size: 14px;">${data.category}</p>
                              </td>
                              <td width="50%" style="padding-bottom: 16px;">
                                <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Certificado</p>
                                <p style="margin: 0; color: #ffffff; font-size: 14px;">${data.certifiedDate}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Price (if available) -->
                      ${data.price ? `
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0 0 4px 0; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Valor</p>
                          <p style="margin: 0; color: #00d4aa; font-size: 18px; font-weight: 600;">$${data.price} ${data.currency || 'USD'}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding-top: 30px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${data.tbtUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Ver mi Certificado TBT
                    </a>
                  </td>
                </tr>
                
                ${data.solscanUrl ? `
                <tr>
                  <td align="center">
                    <a href="${data.solscanUrl}" style="display: inline-block; background: transparent; color: #9945FF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; border: 1px solid #9945FF;">
                      🔗 Ver en Solana (SolScan)
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              ${data.mintAddress ? `
              <!-- NFT Address -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #a0a0b0; font-size: 12px;">Dirección NFT en Solana:</p>
                    <p style="margin: 0; color: #9945FF; font-size: 12px; font-family: monospace; word-break: break-all; background: #0d0d15; padding: 12px; border-radius: 8px;">
                      ${data.mintAddress}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #606070; font-size: 14px;">
                      Tu obra está ahora protegida y verificable en la blockchain de Solana.
                    </p>
                    <p style="margin: 0 0 16px 0; color: #606070; font-size: 12px;">
                      Puedes compartir el enlace de tu certificado con cualquier persona.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px; border-top: 1px solid #2d2d44;">
                    <p style="margin: 0; color: #404050; font-size: 12px;">
                      © ${new Date().getFullYear()} TBT - Token Basado en Trabajo<br>
                      Powered by BROCHA & Transbit
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Plain text version
function generatePlainTextEmail(data: {
  title: string
  tbtId: string
  creatorName: string
  category: string
  certifiedDate: string
  price?: string
  currency?: string
  tbtUrl: string
  solscanUrl?: string
  mintAddress?: string
}) {
  return `
¡Tu TBT está certificado!

Gracias por proteger tu obra con TBT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETALLES DE TU CERTIFICACIÓN

📜 Obra: "${data.title}"
🆔 ID: ${data.tbtId}
👤 Creador: ${data.creatorName}
🏷️ Categoría: ${data.category}
📅 Certificado: ${data.certifiedDate}
${data.price ? `💰 Valor: $${data.price} ${data.currency || 'USD'}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENLACES IMPORTANTES

🔗 Ver tu certificado TBT:
${data.tbtUrl}

${data.solscanUrl ? `⛓️ Ver en Solana (SolScan):
${data.solscanUrl}` : ''}

${data.mintAddress ? `📍 Dirección NFT:
${data.mintAddress}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu obra está ahora protegida y verificable en la blockchain de Solana.
Puedes compartir el enlace de tu certificado con cualquier persona.

© ${new Date().getFullYear()} TBT - Token Basado en Trabajo
Powered by BROCHA & Transbit
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured. Email would be sent.')
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email simulado (SendGrid no configurado)',
      })
    }

    // Initialize Supabase client
    const supabase = createRouteClient()
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado - falta token de autenticación' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SendEmailRequest = await request.json()
    const { email, workId, userId, mintAddress, solscanUrl } = body

    if (!email || !workId || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: email, workId, userId' },
        { status: 400 }
      )
    }

    // Get work details with creator info
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
      ? (creatorData[0]?.public_alias || creatorData[0]?.display_name || 'Artista')
      : (creatorData?.public_alias || creatorData?.display_name || 'Artista')

    // Get commerce data
    const commerce = Array.isArray(work.work_commerce) 
      ? work.work_commerce[0] 
      : work.work_commerce

    // Format certified date
    const certifiedDate = work.certified_at 
      ? new Date(work.certified_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

    // Build email data
    const emailData = {
      title: work.title,
      tbtId: work.tbt_id,
      creatorName,
      category: work.category || 'Arte',
      certifiedDate,
      price: commerce?.initial_price?.toString(),
      currency: commerce?.currency || 'USD',
      mediaUrl: work.media_url,
      tbtUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work/${work.tbt_id}`,
      solscanUrl: solscanUrl || undefined,
      mintAddress: mintAddress || undefined,
    }

    // Send email via SendGrid
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@tbt.art',
        name: process.env.SENDGRID_FROM_NAME || 'TBT - Token Basado en Trabajo',
      },
      subject: `🎨 ¡Tu TBT "${work.title}" está certificado!`,
      text: generatePlainTextEmail(emailData),
      html: generateEmailTemplate(emailData),
    }

    try {
      const response = await sgMail.send(msg)
      
      console.log('📧 Email sent successfully to:', email)

      // Save email delivery record (optional - you could create an email_deliveries table)
      // For now, we'll log it

      return NextResponse.json({
        success: true,
        message: 'Email enviado exitosamente',
        statusCode: response[0].statusCode,
      })
    } catch (sendError: any) {
      console.error('SendGrid error:', sendError)
      
      if (sendError.response) {
        console.error('SendGrid response body:', sendError.response.body)
      }

      return NextResponse.json(
        { 
          error: 'Error al enviar email',
          details: sendError.message 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error in send-email:', error)

    return NextResponse.json(
      { 
        error: 'Error al procesar solicitud de email',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

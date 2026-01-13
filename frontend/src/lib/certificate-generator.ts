// Generador de certificados en canvas para descarga
import QRCode from 'qrcode'

interface CertificateData {
  tbtId: string
  title: string
  creatorName: string
  ownerName: string
  certifiedAt: string
  royalty: string
  verificationUrl: string
  mediaUrl?: string
}

export async function generateCertificateImage(data: CertificateData): Promise<Blob> {
  // Crear canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Dimensiones del certificado (A4 landscape en pixels a 150 DPI)
  canvas.width = 1754
  canvas.height = 1240
  
  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#0a0a0f')
  gradient.addColorStop(0.5, '#12121a')
  gradient.addColorStop(1, '#0a0a0f')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Patrón decorativo (borde dorado)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80)
  
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
  ctx.lineWidth = 2
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120)
  
  // Título del certificado
  ctx.fillStyle = '#d4af37'
  ctx.font = 'bold 28px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('✦ CERTIFICADO DE AUTENTICIDAD ✦', canvas.width / 2, 130)
  
  // Línea decorativa
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2 - 200, 160)
  ctx.lineTo(canvas.width / 2 + 200, 160)
  ctx.stroke()
  
  // TBT ID
  ctx.fillStyle = '#e94560'
  ctx.font = 'bold 42px "Courier New", monospace'
  ctx.fillText(data.tbtId, canvas.width / 2, 230)
  
  // Título de la obra
  ctx.fillStyle = '#f0f0f5'
  ctx.font = 'italic 48px Georgia, serif'
  ctx.fillText(`"${data.title}"`, canvas.width / 2, 320)
  
  // Creador
  ctx.fillStyle = '#8888a0'
  ctx.font = '24px Arial, sans-serif'
  ctx.fillText(`Creado por`, canvas.width / 2, 380)
  ctx.fillStyle = '#f0f0f5'
  ctx.font = 'bold 32px Arial, sans-serif'
  ctx.fillText(data.creatorName, canvas.width / 2, 420)
  
  // Separador
  ctx.strokeStyle = 'rgba(136, 136, 160, 0.3)'
  ctx.beginPath()
  ctx.moveTo(200, 470)
  ctx.lineTo(canvas.width - 200, 470)
  ctx.stroke()
  
  // Información en dos columnas
  const leftX = 400
  const rightX = canvas.width - 400
  let y = 540
  
  // Propietario actual
  ctx.textAlign = 'left'
  ctx.fillStyle = '#8888a0'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('PROPIETARIO ACTUAL', leftX - 150, y)
  ctx.fillStyle = '#f0f0f5'
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillText(data.ownerName, leftX - 150, y + 35)
  
  // Fecha de certificación
  ctx.textAlign = 'right'
  ctx.fillStyle = '#8888a0'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('FECHA DE CERTIFICACIÓN', rightX + 150, y)
  ctx.fillStyle = '#f0f0f5'
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillText(data.certifiedAt, rightX + 150, y + 35)
  
  y += 100
  
  // Regalía
  ctx.textAlign = 'left'
  ctx.fillStyle = '#8888a0'
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('REGALÍA DEL ARTISTA', leftX - 150, y)
  ctx.fillStyle = '#d4af37'
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillText(data.royalty, leftX - 150, y + 35)
  
  // Generar QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    })
    
    const qrImage = new Image()
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve
      qrImage.onerror = reject
      qrImage.src = qrDataUrl
    })
    
    // Fondo blanco para el QR
    ctx.fillStyle = '#ffffff'
    ctx.roundRect(canvas.width / 2 - 100, 750, 200, 200, 10)
    ctx.fill()
    
    // Dibujar QR
    ctx.drawImage(qrImage, canvas.width / 2 - 90, 760, 180, 180)
  } catch (e) {
    console.error('Error generating QR:', e)
  }
  
  // URL de verificación
  ctx.textAlign = 'center'
  ctx.fillStyle = '#8888a0'
  ctx.font = '18px Arial, sans-serif'
  ctx.fillText('Verificar autenticidad en:', canvas.width / 2, 990)
  ctx.fillStyle = '#e94560'
  ctx.font = '22px "Courier New", monospace'
  ctx.fillText(data.verificationUrl, canvas.width / 2, 1020)
  
  // Footer
  ctx.fillStyle = 'rgba(136, 136, 160, 0.5)'
  ctx.font = '16px Arial, sans-serif'
  ctx.fillText('Este certificado garantiza la autenticidad y trazabilidad de la obra mediante tecnología blockchain.', canvas.width / 2, 1100)
  ctx.fillText('TBT - Tokens Transferibles Facturables | Transbit × BROCHA', canvas.width / 2, 1130)
  
  // Logos/marcas de agua en esquinas
  ctx.fillStyle = 'rgba(212, 175, 55, 0.1)'
  ctx.font = 'bold 60px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.fillText('TBT', 80, 1180)
  ctx.textAlign = 'right'
  ctx.fillText('TBT', canvas.width - 80, 1180)
  
  // Convertir a Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png', 1.0)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

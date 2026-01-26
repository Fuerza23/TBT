// Generador de certificados TBT - GIF Animado
// Diseño magenta/negro con código animado
import GIF from 'gif.js'
import QRCode from 'qrcode'

interface CertificateData {
  tbtId: string
  title: string
  creatorName: string
  ownerName: string
  certifiedAt: string
  value?: string
  currency?: string
  royalty: string
  verificationUrl: string
  mediaUrl?: string
}

// Colores del diseño
const COLORS = {
  background: '#0a0a0a',
  magenta: '#e91e8c',
  white: '#ffffff',
  gray: '#888888',
  lightGray: '#cccccc',
}

// Función para dibujar el logo TBT con arcoíris
function drawTBTLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
  
  ctx.font = `bold ${size}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Gradiente de texto arcoíris
  const gradient = ctx.createLinearGradient(x - 60, y, x + 60, y)
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color)
  })
  
  ctx.fillStyle = gradient
  ctx.fillText('TBT', x, y)
}

// Función para dibujar cuadro de dígito
function drawDigitBox(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  digit: string, 
  visible: boolean = true
) {
  const boxSize = 42
  const padding = 4
  
  // Fondo del cuadro
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(x, y, boxSize, boxSize)
  
  // Borde
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, boxSize, boxSize)
  
  // Dígito
  if (visible && digit) {
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 28px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(digit, x + boxSize / 2, y + boxSize / 2)
  }
}

// Función para dibujar QR circular con puntos
async function drawCircularQR(
  ctx: CanvasRenderingContext2D, 
  url: string, 
  centerX: number, 
  centerY: number, 
  radius: number
) {
  // Fondo circular blanco
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  
  // Generar QR data
  try {
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, url, {
      width: radius * 1.6,
      margin: 1,
      color: { dark: COLORS.magenta, light: '#ffffff' }
    })
    
    // Dibujar QR dentro del círculo
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(
      qrCanvas, 
      centerX - radius + 10, 
      centerY - radius + 10, 
      (radius - 10) * 2, 
      (radius - 10) * 2
    )
    ctx.restore()
  } catch (e) {
    console.error('Error generating QR:', e)
  }
}

// Función para dibujar patrón de ondas
function drawWavePattern(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  
  for (let row = 0; row < height; row += 8) {
    ctx.beginPath()
    for (let col = 0; col < width; col += 2) {
      const waveY = y + row + Math.sin((col + row) * 0.1) * 3
      if (col === 0) {
        ctx.moveTo(x + col, waveY)
      } else {
        ctx.lineTo(x + col, waveY)
      }
    }
    ctx.stroke()
  }
}

// Función principal para generar un frame del certificado
async function drawCertificateFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: CertificateData,
  visibleDigits: number
): Promise<void> {
  const width = canvas.width
  const height = canvas.height
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height)
  
  // Fondo negro
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, width, height)
  
  // Borde magenta
  ctx.strokeStyle = COLORS.magenta
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, width - 4, height - 4)
  
  // Patrón de fondo sutil
  ctx.globalAlpha = 0.05
  for (let i = 0; i < width; i += 30) {
    for (let j = 0; j < height; j += 30) {
      ctx.fillStyle = COLORS.white
      ctx.fillRect(i, j, 15, 15)
    }
  }
  ctx.globalAlpha = 1
  
  // Logo TBT
  drawTBTLogo(ctx, width / 2, 50, 48)
  
  // Código TBT en cuadros
  const digits = data.tbtId.split('')
  const boxWidth = 42
  const totalWidth = digits.length * (boxWidth + 6) - 6
  const startX = (width - totalWidth) / 2
  
  digits.forEach((digit, index) => {
    const x = startX + index * (boxWidth + 6)
    drawDigitBox(ctx, x, 90, digit, index < visibleDigits)
  })
  
  // QR Circular
  await drawCircularQR(ctx, data.verificationUrl, width / 2, 220, 60)
  
  // Título de la obra
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 22px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.title.toUpperCase(), width / 2, 320)
  
  // Separador
  ctx.beginPath()
  ctx.moveTo(20, 350)
  ctx.lineTo(width - 20, 350)
  ctx.strokeStyle = COLORS.magenta
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Información - Fondo
  ctx.fillStyle = 'rgba(30, 30, 30, 0.8)'
  ctx.fillRect(20, 360, width - 40, 180)
  
  // Borde izquierdo magenta
  ctx.fillStyle = COLORS.magenta
  ctx.fillRect(20, 360, 4, 180)
  
  // Cuadro magenta pequeño
  ctx.fillRect(width - 40, 360 + 90, 12, 12)
  
  // Información del certificado
  const infoX = 40
  let infoY = 390
  const lineHeight = 40
  
  // Creator
  ctx.fillStyle = COLORS.gray
  ctx.font = '12px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Creator:', infoX, infoY)
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText(data.creatorName.toUpperCase(), infoX, infoY + 18)
  
  infoY += lineHeight
  
  // Owner ID
  ctx.fillStyle = COLORS.gray
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Owner ID:', infoX, infoY)
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText(data.ownerName.toUpperCase(), infoX, infoY + 18)
  
  infoY += lineHeight
  
  // Value
  ctx.fillStyle = COLORS.gray
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Value:', infoX, infoY)
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 16px Arial, sans-serif'
  const valueText = data.value ? `${data.value} ${data.currency || 'USD'}` : 'N/A'
  ctx.fillText(valueText, infoX, infoY + 18)
  
  infoY += lineHeight
  
  // Date
  ctx.fillStyle = COLORS.gray
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Date:', infoX, infoY)
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText(data.certifiedAt, infoX, infoY + 18)
  
  // Patrón de ondas
  drawWavePattern(ctx, 20, 560, width - 40, 50)
  
  // Número animado en círculo
  const circleRadius = 25
  ctx.beginPath()
  ctx.arc(width / 2, 620, circleRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fill()
  ctx.strokeStyle = COLORS.white
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Número dentro del círculo (primer dígito del TBT)
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 24px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(data.tbtId.charAt(0), width / 2, 620)
  
  // Footer con logos
  ctx.fillStyle = COLORS.white
  ctx.font = 'bold 14px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('TRANSBIT', width / 2 - 60, 680)
  ctx.fillText('×', width / 2, 680)
  ctx.fillText('BROCHA', width / 2 + 60, 680)
  
  // Línea inferior
  ctx.beginPath()
  ctx.moveTo(width / 4, 700)
  ctx.lineTo(width * 3 / 4, 700)
  ctx.strokeStyle = COLORS.magenta
  ctx.lineWidth = 1
  ctx.stroke()
}

// Generar GIF animado
export async function generateCertificateGIF(data: CertificateData): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Dimensiones del certificado (vertical, móvil)
    canvas.width = 350
    canvas.height = 720
    
    const digits = data.tbtId.split('')
    const totalFrames = digits.length + 3 // Frames para cada dígito + frames finales
    
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: '/gif.worker.js'
    })
    
    // Generar frames
    for (let frame = 0; frame <= totalFrames; frame++) {
      const visibleDigits = Math.min(frame, digits.length)
      await drawCertificateFrame(canvas, ctx, data, visibleDigits)
      
      // Delay más largo para el último frame
      const delay = frame === totalFrames ? 2000 : 150
      gif.addFrame(ctx, { copy: true, delay })
    }
    
    gif.on('finished', (blob: Blob) => {
      resolve(blob)
    })
    
    gif.on('error', (error: Error) => {
      reject(error)
    })
    
    gif.render()
  })
}

// Generar imagen estática PNG (para compatibilidad)
export async function generateCertificateImage(data: CertificateData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.width = 350
  canvas.height = 720
  
  await drawCertificateFrame(canvas, ctx, data, data.tbtId.length)
  
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

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TBT - Tokens Transferibles Facturables',
  description: 'Certifica, protege y monetiza tus obras creativas con blockchain accesible.',
  keywords: ['TBT', 'arte', 'blockchain', 'certificación', 'BROCHA', 'NFT alternativo'],
  authors: [{ name: 'Transbit & BROCHA' }],
  openGraph: {
    title: 'TBT - Tokens Transferibles Facturables',
    description: 'Certifica, protege y monetiza tus obras creativas.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-tbt-bg">
        <div className="relative min-h-screen">
          {/* Fondo con gradiente y patrón */}
          <div className="fixed inset-0 bg-gradient-tbt" />
          <div className="fixed inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />
          
          {/* Orbes decorativos */}
          <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-tbt-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-tbt-secondary/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          
          {/* Contenido */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

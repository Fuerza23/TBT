import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Navbar user={null} />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="text-8xl mb-6">🎨</div>
          
          <h1 className="text-4xl font-display font-bold text-tbt-text mb-4">
            Página no encontrada
          </h1>
          
          <p className="text-tbt-muted mb-8">
            La página que buscas no existe o el TBT no ha sido certificado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              <Home className="w-5 h-5" />
              Ir al inicio
            </Link>
            <Link href="/verificar" className="btn-secondary">
              <Search className="w-5 h-5" />
              Verificar TBT
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

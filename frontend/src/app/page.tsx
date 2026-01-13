import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Logo } from '@/components/ui/Logo'
import { Shield, Repeat, Wallet, Smartphone, ArrowRight, Check, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navbar user={null} />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center animate-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tbt-primary/10 border border-tbt-primary/20 mb-8">
                <Sparkles className="w-4 h-4 text-tbt-primary" />
                <span className="text-sm text-tbt-primary font-medium">Transbit × BROCHA</span>
              </div>

              {/* Título principal */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-tight">
                <span className="text-tbt-text">Certifica tu arte.</span>
                <br />
                <span className="text-gradient">Cobra siempre.</span>
              </h1>

              {/* Subtítulo */}
              <p className="text-lg sm:text-xl text-tbt-muted max-w-2xl mx-auto mb-10 animate-in-delay-1">
                Los <strong className="text-tbt-text">Tokens Transferibles Facturables</strong> protegen 
                tu obra y te garantizan regalías en cada transferencia — sin cripto, sin billeteras.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in-delay-2">
                <Link href="/registro" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                  Crear mi primer TBT
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/verificar" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  Verificar una obra
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 animate-in-delay-3">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-tbt-text">100%</div>
                  <div className="text-sm text-tbt-muted">Sin cripto</div>
                </div>
                <div className="w-px h-10 bg-tbt-border" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-tbt-text">📱</div>
                  <div className="text-sm text-tbt-muted">Desde tu celular</div>
                </div>
                <div className="w-px h-10 bg-tbt-border" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-tbt-gold">∞</div>
                  <div className="text-sm text-tbt-muted">Regalías</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decoración - obra de arte abstracta */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-tbt-border to-transparent" />
        </section>

        {/* ¿Cómo funciona? */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-tbt-muted max-w-xl mx-auto">
                Cuatro pasos simples para proteger y monetizar tu arte
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: Smartphone,
                  title: 'Regístrate',
                  description: 'Solo necesitas tu email o teléfono. Sin billeteras, sin cripto.',
                },
                {
                  step: '02',
                  icon: Shield,
                  title: 'Certifica',
                  description: 'Sube tu obra, describe tu arte, y obtén tu TBT único.',
                },
                {
                  step: '03',
                  icon: Repeat,
                  title: 'Transfiere',
                  description: 'Vende o regala tu obra. El historial queda registrado.',
                },
                {
                  step: '04',
                  icon: Wallet,
                  title: 'Cobra regalías',
                  description: 'Cada vez que tu obra cambie de manos, recibes tu parte.',
                },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="card-hover group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-accent/10 flex items-center justify-center group-hover:bg-gradient-accent/20 transition-colors">
                      <item.icon className="w-6 h-6 text-tbt-primary" />
                    </div>
                    <span className="text-5xl font-bold text-tbt-border/50 font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-tbt-text mb-2">
                    {item.title}
                  </h3>
                  <p className="text-tbt-muted text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-24 bg-tbt-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-6">
                  El arte genera ingresos 
                  <span className="text-gradient"> al moverse</span>
                </h2>
                <p className="text-tbt-muted mb-8">
                  A diferencia de los NFTs tradicionales, los TBTs aplican y exigen el pago de 
                  regalías <strong className="text-tbt-text">antes</strong> de que ocurra la 
                  transferencia. El artista cobra primero.
                </p>

                <ul className="space-y-4">
                  {[
                    'Regalías garantizadas en cada reventa',
                    'Sin necesidad de billetera cripto',
                    'Funciona con email, SMS o chat',
                    'Historial de propiedad verificable',
                    'Certificados con código QR',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-tbt-success/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-tbt-success" />
                      </div>
                      <span className="text-tbt-text">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ejemplo de certificado */}
              <div className="certificate p-8 glow-gold">
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 text-tbt-gold mb-2">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wider">
                        Certificado de Autenticidad
                      </span>
                    </div>
                    <div className="w-16 h-px bg-tbt-gold/30 mx-auto" />
                  </div>

                  {/* Imagen placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-tbt-primary/20 to-tbt-secondary/20 rounded-xl mb-6 flex items-center justify-center">
                    <span className="text-6xl">🎨</span>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="font-display text-2xl font-bold text-tbt-text mb-1">
                      "Amanecer en Bogotá"
                    </h3>
                    <p className="text-tbt-muted">por Sara Alarcón</p>
                  </div>

                  <div className="bg-tbt-bg/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-tbt-muted">TBT ID</span>
                      <span className="font-mono text-tbt-primary">TBT-2026-A7X9K2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-tbt-muted">Propietario</span>
                      <span className="text-tbt-text">Juan Pérez</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-tbt-muted">Desde</span>
                      <span className="text-tbt-text">12 Ene 2026</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-lg p-1">
                      {/* QR placeholder */}
                      <div className="w-full h-full bg-tbt-bg rounded grid grid-cols-4 grid-rows-4 gap-0.5 p-1">
                        {[...Array(16)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`rounded-sm ${Math.random() > 0.5 ? 'bg-tbt-text' : 'bg-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-tbt-muted">Verificar en</p>
                      <p className="text-sm text-tbt-primary font-mono">tbt.cafe/work/...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Logo size="lg" showText={false} />
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mt-8 mb-4">
              Tu arte merece protección
            </h2>
            <p className="text-tbt-muted mb-8 max-w-xl mx-auto">
              Únete a los artistas que ya están certificando sus obras y 
              recibiendo regalías justas por cada transferencia.
            </p>
            <Link href="/registro" className="btn-primary text-lg px-10 py-4">
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-tbt-border py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <Logo size="sm" />
                <span className="text-sm text-tbt-muted">
                  Una colaboración entre Transbit y BROCHA
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-tbt-muted">
                <a href="https://transb.it" target="_blank" rel="noopener" className="hover:text-tbt-text transition-colors">
                  Transb.it
                </a>
                <a href="https://brocha.art" target="_blank" rel="noopener" className="hover:text-tbt-text transition-colors">
                  BROCHA
                </a>
                <Link href="/terminos" className="hover:text-tbt-text transition-colors">
                  Términos
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

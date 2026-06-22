'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertTriangle } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#12121a] flex items-center justify-center p-4 font-montserrat">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-10">
          <Image src="/logos/TBTLogoPopUp.svg" alt="TBT" width={69} height={28} priority />
        </div>

        {/* Warning icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#4a4a1a] flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-yellow-400 text-xl font-bold text-center mb-4">
          Proceso Cancelado
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-sm text-center leading-relaxed mb-6">
          En este momento no podemos registrar esta pieza. Te ayudamos con ello en los proximos día, poniendonos en contacto al correo registrado
        </p>

        {/* Thanks */}
        <p className="text-white text-base font-bold text-center mb-12">
          Muchas Gracias.
        </p>

        {/* Close button */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-full bg-[#EF1385] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  )
}

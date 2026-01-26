import { useState } from 'react'

export interface ContextData {
  location: string
  coordinates: { lat: number; lng: number } | null
  weather: string
  headlines: string[]
  aiSummary: string
  userEditedSummary: string
  signaturePhone: string
  isSigned: boolean
}

const initialContextData: ContextData = {
  location: '',
  coordinates: null,
  weather: '',
  headlines: [],
  aiSummary: '',
  userEditedSummary: '',
  signaturePhone: '',
  isSigned: false,
}

export function useContextEngine() {
  const [contextData, setContextData] = useState<ContextData>(initialContextData)

  const updateContext = (updates: Partial<ContextData>) => {
    setContextData(prev => ({ ...prev, ...updates }))
  }

  const resetContext = () => {
    setContextData(initialContextData)
  }

  const generateContext = async (): Promise<void> => {
    // Simulate context generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockContext = {
      location: 'Bogotá, Colombia',
      coordinates: { lat: 4.711, lng: -74.072 },
      weather: '18°C, Parcialmente nublado',
      headlines: [
        'Arte colombiano alcanza récord en subasta internacional',
        'Festival de arte digital se celebra en Medellín'
      ],
      aiSummary: `Esta obra fue creada el ${new Date().toLocaleDateString('es-CO')} en Bogotá, Colombia, bajo un clima de 18°C parcialmente nublado. El contexto cultural del momento incluye un creciente interés en el arte digital y tradicional colombiano.`,
    }

    updateContext({
      ...mockContext,
      userEditedSummary: mockContext.aiSummary,
    })
  }

  const validateContext = (): string | null => {
    if (!contextData.isSigned) {
      return 'Debes firmar y bloquear el contexto'
    }
    if (!contextData.signaturePhone.trim()) {
      return 'Se requiere número de teléfono para la firma'
    }
    return null
  }

  return {
    contextData,
    updateContext,
    resetContext,
    generateContext,
    validateContext,
  }
}

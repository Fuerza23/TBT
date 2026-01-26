import { useState } from 'react'

export type OriginalityType = 'original' | 'derivative' | 'authorized_edition'

export interface CommProData {
  marketPrice: string
  currency: string
  royaltyType: 'none' | 'percentage' | 'fixed'
  royaltyValue: string
  scanStatus: 'pending' | 'clean' | 'conflict'
  conflictSimilarity: number
  originalityDeclaration: OriginalityType
  derivativeReference: string
}

const initialCommProData: CommProData = {
  marketPrice: '',
  currency: 'USD',
  royaltyType: 'percentage',
  royaltyValue: '10',
  scanStatus: 'pending',
  conflictSimilarity: 0,
  originalityDeclaration: 'original',
  derivativeReference: '',
}

export const CURRENCIES = ['USD', 'EUR', 'COP', 'MXN', 'BTC', 'ETH']

export function useCommProForm() {
  const [commProData, setCommProData] = useState<CommProData>(initialCommProData)

  const updateCommPro = (updates: Partial<CommProData>) => {
    setCommProData(prev => ({ ...prev, ...updates }))
  }

  const resetCommPro = () => {
    setCommProData(initialCommProData)
  }

  const runPlagiarismScan = async (): Promise<void> => {
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    const isClean = Math.random() > 0.2
    updateCommPro({
      scanStatus: isClean ? 'clean' : 'conflict',
      conflictSimilarity: isClean ? 0 : Math.floor(Math.random() * 30) + 70
    })
  }

  const validateCommPro = (): string | null => {
    if (!commProData.marketPrice) {
      return 'Ingresa un precio de mercado'
    }
    if (commProData.scanStatus !== 'clean') {
      return 'Debes completar el escaneo de plagio'
    }
    return null
  }

  return {
    commProData,
    updateCommPro,
    resetCommPro,
    runPlagiarismScan,
    validateCommPro,
  }
}

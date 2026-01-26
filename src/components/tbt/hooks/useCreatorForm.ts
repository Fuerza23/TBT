import { useState } from 'react'

export type CreatorType = 'individual' | 'group' | 'corporation'

export interface CreatorData {
  creatorType: CreatorType
  legalName: string
  collectiveName: string
  leadRepresentative: string
  entityName: string
  taxId: string
  corporateTitle: string
  email: string
  publicAlias: string
  credentials: string
  socialLinkedin: string[]
  socialWebsite: string
  socialInstagram: string[]
  socialFacebook: string[]
  socialYoutube: string[]
  socialOther: string
  selectedSocials: string[]
  aboutCreator: string
  profilePhoto: File | null
  profilePhotoPreview: string
}

const initialCreatorData: CreatorData = {
  creatorType: 'individual',
  legalName: '',
  collectiveName: '',
  leadRepresentative: '',
  entityName: '',
  taxId: '',
  corporateTitle: '',
  email: '',
  publicAlias: '',
  credentials: '',
  socialLinkedin: [''],
  socialWebsite: '',
  socialInstagram: [''],
  socialFacebook: [''],
  socialYoutube: [''],
  socialOther: '',
  selectedSocials: [],
  aboutCreator: '',
  profilePhoto: null,
  profilePhotoPreview: '',
}

export function useCreatorForm() {
  const [creatorData, setCreatorData] = useState<CreatorData>(initialCreatorData)

  const updateCreator = (updates: Partial<CreatorData>) => {
    setCreatorData(prev => ({ ...prev, ...updates }))
  }

  const resetCreator = () => {
    setCreatorData(initialCreatorData)
  }

  const validateCreator = (): string | null => {
    if (!creatorData.email.trim()) {
      return 'El email es requerido'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creatorData.email)) {
      return 'Ingresa un email válido'
    }
    if (!creatorData.publicAlias.trim()) {
      return 'El alias público es requerido'
    }
    if (creatorData.creatorType === 'group' && !creatorData.collectiveName.trim()) {
      return 'El nombre del colectivo es requerido'
    }
    if (creatorData.creatorType === 'corporation' && !creatorData.entityName.trim()) {
      return 'El nombre de la entidad es requerido'
    }
    return null
  }

  return {
    creatorData,
    updateCreator,
    resetCreator,
    validateCreator,
  }
}

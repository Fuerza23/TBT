import { useState } from 'react'

export interface WorkData {
  title: string
  category: string
  primaryMaterial: string
  creationDate: string
  workStatus: 'publicado' | 'privado'
  isPublished: boolean
  assetLinks: string[]
  aboutWork: string
  mediaFile: File | null
  mediaPreview: string
  audioVideoFile: File | null
  audioVideoPreview: string
  audioVideoType: 'audio' | 'video' | ''
}

const initialWorkData: WorkData = {
  title: '',
  category: '',
  primaryMaterial: '',
  creationDate: '',
  workStatus: 'publicado',
  isPublished: true,
  assetLinks: ['', ''],
  aboutWork: '',
  mediaFile: null,
  mediaPreview: '',
  audioVideoFile: null,
  audioVideoPreview: '',
  audioVideoType: '',
}

export function useWorkForm() {
  const [workData, setWorkData] = useState<WorkData>(initialWorkData)

  const updateWork = (updates: Partial<WorkData>) => {
    setWorkData(prev => ({ ...prev, ...updates }))
  }

  const resetWork = () => {
    setWorkData(initialWorkData)
  }

  const validateWork = (): string | null => {
    if (!workData.title.trim()) {
      return 'El título de la obra es requerido'
    }
    if (!workData.category) {
      return 'Selecciona una categoría'
    }
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      return 'El archivo es demasiado grande (máx 50MB)'
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      updateWork({
        mediaFile: file,
        mediaPreview: event.target?.result as string
      })
    }
    reader.readAsDataURL(file)
    return null
  }

  return {
    workData,
    updateWork,
    resetWork,
    validateWork,
    handleFileSelect,
  }
}

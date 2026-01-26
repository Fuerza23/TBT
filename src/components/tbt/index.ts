// Hooks
export { useCreatorForm, type CreatorData, type CreatorType } from './hooks/useCreatorForm'
export { useWorkForm, type WorkData } from './hooks/useWorkForm'
export { useCommProForm, type CommProData, type OriginalityType, CURRENCIES } from './hooks/useCommProForm'
export { useContextEngine, type ContextData } from './hooks/useContextEngine'
export { useMediaRecorder } from './hooks/useMediaRecorder'

// UI Components
export { CreatorTypeSelector } from './ui/CreatorTypeSelector'
export { ProfilePhotoUpload } from './ui/ProfilePhotoUpload'
export { SocialMediaInput } from './ui/SocialMediaInput'
export { ModalHeader } from './ui/ModalHeader'
export { ModalNavigation } from './ui/ModalNavigation'

// Modal
export { default as CreateTBTModalRefactored } from './CreateTBTModalRefactored'

// Constants
export const PHASES = [
  { id: 2, name: 'Creador', icon: '👤' },
  { id: 3, name: 'Obra', icon: '🎨' },
  { id: 4, name: 'Commercial Protection', icon: '🛡️' },
  { id: 5, name: 'Contexto', icon: '🌍' },
  { id: 6, name: 'Pago', icon: '💳' },
  { id: 7, name: 'Entrega', icon: '📨' },
]

export const WORK_CATEGORIES = [
  'Pintura', 'Escultura', 'Arte Digital', 'Fotografía', 
  'Ilustración', 'Script/Guión', 'Música', 'Video',
  'Técnica Mixta', 'Grabado', 'Cerámica', 'Textil', 'NFT', 'Otra'
]


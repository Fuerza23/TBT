'use client'

import { Camera, X } from 'lucide-react'
import { useRef } from 'react'

interface ProfilePhotoUploadProps {
  preview: string
  onFileSelect: (file: File, preview: string) => void
  onRemove: () => void
}

export function ProfilePhotoUpload({ preview, onFileSelect, onRemove }: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      onFileSelect(file, event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-[34%] flex justify-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-tbt-border"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-tbt-bg border border-tbt-border flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors"
          >
            <X className="w-3 h-3 text-tbt-muted hover:text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-28 h-28 rounded-full border-2 border-dashed border-tbt-border hover:border-tbt-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer"
        >
          <Camera className="w-6 h-6 text-tbt-muted mb-1" />
          <span className="text-xs text-tbt-muted">Foto</span>
        </button>
      )}
    </div>
  )
}

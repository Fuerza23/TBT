import { useState, useRef, useCallback } from 'react'

interface UseMediaRecorderOptions {
  maxDuration?: number // in seconds
  onRecordingComplete?: (blob: Blob, type: 'audio' | 'video') => void
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
  const { maxDuration = 23, onRecordingComplete } = options
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      recordingChunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const mimeType = type === 'video' ? 'video/webm' : 'audio/webm'
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        
        if (onRecordingComplete) {
          onRecordingComplete(blob, type)
        }
        
        // Cleanup
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw new Error('No se pudo acceder a la cámara/micrófono')
    }
  }, [maxDuration, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    setIsRecording(false)
    setRecordingTime(0)
  }, [])

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    maxDuration,
  }
}

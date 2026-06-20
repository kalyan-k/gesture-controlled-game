import { useEffect, useRef, useState } from 'react'
import { handTracker } from '../gestures/HandTracker'
import { GestureRecognizer } from '../gestures/GestureRecognizer'
import type { Landmark, GestureResult } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number>(0)
  const recognizer = useRef(new GestureRecognizer())
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [gestureResult, setGestureResult] = useState<GestureResult>({ gesture: 'none', confidence: 0, landmarks: [] })
  const setCameraReady = useGameStore((state) => state.setCameraReady)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function setupCamera() {
      try {
        await handTracker.initialize()
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setCameraReady(true)
            startDetection()
          }
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
      }
    }

    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      handTracker.dispose()
      setCameraReady(false)
    }
  }, [])

  const startDetection = () => {
    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const results = handTracker.detect(videoRef.current, performance.now())
        
        if (results && results.landmarks.length > 0) {
          const lms = results.landmarks[0] as Landmark[]
          setLandmarks(lms)
          
          const gResult = recognizer.current.analyze(lms, performance.now())
          setGestureResult({
            gesture: gResult.gesture,
            confidence: 1, // MediaPipe handles confidence internally via minDetectionConfidence
            landmarks: lms,
            pinchPower: gResult.pinchPower
          })
        } else {
          setLandmarks([])
          setGestureResult({ gesture: 'none', confidence: 0, landmarks: [] })
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }
    detect()
  }

  return { videoRef, landmarks, gestureResult }
}

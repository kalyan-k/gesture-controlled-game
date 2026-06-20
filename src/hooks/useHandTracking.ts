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
  const setFps = useGameStore((state) => state.setFps)
  const setCurrentGesture = useGameStore((state) => state.setCurrentGesture)
  
  // FPS tracking
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())

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
      const now = performance.now()

      // FPS calculation
      frameCountRef.current++
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)))
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }

      if (videoRef.current && videoRef.current.readyState >= 2) {
        const results = handTracker.detect(videoRef.current, now)
        
        let confidence = 0
        if (results && results.handednesses && results.handednesses.length > 0) {
          confidence = results.handednesses[0][0].score
        }

        if (results && results.landmarks.length > 0 && confidence > 0.85) {
          const lms = results.landmarks[0] as Landmark[]
          setLandmarks(lms)
          
          const gResult = recognizer.current.analyze(lms, now)
          setGestureResult({
            gesture: gResult.gesture,
            confidence: confidence,
            landmarks: lms,
            pinchPower: gResult.pinchPower
          })
          
          if (gResult.gesture !== 'none') {
            setCurrentGesture(gResult.gesture)
          } else {
            setCurrentGesture(null)
          }

        } else {
          setLandmarks([])
          setGestureResult({ gesture: 'none', confidence: 0, landmarks: [] })
          setCurrentGesture(null)
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }
    detect()
  }

  return { videoRef, landmarks, gestureResult, confidence: gestureResult.confidence }
}

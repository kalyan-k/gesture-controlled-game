import { useEffect, useRef, useState, useCallback } from 'react'
import { handTracker } from '../gestures/HandTracker'
import { GestureRecognizer } from '../gestures/GestureRecognizer'
import type { Landmark, GestureResult } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'

const IDLE_TIMEOUT_MS = 10_000 // 10 seconds of no hand → auto-pause

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number>(0)
  const recognizer = useRef(new GestureRecognizer())
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [gestureResult, setGestureResult] = useState<GestureResult>({
    gesture: 'none',
    confidence: 0,
    landmarks: [],
  })

  const { calibration } = useGameStore()

  // Keep calibration in recognizer in sync
  useEffect(() => {
    recognizer.current.setCalibration(calibration)
  }, [calibration])

  // Frame-count for FPS
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const systemGestureCooldownRef = useRef(0) // timestamp after which system gesture can fire again

  const startDetection = useCallback(() => {
    const detect = () => {
      const now = performance.now()

      // FPS
      frameCountRef.current++
      if (now - lastFpsTimeRef.current >= 1000) {
        const fps = Math.round(
          (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
        )
        useGameStore.getState().tickSession(fps)
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }

      if (videoRef.current && videoRef.current.readyState >= 2) {
        const results = handTracker.detect(videoRef.current, now)

        let confidence = 0
        if (results?.handednesses?.length) {
          confidence = results.handednesses[0][0].score
        }

        if (results?.landmarks?.length && confidence > 0.85) {
          const lms = results.landmarks[0] as Landmark[]
          setLandmarks(lms)
          useGameStore.getState().setHandDetected(true, now)

          const gResult = recognizer.current.analyze(lms, now, confidence)

          const fullResult: GestureResult = {
            gesture: gResult.gesture,
            confidence,
            landmarks: lms,
            pinchPower: gResult.pinchPower,
            isSystemGesture: gResult.isSystemGesture,
            stabilityMs: gResult.stabilityMs,
          }
          setGestureResult(fullResult)

          // Handle system gestures
          if (gResult.isSystemGesture && now > systemGestureCooldownRef.current) {
            systemGestureCooldownRef.current = now + 2000 // 2s cooldown

            const store = useGameStore.getState()
            if (gResult.gesture === 'peace_sign') {
              store.showFeedback('⚙ SETTINGS OPENED')
              setTimeout(() => store.hideFeedback(), 1000)
              store.openSettings()
            } else if (gResult.gesture === 'thumbs_up') {
              if (store.gameState === 'paused') {
                store.showFeedback('▶ GAME RESUMED')
                setTimeout(() => store.hideFeedback(), 1000)
                store.setGameState('playing')
              }
            }
          }

          // Non-system gesture → pass to game
          if (!gResult.isSystemGesture) {
            useGameStore.getState().setCurrentGesture(
              gResult.gesture !== 'none' ? gResult.gesture : null
            )
          }
        } else {
          // No hand detected
          setLandmarks([])
          setGestureResult({ gesture: 'none', confidence: 0, landmarks: [] })
          useGameStore.getState().setCurrentGesture(null)

          // Idle detection
          const store = useGameStore.getState()
          const last = store.lastHandSeenAt
          if (last && now - last > IDLE_TIMEOUT_MS) {
            if (store.gameState === 'playing' && !store.idleWarning) {
              store.setIdleWarning(true)
              store.showFeedback('✋ HAND LOST – GAME PAUSED')
              store.setGameState('paused')
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }
    detect()
  }, [])

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
            useGameStore.getState().setCameraReady(true)
            startDetection()
          }
        }
      } catch (err) {
        console.error('Camera error:', err)
      }
    }

    setupCamera()

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      handTracker.dispose()
      useGameStore.getState().setCameraReady(false)
    }
  }, [startDetection])

  return {
    videoRef,
    landmarks,
    gestureResult,
    confidence: gestureResult.confidence,
  }
}

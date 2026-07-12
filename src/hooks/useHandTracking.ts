import { useEffect, useRef, useState, useCallback } from 'react'
import { handTracker } from '../gestures/HandTracker'
import { GestureRecognizer } from '../gestures/GestureRecognizer'
import type { Landmark, GestureResult } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'
import { mapHandToPlayArea, smoothPoint } from '../game/handMapping'

/** Frames without landmarks before hand-missing pause (~0.5s at 60fps) */
const HAND_MISSING_FRAME_THRESHOLD = 30
/** Confidence threshold — lowered so edge-of-zone tracking still counts */
const TRACKING_CONFIDENCE_MIN = 0.72

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number>(0)
  const recognizer = useRef(new GestureRecognizer())
  const missingHandFramesRef = useRef(0)
  const pauseCooldownRef = useRef(0)
  const smoothedPlayRef = useRef({ x: 0.5, y: 0.5 })
  const lastPlayPositionRef = useRef({ x: 0.5, y: 0.5 })

  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [gestureResult, setGestureResult] = useState<GestureResult>({
    gesture: 'none',
    confidence: 0,
    landmarks: [],
    playPosition: { x: 0.5, y: 0.5 },
  })

  const { calibration } = useGameStore()

  useEffect(() => {
    recognizer.current.setCalibration(calibration)
  }, [calibration])

  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())

  const startDetection = useCallback(() => {
    const detect = () => {
      const now = performance.now()

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
        const hasLandmarks = Boolean(results?.landmarks?.length)

        let confidence = 0
        if (results?.handednesses?.length) {
          confidence = results.handednesses[0][0].score
        }

        const store = useGameStore.getState()
        const handVisible = hasLandmarks && confidence > TRACKING_CONFIDENCE_MIN

        if (handVisible) {
          missingHandFramesRef.current = 0

          const lms = results!.landmarks![0] as Landmark[]
          setLandmarks(lms)
          store.setHandDetected(true, now)

          if (store.handMissingPause && store.stage === 'PLAYING') {
            store.setHandMissingPause(false)
            store.setPaused(false)
          }

          const gResult = recognizer.current.analyze(lms, now, confidence, {
            pauseEnabled: store.stage === 'PLAYING' && !store.handMissingPause,
            trainingMode: store.stage === 'TRAINING_INTRO',
          })

          // Map camera subset → full play area (stay in comfort zone)
          const mapped = mapHandToPlayArea(gResult.handCenter)
          smoothedPlayRef.current = smoothPoint(smoothedPlayRef.current, mapped, 0.4)
          lastPlayPositionRef.current = smoothedPlayRef.current

          setGestureResult({
            gesture: gResult.gesture,
            confidence,
            landmarks: lms,
            handCenter: gResult.handCenter,
            playPosition: { ...smoothedPlayRef.current },
            isSystemGesture: gResult.isSystemGesture,
            stabilityMs: gResult.stabilityMs,
          })

          if (
            gResult.isSystemGesture &&
            gResult.gesture === 'pause_toggle' &&
            now > pauseCooldownRef.current &&
            store.stage === 'PLAYING'
          ) {
            pauseCooldownRef.current = now + 2000
            const wasPaused = store.isPaused
            store.togglePause()
            store.showFeedback(wasPaused ? '▶ RESUMED' : '⏸ PAUSED')
            setTimeout(() => store.hideFeedback(), 1000)
          }

          const displayGesture = gResult.gesture === 'pause_toggle' ? null : gResult.gesture
          store.setCurrentGesture(displayGesture !== 'none' ? displayGesture : null)
        } else {
          missingHandFramesRef.current++
          setLandmarks([])

          const inGrace = missingHandFramesRef.current < HAND_MISSING_FRAME_THRESHOLD

          if (inGrace) {
            // Brief dropout: keep last aim position, don't pause yet
            store.setHandDetected(false, now)
            setGestureResult({
              gesture: 'none',
              confidence: 0,
              landmarks: [],
              playPosition: { ...lastPlayPositionRef.current },
            })
            store.setCurrentGesture(null)
          } else {
            setGestureResult({
              gesture: 'none',
              confidence: 0,
              landmarks: [],
              playPosition: { ...lastPlayPositionRef.current },
            })
            store.setHandDetected(false, now)
            store.setCurrentGesture(null)

            if (store.stage === 'PLAYING' && !store.handMissingPause) {
              store.setHandMissingPause(true)
              store.setPaused(true)
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

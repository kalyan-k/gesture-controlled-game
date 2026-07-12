import { useEffect, useRef, useState, useCallback } from 'react'
import { handTracker } from '../gestures/HandTracker'
import { GestureRecognizer } from '../gestures/GestureRecognizer'
import type { Landmark, GestureResult } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'
import { useBlockBreakerStore } from '../store/blockBreakerStore'
import { mapHandToPaddleX, mapHandToPlayArea, smoothPoint, clamp01 } from '../game/handMapping'

const SPELLCASTER_MISSING_FRAMES = 30
const BLOCK_BREAKER_MISSING_FRAMES = 8
const TRACKING_CONFIDENCE_MIN = 0.72
const BLOCK_BREAKER_CONFIDENCE_MIN = 0.58

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number>(0)
  const recognizer = useRef(new GestureRecognizer())
  const missingHandFramesRef = useRef(0)
  const pauseCooldownRef = useRef(0)
  const smoothedPlayRef = useRef({ x: 0.5, y: 0.5 })
  const lastPlayPositionRef = useRef({ x: 0.5, y: 0.5 })
  const lastPaddleXRef = useRef(0.5)

  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [gestureResult, setGestureResult] = useState<GestureResult>({
    gesture: 'none',
    confidence: 0,
    landmarks: [],
    playPosition: { x: 0.5, y: 0.5 },
    paddleX: 0.5,
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

        const appStore = useGameStore.getState()
        const isBlockBreaker = appStore.selectedGame === 'block_breaker'
        const missingThreshold = isBlockBreaker
          ? BLOCK_BREAKER_MISSING_FRAMES
          : SPELLCASTER_MISSING_FRAMES
        const handVisible = hasLandmarks && confidence > (isBlockBreaker ? BLOCK_BREAKER_CONFIDENCE_MIN : TRACKING_CONFIDENCE_MIN)

        if (handVisible) {
          missingHandFramesRef.current = 0

          const lms = results!.landmarks![0] as Landmark[]
          setLandmarks(lms)
          appStore.setHandDetected(true, now)

          const gResult = recognizer.current.analyze(lms, now, confidence, {
            pauseEnabled:
              !isBlockBreaker &&
              appStore.stage === 'PLAYING' &&
              !appStore.handMissingPause,
            trainingMode: !isBlockBreaker && appStore.stage === 'TRAINING_INTRO',
          })

          if (isBlockBreaker) {
            const bb = useBlockBreakerStore.getState()
            const paddleX = clamp01(mapHandToPaddleX(gResult.handCenter))
            lastPaddleXRef.current = paddleX

            if (bb.handMissingPause && bb.stage === 'PLAYING') {
              bb.setHandMissingPause(false)
              bb.setPaused(false)
            }

            setGestureResult({
              gesture: gResult.gesture,
              confidence,
              landmarks: lms,
              handCenter: gResult.handCenter,
              paddleX,
              stabilityMs: gResult.stabilityMs,
            })
            appStore.setCurrentGesture(
              gResult.gesture !== 'none' ? gResult.gesture : null
            )
          } else {
            if (appStore.handMissingPause && appStore.stage === 'PLAYING') {
              appStore.setHandMissingPause(false)
              appStore.setPaused(false)
            }

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
              appStore.stage === 'PLAYING'
            ) {
              pauseCooldownRef.current = now + 2000
              const wasPaused = appStore.isPaused
              appStore.togglePause()
              appStore.showFeedback(wasPaused ? '▶ RESUMED' : '⏸ PAUSED')
              setTimeout(() => appStore.hideFeedback(), 1000)
            }

            const displayGesture = gResult.gesture === 'pause_toggle' ? null : gResult.gesture
            appStore.setCurrentGesture(displayGesture !== 'none' ? displayGesture : null)
          }
        } else {
          missingHandFramesRef.current++
          setLandmarks([])

          const inGrace = missingHandFramesRef.current < missingThreshold

          if (isBlockBreaker) {
            const bb = useBlockBreakerStore.getState()
            if (inGrace) {
              appStore.setHandDetected(false, now)
              setGestureResult({
                gesture: 'none',
                confidence: 0,
                landmarks: [],
                paddleX: lastPaddleXRef.current,
              })
              appStore.setCurrentGesture(null)
            } else {
              setGestureResult({
                gesture: 'none',
                confidence: 0,
                landmarks: [],
                paddleX: lastPaddleXRef.current,
              })
              appStore.setHandDetected(false, now)
              appStore.setCurrentGesture(null)
              if (bb.stage === 'PLAYING' && !bb.handMissingPause) {
                bb.setHandMissingPause(true)
              }
            }
          } else if (inGrace) {
            appStore.setHandDetected(false, now)
            setGestureResult({
              gesture: 'none',
              confidence: 0,
              landmarks: [],
              playPosition: { ...lastPlayPositionRef.current },
            })
            appStore.setCurrentGesture(null)
          } else {
            setGestureResult({
              gesture: 'none',
              confidence: 0,
              landmarks: [],
              playPosition: { ...lastPlayPositionRef.current },
            })
            appStore.setHandDetected(false, now)
            appStore.setCurrentGesture(null)

            if (appStore.stage === 'PLAYING' && !appStore.handMissingPause) {
              appStore.setHandMissingPause(true)
              appStore.setPaused(true)
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

export type HandTrackingResult = ReturnType<typeof useHandTracking>

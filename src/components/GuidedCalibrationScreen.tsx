import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Camera, CheckCircle2 } from 'lucide-react'
import { useGameStore, type CalibrationProfile } from '../store/gameStore'
import { useHandTracking } from '../hooks/useHandTracking'

type Step = 'center' | 'open_palm' | 'pinch' | 'swipe' | 'fist' | 'done'

const STEPS: { id: Step; title: string; emoji: string; instruction: string }[] = [
  { id: 'center', title: 'Center Your Hand', emoji: '✋', instruction: 'Hold your open hand in the centre of the webcam view. Keep it steady.' },
  { id: 'open_palm', title: 'Open Palm', emoji: '🖐️', instruction: 'Spread all fingers wide open. Hold for 2 seconds.' },
  { id: 'pinch', title: 'Pinch Gesture', emoji: '🤏', instruction: 'Pinch your thumb and index finger together tightly. Hold for 2 seconds.' },
  { id: 'swipe', title: 'Fast Swipe', emoji: '➡️', instruction: 'Swipe your hand quickly from left to right across the screen.' },
  { id: 'fist', title: 'Fist Gesture', emoji: '✊', instruction: 'Close all fingers into a tight fist. Hold for 2 seconds.' },
]

const EXPECTED_GESTURES: Record<Step, { names: string[]; label: string }> = {
  center: { names: ['shield', 'smash', 'pinch', 'swipe_left', 'swipe_right', 'none'], label: 'Any Pose (Centered)' },
  open_palm: { names: ['shield'], label: 'Open Palm (Shield)' },
  pinch: { names: ['pinch'], label: 'Pinch' },
  swipe: { names: ['swipe_left', 'swipe_right', 'swipe'], label: 'Swipe' },
  fist: { names: ['smash'], label: 'Fist (Smash)' },
  done: { names: [], label: 'Completed' },
}

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
]

export function GuidedCalibrationScreen() {
  const [stepIdx, setStepIdx] = useState(0)
  const { updateCalibration, setCalibrated, setGameState } = useGameStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holding, setHolding] = useState(false)

  // Initialize live hand tracking on the calibration screen
  const { videoRef, landmarks, gestureResult, confidence } = useHandTracking()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const currentStep = STEPS[stepIdx]

  // Draw skeleton overlay on camera canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (landmarks.length > 0) {
      const isLight = useGameStore.getState().settings.theme === 'light'
      ctx.strokeStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 4
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
      }
      ctx.fillStyle = isLight ? '#00b37d' : '#00ffb3'
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [landmarks])

  function captureAndAdvance() {
    if (holding) return
    setHolding(true)

    timerRef.current = setTimeout(() => {
      setHolding(false)
      if (stepIdx < STEPS.length - 1) {
        setStepIdx((i) => i + 1)
      } else {
        finishCalibration()
      }
    }, 1800)
  }

  function finishCalibration() {
    const profile: CalibrationProfile = {
      pinchThreshold: 0.04,
      fistCurlRatio: 0.8,
      swipeMinDist: 0.14,
      swipeMinVel: 0.0013,
      palmExtendRatio: 1.08,
    }
    updateCalibration(profile)
    setCalibrated(true)
    setGameState('ready')
  }

  const progress = (stepIdx / STEPS.length) * 100

  // Check if active hand matches current step target gesture
  const activeGesture = gestureResult.gesture
  const expected = EXPECTED_GESTURES[currentStep.id]
  const isMatching = expected.names.includes(activeGesture)

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden p-6"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,77,255,0.07) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-5xl flex flex-col items-center gap-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Gesture Calibration
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }} className="mt-1 text-sm">
            Step {stepIdx + 1} of {STEPS.length} — customize thresholds to your hand
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--color-primary)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Step checklist badges */}
        <div className="w-full flex gap-2 justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300`}
                style={{
                  background: i < stepIdx ? 'var(--color-accent)' : i === stepIdx ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'var(--color-bg)',
                  outline: i === stepIdx ? '2px solid var(--color-primary)' : 'none',
                }}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block truncate max-w-full text-center"
                style={{ color: i === stepIdx ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {s.id.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Split Column Panel: Camera Feed (Left) & Controls (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-stretch mt-2">

          {/* Left Column: Live Camera Mirror with skeleton */}
          <div className="glass rounded-3xl p-4 flex flex-col gap-3 items-center justify-center relative border-themed min-h-[300px] md:min-h-[400px]">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              <Camera className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                LIVE CALIBRATION CAMERA
              </span>
            </div>

            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative"
              style={{ border: '1px solid var(--color-border)' }}>
              <video ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                playsInline muted />
              <canvas ref={canvasRef} width={640} height={480}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              
              {/* Overlay matching state */}
              {confidence <= 0.85 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 p-4 text-center">
                  <span className="text-sm font-mono animate-pulse" style={{ color: 'var(--color-danger)' }}>
                    ✋ Hand not detected or out of bounds. Show hand.
                  </span>
                </div>
              )}
            </div>

            {/* Gesture feedback bar */}
            <div className="w-full flex items-center justify-between px-2 pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Detected Gesture
                </span>
                <span className="text-lg font-mono font-black uppercase" style={{ color: activeGesture !== 'none' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {activeGesture === 'none' ? 'Waiting...' : activeGesture.replace('_', ' ')}
                </span>
              </div>

              {confidence > 0.85 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Signal Quality
                  </span>
                  <div className="text-sm font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
                    {Math.round(confidence * 100)}% Match
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Steps, details & Capture action */}
          <div className="glass rounded-3xl p-8 flex flex-col justify-between items-center text-center relative border-themed">
            <div className="w-full flex flex-col items-center gap-6 my-auto">
              <motion.span
                className="text-8xl"
                animate={{ scale: holding ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: holding ? Infinity : 0, duration: 0.6 }}
              >
                {currentStep.emoji}
              </motion.span>

              <div>
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text)' }}>
                  {currentStep.title}
                </h2>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-sm leading-relaxed max-w-sm">
                  {currentStep.instruction}
                </p>
              </div>

              {/* Match Feedback Badge */}
              {confidence > 0.85 && (
                <div className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                  style={{
                    background: isMatching ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    borderColor: isMatching ? '#10b981' : '#f59e0b',
                    color: isMatching ? '#10b981' : '#f59e0b',
                  }}>
                  {isMatching ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-4 h-4" /> Expected Gesture Detected!
                    </span>
                  ) : (
                    <span>Make {expected.label} pose</span>
                  )}
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-4 mt-6">
              {holding ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: 'var(--color-primary)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest uppercase" style={{ color: 'var(--color-primary)' }}>
                    Analyzing Pose... Hold steady
                  </span>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={captureAndAdvance}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black tracking-widest uppercase text-base"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-bg)',
                    boxShadow: '0 0 20px rgba(0,229,255,0.2)',
                  }}
                >
                  {stepIdx === STEPS.length - 1 ? 'Finish Calibration' : 'Capture Gesture'}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}

              {/* Skip option */}
              <button
                className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={finishCalibration}
              >
                Skip calibration (use defaults)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

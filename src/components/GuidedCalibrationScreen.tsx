import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useGameStore, type CalibrationProfile } from '../store/gameStore'

type Step = 'center' | 'open_palm' | 'pinch' | 'swipe' | 'fist' | 'done'

const STEPS: { id: Step; title: string; emoji: string; instruction: string }[] = [
  { id: 'center', title: 'Center Your Hand', emoji: '✋', instruction: 'Hold your open hand in the centre of the webcam view. Keep it steady.' },
  { id: 'open_palm', title: 'Open Palm', emoji: '🖐️', instruction: 'Spread all fingers wide open. Hold for 2 seconds.' },
  { id: 'pinch', title: 'Pinch Gesture', emoji: '🤏', instruction: 'Pinch your thumb and index finger together tightly. Hold for 2 seconds.' },
  { id: 'swipe', title: 'Fast Swipe', emoji: '➡️', instruction: 'Swipe your hand quickly from left to right across the screen.' },
  { id: 'fist', title: 'Fist Gesture', emoji: '✊', instruction: 'Close all fingers into a tight fist. Hold for 2 seconds.' },
]

export function GuidedCalibrationScreen() {
  const [stepIdx, setStepIdx] = useState(0)
  const [captured, setCaptured] = useState<Step[]>([])
  const { updateCalibration, setCalibrated, setGameState } = useGameStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holding, setHolding] = useState(false)

  const currentStep = STEPS[stepIdx]

  function captureAndAdvance() {
    if (holding) return
    setHolding(true)
    setCaptured((c) => [...c, currentStep.id])

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

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,77,255,0.07) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-xl px-6 flex flex-col items-center gap-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Gesture Calibration
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }} className="mt-1 text-sm">
            Step {stepIdx + 1} of {STEPS.length} — personalising your thresholds
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

        {/* Step list */}
        <div className="w-full flex gap-2 justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                captured.includes(s.id)
                  ? 'bg-green-500 text-white'
                  : i === stepIdx
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-30'
              }`}
                style={{
                  background: i < stepIdx ? 'var(--color-accent)' : i === stepIdx ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'var(--color-bg)',
                  outline: i === stepIdx ? '2px solid var(--color-primary)' : 'none',
                }}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block"
                style={{ color: i === stepIdx ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {s.id.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Current Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="glass rounded-3xl p-8 w-full flex flex-col items-center gap-6 text-center"
          >
            <motion.span
              className="text-7xl"
              animate={{ scale: holding ? [1, 1.15, 1] : 1 }}
              transition={{ repeat: holding ? Infinity : 0, duration: 0.6 }}
            >
              {currentStep.emoji}
            </motion.span>

            <div>
              <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text)' }}>
                {currentStep.title}
              </h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {currentStep.instruction}
              </p>
            </div>

            {holding ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--color-primary)' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                  Capturing…
                </span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={captureAndAdvance}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold tracking-widest uppercase text-sm"
                style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                {stepIdx === STEPS.length - 1 ? 'Finish Calibration' : 'Capture & Continue'}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip */}
        <button
          className="text-sm underline opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={finishCalibration}
        >
          Skip calibration (use defaults)
        </button>
      </motion.div>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { GESTURE_HELP, SPELL_LABELS, TRAINING_GESTURES } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'
import { audio } from '../hooks/useAudio'
import { Check, Sparkles } from 'lucide-react'

const GESTURE_DISPLAY: Record<string, string> = {
  fist: 'Tight Fist (Fire)',
  open_palm: 'Open Palm (Shield)',
  l_shape: 'L-Shape (Lightning)',
  rock_on: 'Horns Sign (Earth)',
  ok_sign: 'OK Sign (Water)',
  none: 'No gesture detected',
}

export function TrainingIntroOverlay() {
  const trainingGestures = useGameStore((s) => s.trainingGestures)
  const trainingComplete = TRAINING_GESTURES.every((g) => trainingGestures[g])
  const startAssault = useGameStore((s) => s.startAssault)
  const skipTrainingOnRetry = useGameStore((s) => s.skipTrainingOnRetry)
  const currentGesture = useGameStore((s) => s.currentGesture)
  const isHandDetected = useGameStore((s) => s.isHandDetected)

  const remaining = TRAINING_GESTURES.filter((g) => !trainingGestures[g]).length

  if (skipTrainingOnRetry) return null

  const liveLabel = currentGesture
    ? GESTURE_DISPLAY[currentGesture] ?? currentGesture
    : isHandDetected
      ? 'Hold a gesture steady…'
      : 'Show your hand to the camera'

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 max-w-md w-full mx-4 pointer-events-auto border-themed"
        style={{ borderColor: 'rgba(0,229,255,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>
            Welcome to Spellcaster&apos;s to attack Enemies
          </h2>
        </div>

        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Perform each of the <b>5 spell gestures</b> below to unlock the battle.
          Pause/Resume is only needed during gameplay — not for training.
        </p>

        {/* Live detection feedback */}
        <div
          className="mb-4 px-3 py-2 rounded-xl text-center text-xs font-bold"
          style={{
            background: currentGesture ? 'rgba(0,229,255,0.12)' : 'var(--color-glass-bg)',
            border: `1px solid ${currentGesture ? 'var(--color-primary)' : 'var(--color-border)'}`,
            color: currentGesture ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          Detecting: {liveLabel}
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {TRAINING_GESTURES.map((gesture) => {
            const done = trainingGestures[gesture]
            const info = SPELL_LABELS[gesture]
            const help = GESTURE_HELP[gesture]
            const isLive = currentGesture === gesture
            return (
              <div
                key={gesture}
                className="flex items-start gap-3 p-2.5 rounded-xl transition-all"
                style={{
                  background: done
                    ? 'rgba(0,255,179,0.1)'
                    : isLive
                      ? 'rgba(0,229,255,0.08)'
                      : 'var(--color-glass-bg)',
                  border: `1px solid ${done ? 'var(--color-accent)' : isLive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: done ? 'var(--color-accent)' : 'transparent',
                    border: done ? 'none' : '2px solid var(--color-border)',
                  }}
                >
                  {done && <Check className="w-3 h-3" style={{ color: 'var(--color-bg)' }} />}
                </div>
                <span className="text-base shrink-0">{info.emoji}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold" style={{ color: done ? 'var(--color-accent)' : 'var(--color-text)' }}>
                    {info.name} ({info.element})
                  </span>
                  <span className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {help.howTo}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <AnimatePresence>
          {trainingComplete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                audio.unlock()
                audio.playClick()
                startAssault()
              }}
              className="w-full py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase cursor-pointer"
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: '2px solid rgba(0,0,0,0.15)',
              }}
            >
              Begin Assault
            </motion.button>
          )}
        </AnimatePresence>

        {!trainingComplete && (
          <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {remaining} gesture{remaining !== 1 ? 's' : ''} remaining — hold each pose steady for a moment
          </p>
        )}

        <button
          onClick={() => {
            audio.unlock()
            audio.playClick()
            startAssault()
          }}
          className="w-full mt-3 py-2 text-xs font-bold tracking-wide cursor-pointer rounded-xl transition-colors"
          style={{ color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}
        >
          Skip training → start battle now
        </button>
      </motion.div>
    </div>
  )
}

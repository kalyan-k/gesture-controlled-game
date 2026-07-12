import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface FeedbackItem {
  id: number
  text: string
  color: string
  isSystem: boolean
}

const SPELL_FEEDBACK: Partial<Record<string, { text: string; color: string }>> = {
  fist:      { text: '🔥 FIREBALL', color: '#f97316' },
  open_palm: { text: '🛡️ SHIELD', color: 'var(--color-secondary)' },
  l_shape:   { text: '⚡ LIGHTNING', color: '#fbbf24' },
  rock_on:   { text: '🪨 EARTH SPIKES (Horns Sign)', color: '#a16207' },
  ok_sign:   { text: '💧 WATER STREAM', color: '#38bdf8' },
}

export function GestureFeedback() {
  const currentGesture = useGameStore((s) => s.currentGesture)
  const showSystemFeedback = useGameStore((s) => s.showSystemFeedback)
  const [feedback, setFeedback] = useState<FeedbackItem | null>(null)

  useEffect(() => {
    if (!showSystemFeedback) return
    setFeedback({ id: Date.now(), text: showSystemFeedback, color: '#00ffb3', isSystem: true })
    const t = setTimeout(() => setFeedback(null), 1200)
    return () => clearTimeout(t)
  }, [showSystemFeedback])

  useEffect(() => {
    if (!currentGesture || currentGesture === 'none') return
    if (feedback?.isSystem) return

    const spellInfo = SPELL_FEEDBACK[currentGesture]
    if (spellInfo) {
      setFeedback({
        id: Date.now(),
        text: spellInfo.text,
        color: spellInfo.color,
        isSystem: false,
      })
      const t = setTimeout(() => setFeedback(null), 700)
      return () => clearTimeout(t)
    }
  }, [currentGesture, feedback?.isSystem])

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-50">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="font-black italic tracking-widest uppercase text-center px-6 py-2 rounded-2xl backdrop-blur-md"
            style={{
              color: feedback.color,
              fontSize: feedback.isSystem ? '1.5rem' : '1.8rem',
              filter: `drop-shadow(0 0 20px ${feedback.color})`,
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${feedback.color}40`,
            }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

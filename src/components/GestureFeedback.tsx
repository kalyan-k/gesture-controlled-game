import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

interface FeedbackItem {
  id: number
  text: string
  color: string
  isSystem: boolean
}

export function GestureFeedback() {
  const currentGesture = useGameStore((s) => s.currentGesture)
  const showSystemFeedback = useGameStore((s) => s.showSystemFeedback)
  const [feedback, setFeedback] = useState<FeedbackItem | null>(null)

  // System feedback (higher priority, longer duration)
  useEffect(() => {
    if (!showSystemFeedback) return
    setFeedback({
      id: Date.now(),
      text: showSystemFeedback,
      color: '#00ffb3',
      isSystem: true,
    })
    const t = setTimeout(() => setFeedback(null), 1200)
    return () => clearTimeout(t)
  }, [showSystemFeedback])

  // Gameplay gesture feedback
  useEffect(() => {
    if (!currentGesture || currentGesture === 'none') return
    // Don't overwrite system feedback
    if (feedback?.isSystem) return

    let text = ''
    let color = ''

    if (currentGesture.startsWith('swipe')) {
      const dir = currentGesture.replace('swipe_', '').toUpperCase()
      text = `SWIPE ${dir}`
      color = 'var(--color-primary)'
    } else if (currentGesture === 'smash') {
      text = 'SHOCKWAVE'
      color = 'var(--color-danger)'
    } else if (currentGesture === 'shield') {
      text = 'SHIELD ACTIVE'
      color = 'var(--color-secondary)'
    } else if (currentGesture === 'pinch') {
      text = 'ENERGY CHARGING'
      color = '#f97316'
    } else if (currentGesture === 'peace_sign') {
      text = '⚙ SETTINGS'
      color = 'var(--color-accent)'
    } else if (currentGesture === 'thumbs_up') {
      text = '▶ RESUME'
      color = 'var(--color-accent)'
    }

    if (text) {
      setFeedback({ id: Date.now(), text, color, isSystem: false })
      const t = setTimeout(() => setFeedback(null), 700)
      return () => clearTimeout(t)
    }
  }, [currentGesture])

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-50">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="font-black italic tracking-widest uppercase text-center px-6 py-2 rounded-2xl backdrop-blur-md"
            style={{
              color: feedback.color,
              fontSize: feedback.isSystem ? '2rem' : '2.2rem',
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

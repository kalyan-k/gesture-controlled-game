import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function GestureFeedback() {
  const currentGesture = useGameStore((state) => state.currentGesture)
  const [feedback, setFeedback] = useState<{ id: number; text: string; color: string } | null>(null)

  useEffect(() => {
    if (!currentGesture || currentGesture === 'none') return

    let text = ''
    let color = ''

    if (currentGesture.startsWith('swipe')) {
      text = 'SWIPE ATTACK'
      color = 'text-primary'
    } else if (currentGesture === 'smash') {
      text = 'SHOCKWAVE'
      color = 'text-danger'
    } else if (currentGesture === 'shield') {
      text = 'SHIELD ACTIVATED'
      color = 'text-secondary'
    } else if (currentGesture === 'pinch') {
      text = 'ENERGY CHARGING'
      color = 'text-orange-400'
    }

    if (text) {
      setFeedback({ id: Date.now(), text, color })
      
      const timer = setTimeout(() => {
        setFeedback(null)
      }, 800) // Duration
      return () => clearTimeout(timer)
    }
  }, [currentGesture])

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-50">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`font-black text-4xl italic tracking-widest uppercase ${feedback.color} filter drop-shadow-[0_0_15px_currentColor] bg-black/40 px-6 py-2 rounded-2xl backdrop-blur-sm border border-current/30`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

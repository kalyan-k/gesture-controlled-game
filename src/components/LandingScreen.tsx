import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Hand, ChevronRight } from 'lucide-react'

export function LandingScreen() {
  const setGameState = useGameStore((s) => s.setGameState)

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,229,255,0.06) 0%, transparent 80%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 70%, rgba(124,77,255,0.05) 0%, transparent 70%)' }} />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 flex flex-col items-center text-center px-6 max-w-2xl"
      >
        {/* Icon */}
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Hand className="w-24 h-24" style={{ color: 'var(--color-primary)' }} />
          </motion.div>
          <div className="absolute inset-0 blur-2xl rounded-full opacity-30"
            style={{ background: 'var(--color-primary)' }} />
        </div>

        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-3 leading-none"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 50%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(0,229,255,0.3))',
          }}>
          HAND STRIKE
        </h1>

        <p className="text-xl mb-3 font-light" style={{ color: 'var(--color-text-muted)' }}>
          Your hand is the weapon. Destroy targets. Survive.
        </p>
        <p className="text-sm mb-12" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
          Requires webcam • Hand tracking powered by MediaPipe
        </p>

        <motion.button
          whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(0,229,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGameState('permissions')}
          className="flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-xl tracking-widest uppercase"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            boxShadow: '0 0 20px rgba(0,229,255,0.25)',
          }}
        >
          <Hand className="w-6 h-6" />
          Enter the Arena
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        <p className="mt-6 text-xs" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
          ✌️ Peace sign to open settings • 👍 Thumbs up to resume
        </p>
      </motion.div>
    </div>
  )
}

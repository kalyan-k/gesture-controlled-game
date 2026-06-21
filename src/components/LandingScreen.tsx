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

        <p className="text-xl mb-6 font-light" style={{ color: 'var(--color-text-muted)' }}>
          Your hand is the weapon. Destroy targets. Survive.
        </p>

        {/* ── Beautiful Gameplay Instructions Card ── */}
        <div className="glass rounded-3xl p-6 w-full max-w-xl text-left border-themed mb-8 flex flex-col gap-4">
          <h2 className="text-xs font-bold tracking-widest uppercase text-center mb-1" style={{ color: 'var(--color-primary)' }}>
            HOW TO PLAY & CONTROLS
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                🖐️ 1. Setup & Calibration
              </span>
              <span style={{ color: 'var(--color-text-muted)' }} className="leading-relaxed">
                Allow camera access, then follow the 5-step wizard to calibrate the gestures to your hand's unique sizing.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                ⚔ 2. Attack & Defense
              </span>
              <span style={{ color: 'var(--color-text-muted)' }} className="leading-relaxed">
                Use <b>Swipe</b> to slash incoming red target spheres. Hold an <b>Open Palm</b> to raise your defense shield.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                💥 3. Special Powers
              </span>
              <span style={{ color: 'var(--color-text-muted)' }} className="leading-relaxed">
                Make a tight <b>Fist</b> to release a screen-clearing shockwave. Hold <b>Pinch</b> to charge up your energy meter.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                ⚙ 4. System Shortcuts
              </span>
              <span style={{ color: 'var(--color-text-muted)' }} className="leading-relaxed">
                Form a <b>Peace Sign (✌️)</b> anytime to toggle settings. Flash a <b>Thumbs Up (👍)</b> to quickly resume or start gameplay.
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,229,255,0.4)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setGameState('permissions')}
          className="flex items-center gap-3 px-12 py-4 rounded-2xl font-black text-xl tracking-widest uppercase cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            boxShadow: '0 0 20px rgba(0,229,255,0.25)',
          }}
        >
          <Hand className="w-5 h-5" />
          Enter the Arena
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className="mt-4 text-[11px]" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
          Requires webcam for hand tracking • Processed 100% locally in your browser
        </p>
      </motion.div>
    </div>
  )
}

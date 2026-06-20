import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Hand } from 'lucide-react'

export function LandingScreen() {
  const setGameState = useGameStore((state) => state.setGameState)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-bg-dark relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center"
      >
        <div className="mb-8 relative">
          <Hand className="w-24 h-24 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary tracking-tighter mb-4 filter drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
          HAND STRIKE
        </h1>
        
        <p className="text-gray-400 text-xl mb-12 max-w-md text-center">
          Your hand is the weapon. Destroy targets. Survive.
        </p>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,229,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGameState('calibration')}
          className="px-10 py-4 bg-white/5 border border-primary/30 rounded-2xl text-primary font-bold text-xl tracking-widest uppercase transition-colors hover:bg-primary/10 glass"
        >
          Initialize System
        </motion.button>
      </motion.div>
    </div>
  )
}

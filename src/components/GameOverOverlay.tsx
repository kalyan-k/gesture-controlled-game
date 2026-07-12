import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { audio } from '../hooks/useAudio'

export function GameOverOverlay() {
  const score = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const maxComboMultiplier = useGameStore((s) => s.maxComboMultiplier)
  const retryFromGameOver = useGameStore((s) => s.retryFromGameOver)
  const stage = useGameStore((s) => s.stage)

  if (stage !== 'GAME_OVER') return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'rgba(5,8,22,0.92)', backdropFilter: 'blur(16px)' }}
    >
      <motion.h1
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="font-black text-center leading-none mb-4"
        style={{
          fontSize: 'clamp(2.5rem, 10vw, 5rem)',
          backgroundImage: 'linear-gradient(180deg, var(--color-danger) 0%, #7f1d1d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(255,77,109,0.6))',
        }}
      >
        BARRIER<br />BREACHED
      </motion.h1>

      <div className="glass rounded-3xl p-8 w-full max-w-md mb-8" style={{ border: '1px solid rgba(255,77,109,0.25)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="FINAL SCORE" value={score} />
          <Stat label="HIGH SCORE" value={highScore} color="var(--color-accent)" />
          <Stat label="MAX COMBO" value={`${maxComboMultiplier.toFixed(1)}x`} color="var(--color-secondary)" />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          audio.unlock()
          audio.playClick()
          retryFromGameOver()
        }}
        className="px-12 py-4 rounded-2xl font-black text-lg tracking-widest uppercase cursor-pointer"
        style={{
          background: 'var(--color-primary)',
          color: '#ffffff',
          border: '2px solid rgba(0,0,0,0.15)',
        }}
      >
        Retry Assault
      </motion.button>

      <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Training skipped on retry — jump straight into battle
      </p>
    </motion.div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-3xl font-mono font-black" style={{ color: color ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

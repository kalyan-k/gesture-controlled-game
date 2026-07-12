import { motion } from 'framer-motion'
import { GESTURE_HELP, PAUSE_GESTURE_HELP, SPELL_LABELS, TRAINING_GESTURES } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'

export function SpellbookPanel() {
  const currentGesture = useGameStore((s) => s.currentGesture)
  const lastCast = useGameStore((s) => s.lastCastGesture)
  const stage = useGameStore((s) => s.stage)

  return (
    <div className="glass rounded-2xl p-3 border-themed">
      <h2 className="text-[10px] font-bold tracking-widest uppercase mb-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
        Spellbook &amp; Matchups
      </h2>
      {stage === 'PLAYING' && (
        <p className="text-[9px] mb-2 px-1 leading-snug" style={{ color: 'var(--color-primary)' }}>
          Aim crosshair on enemy → use the matching gesture below. Wrong spell passes through!
        </p>
      )}
      <div className="grid grid-cols-1 gap-1.5">
        {TRAINING_GESTURES.map((gesture) => {
          const info = SPELL_LABELS[gesture]
          const help = GESTURE_HELP[gesture]
          const isActive = currentGesture === gesture
          const justCast = lastCast === gesture

          return (
            <motion.div
              key={gesture}
              animate={justCast ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2 p-2 rounded-xl border transition-all duration-200"
              style={{
                background: isActive ? 'var(--color-glass-bg)' : 'var(--color-glass-bg)',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <span className="text-base w-6 text-center shrink-0">{info.emoji}</span>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>
                  {info.name}
                </span>
                <span className="text-[9px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                  {help.howTo}
                </span>
                <span
                  className="text-[9px] leading-snug font-semibold mt-0.5 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(0,255,179,0.1)', color: 'var(--color-accent)' }}
                >
                  KNOCKS OUT: {help.knocksOut}
                </span>
              </div>
              {isActive && (
                <span
                  className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 self-center animate-pulse"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                >
                  Ready
                </span>
              )}
            </motion.div>
          )
        })}

        {stage === 'PLAYING' && (
          <div
            className="flex items-start gap-2 p-2 rounded-xl border"
            style={{ background: 'var(--color-glass-bg)', borderColor: 'var(--color-border)' }}
          >
            <span className="text-base w-6 text-center shrink-0">{PAUSE_GESTURE_HELP.emoji}</span>
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>
                {PAUSE_GESTURE_HELP.name}
              </span>
              <span className="text-[9px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                {PAUSE_GESTURE_HELP.howTo}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

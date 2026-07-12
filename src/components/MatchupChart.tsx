import { ENEMY_CONFIGS } from '../game/spellcasterTypes'
import { SPELL_LABELS } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'

/** Quick-reference chart shown during gameplay */
export function MatchupChart() {
  const stage = useGameStore((s) => s.stage)
  if (stage !== 'PLAYING' && stage !== 'TRAINING_INTRO') return null

  const enemies = Object.values(ENEMY_CONFIGS)

  return (
    <div className="glass rounded-2xl p-2.5 border-themed">
      <h2 className="text-[10px] font-bold tracking-widest uppercase mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
        Enemy Weakness Chart
      </h2>
      <div className="grid grid-cols-1 gap-1">
        {enemies.map((e) => {
          const spell = SPELL_LABELS[e.weakTo]
          return (
            <div
              key={e.type}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px]"
              style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-border)' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: e.color, boxShadow: `0 0 6px ${e.color}` }}
              />
              <span className="font-bold flex-1" style={{ color: 'var(--color-text)' }}>
                {e.label}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>({e.element})</span>
              <span className="font-bold shrink-0" style={{ color: 'var(--color-accent)' }}>
                {spell.emoji} {spell.name}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[8px] mt-2 px-1 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
        Each enemy has ONE counter gesture. Aim your crosshair on it, hold the gesture ~½ sec, then cast.
      </p>
    </div>
  )
}

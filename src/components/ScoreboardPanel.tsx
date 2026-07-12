import { useGameStore } from '../store/gameStore'
import { Shield, Zap, Trophy } from 'lucide-react'

export function ScoreboardPanel() {
  const {
    score, highScore, comboMultiplier, maxComboMultiplier,
    barrierHealth, stage, fps,
  } = useGameStore()

  return (
    <div className="glass rounded-2xl p-3 border-themed flex flex-col gap-2">
      <h2 className="text-[10px] font-bold tracking-widest uppercase px-1" style={{ color: 'var(--color-text-muted)' }}>
        Live Scoreboard
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <StatBox icon={<Trophy className="w-3 h-3" />} label="Score" value={score} />
        <StatBox icon={<Trophy className="w-3 h-3" />} label="High Score" value={highScore} accent="var(--color-accent)" />
        <StatBox icon={<Zap className="w-3 h-3" />} label="Combo" value={`${comboMultiplier.toFixed(1)}x`} accent="var(--color-secondary)" />
        <StatBox label="Max Combo" value={`${maxComboMultiplier.toFixed(1)}x`} />
      </div>

      <div className="mt-1">
        <div className="flex justify-between items-center mb-1 px-0.5">
          <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <Shield className="w-3 h-3" /> Barrier Health
          </span>
          <span className="text-[10px] font-bold font-mono" style={{
            color: barrierHealth > 50 ? 'var(--color-accent)' : barrierHealth > 25 ? '#fbbf24' : 'var(--color-danger)',
          }}>
            {Math.round(barrierHealth)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${barrierHealth}%`,
              background: barrierHealth > 50
                ? 'linear-gradient(90deg, var(--color-accent), #00e5ff)'
                : barrierHealth > 25
                  ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                  : 'linear-gradient(90deg, var(--color-danger), #7f1d1d)',
              boxShadow: `0 0 8px ${barrierHealth > 50 ? 'rgba(0,255,179,0.5)' : 'rgba(255,77,109,0.5)'}`,
            }}
          />
        </div>
      </div>

      {stage === 'PLAYING' && (
        <div className="text-[9px] font-mono text-right" style={{ color: 'var(--color-text-muted)' }}>
          {fps} FPS
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, icon, accent }: {
  label: string
  value: string | number
  icon?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="p-2 rounded-xl" style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-border)' }}>
      <span className="text-[8px] font-bold tracking-widest flex items-center gap-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {icon} {label}
      </span>
      <span className="text-base font-mono font-black leading-tight" style={{ color: accent ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

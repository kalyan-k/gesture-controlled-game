import { Camera, Settings, Heart, Trophy, Target } from 'lucide-react'
import { useGameStore } from '../../store/gameStore'
import { useBlockBreakerStore } from '../../store/blockBreakerStore'
import type { RefObject } from 'react'

interface BlockBreakerLeftPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  confidence: number
  isReady: boolean
  handCenter: { x: number; y: number } | null
  paddleX: number | null
}

export function BlockBreakerLeftPanel({
  videoRef,
  canvasRef,
  confidence,
  isReady,
  handCenter,
  paddleX,
}: BlockBreakerLeftPanelProps) {
  const { settings, fps } = useGameStore()
  const { score, highScore, lives, level } = useBlockBreakerStore()
  const isDark = settings.theme === 'dark'

  return (
    <div
      className="col-span-1 flex flex-col gap-2 h-full overflow-y-auto p-2 z-20"
      style={{ color: 'var(--color-text)' }}
    >
      <div className="glass rounded-2xl p-2.5 flex flex-col gap-2 border-themed">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              CAMERA FEED
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{fps} FPS</span>
            <div
              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: confidence > 0.58 ? 'rgba(0,255,179,0.15)' : 'rgba(255,77,109,0.15)',
                color: confidence > 0.58 ? 'var(--color-accent)' : 'var(--color-danger)',
              }}
            >
              {confidence > 0.58 ? '● Live' : '○ Off'}
            </div>
            <button
              onClick={() => useGameStore.getState().openSettings()}
              title="Settings"
              className="p-1 rounded-lg cursor-pointer"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-glass-bg)' }}
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div
          className="w-full aspect-video bg-black rounded-xl overflow-hidden relative"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'rgba(5,8,22,0.9)' }}>
              <span className="text-[10px] font-mono animate-pulse" style={{ color: 'var(--color-primary)' }}>
                Initializing Camera…
              </span>
            </div>
          )}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />

          {/* Horizontal paddle tracker */}
          {paddleX != null && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${paddleX * 100}%`,
                bottom: '18%',
                transform: 'translate(-50%, 50%)',
                width: 48,
                height: 10,
                background: isDark ? '#0891b2' : '#1d4ed8',
                borderRadius: 5,
                border: `2px solid ${isDark ? '#0e7490' : '#1e3a8a'}`,
              }}
            />
          )}

          {handCenter && (
            <div
              className="absolute pointer-events-none opacity-50"
              style={{
                left: `${(1 - handCenter.x) * 100}%`,
                top: `${handCenter.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                border: `2px dashed ${isDark ? '#00ffb3' : '#00b37d'}`,
                borderRadius: 6,
              }}
            />
          )}

          <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full transition-all duration-200"
              style={{ width: `${Math.round(confidence * 100)}%`, background: 'var(--color-primary)' }}
            />
          </div>
        </div>
        <p className="text-[8px] px-1 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
          Keep hand inside the <b>AIM ZONE</b> — it maps to the full paddle width.
        </p>
      </div>

      {/* Scoreboard */}
      <div className="glass rounded-2xl p-3 border-themed flex flex-col gap-2">
        <h2 className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          BLOCK BREAKER
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>Score</span>
            <span className="font-bold ml-auto">{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>High</span>
            <span className="font-bold ml-auto">{highScore}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>Lives</span>
            <span className="font-bold ml-auto">{lives}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-text-muted)' }}>Level</span>
            <span className="font-bold ml-auto">{level}</span>
          </div>
        </div>
        <div className="text-[9px] pt-1 border-t space-y-0.5" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <div>🔴 Red = 50 &nbsp; 🟡 Yellow = 30 &nbsp; 🟢 Green = 10</div>
          <div>Power-ups: ♥ extra life &nbsp; +1 ball &nbsp; ▬ 30s safety bar</div>
          <div>3 lives reset each level</div>
        </div>
      </div>
    </div>
  )
}

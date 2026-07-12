import { Camera, Settings } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { SpellbookPanel } from './SpellbookPanel'
import { MatchupChart } from './MatchupChart'
import { ScoreboardPanel } from './ScoreboardPanel'
import type { RefObject } from 'react'

interface LeftPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  confidence: number
  isReady: boolean
  handCenter: { x: number; y: number } | null
  playPosition: { x: number; y: number } | null
}

export function LeftPanel({ videoRef, canvasRef, confidence, isReady, handCenter, playPosition }: LeftPanelProps) {
  const { settings, fps } = useGameStore()
  const isDark = settings.theme === 'dark'

  return (
    <div
      className="col-span-1 flex flex-col gap-2 h-full overflow-y-auto p-2 z-20"
      style={{ color: 'var(--color-text)' }}
    >
      {/* Camera Feed */}
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
                background: confidence > 0.85 ? 'rgba(0,255,179,0.15)' : 'rgba(255,77,109,0.15)',
                color: confidence > 0.85 ? 'var(--color-accent)' : 'var(--color-danger)',
              }}
            >
              {confidence > 0.85 ? '● Live' : '○ Off'}
            </div>
            <button
              onClick={() => useGameStore.getState().openSettings()}
              title="Settings"
              className="p-1 rounded-lg"
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

          {/* Crosshair shows mapped play position (not raw hand) */}
          {playPosition && (
            <div
              className="absolute pointer-events-none transition-all duration-75"
              style={{
                left: `${playPosition.x * 100}%`,
                top: `${playPosition.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 40,
                border: `2px solid ${isDark ? '#00ffb3' : '#00b37d'}`,
                borderRadius: '50%',
                boxShadow: `0 0 10px ${isDark ? 'rgba(0,255,179,0.5)' : 'rgba(0,179,125,0.5)'}`,
              }}
            />
          )}

          {/* Raw hand tracker box (faint) */}
          {handCenter && (
            <div
              className="absolute pointer-events-none transition-all duration-75 opacity-40"
              style={{
                left: `${(1 - handCenter.x) * 100}%`,
                top: `${handCenter.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                border: `1px dashed ${isDark ? '#00e5ff' : '#0077ff'}`,
                borderRadius: 6,
              }}
            />
          )}

          {/* Confidence bar */}
          <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full transition-all duration-200"
              style={{ width: `${Math.round(confidence * 100)}%`, background: 'var(--color-primary)' }}
            />
          </div>
        </div>
        <p className="text-[8px] px-1 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
          Keep hand inside the <b>AIM ZONE</b> box — it maps to the full game screen.
        </p>
      </div>

      <SpellbookPanel />
      <MatchupChart />
      <ScoreboardPanel />
    </div>
  )
}
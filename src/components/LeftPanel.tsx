import { useGameStore } from '../store/gameStore'
import { Camera, Zap, Shield, Target, Award, Play, Activity, Settings, Sun, Moon, Bug } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

export function LeftPanel({ videoRef, canvasRef, confidence, isReady }: any) {
  const {
    score, maxCombo, accuracy, level, targetsDestroyed, energy, health, fps,
    gameState, setGameState, openSettings, settings, updateSettings,
    sessionDuration, gesturesDetected, avgFps, isCalibrated,
  } = useGameStore()

  // Sync theme to DOM on mount & when it changes
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [settings.theme])

  const isDark = settings.theme === 'dark'

  function toggleTheme() {
    updateSettings({ theme: isDark ? 'light' : 'dark' })
  }

  const canStart = gameState === 'dashboard' && isCalibrated

  return (
    <div
      className="flex flex-col gap-3 h-full max-h-screen overflow-y-auto p-3 z-20"
      style={{ color: 'var(--color-text)' }}
    >
      {/* ── Webcam Card ─────────────────────────────── */}
      <div className="glass rounded-3xl p-3 flex flex-col gap-2 border-themed">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xs font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              HAND TRACKING
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* FPS badge */}
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{fps} FPS</span>
            {/* Tracking status */}
            <div className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: confidence > 0.85 ? 'rgba(0,255,179,0.15)' : 'rgba(255,77,109,0.15)',
                color: confidence > 0.85 ? 'var(--color-accent)' : 'var(--color-danger)',
              }}>
              {confidence > 0.85 ? '🟢 On' : '🔴 Off'}
            </div>
            {/* Theme toggle */}
            <button onClick={toggleTheme} title="Toggle Theme"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-glass-bg)' }}>
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {/* Settings */}
            <button onClick={openSettings} title="Settings"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-glass-bg)' }}>
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Webcam Feed */}
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative"
          style={{ border: '1px solid var(--color-border)' }}>
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'rgba(5,8,22,0.9)' }}>
              <span className="text-xs font-mono animate-pulse" style={{ color: 'var(--color-primary)' }}>
                Initializing Camera…
              </span>
            </div>
          )}
          <video ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            playsInline muted />
          <canvas ref={canvasRef} width={640} height={480}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          {/* Confidence bar */}
          <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: 'var(--color-border)' }}>
            <div className="h-full transition-all duration-200"
              style={{ width: `${Math.round(confidence * 100)}%`, background: 'var(--color-primary)' }} />
          </div>
        </div>

        {/* Start button */}
        {canStart && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { useGameStore.getState().startSession(); setGameState('playing') }}
            className="w-full py-2.5 rounded-xl font-bold tracking-widest text-sm uppercase flex justify-center items-center gap-2 transition-colors"
            style={{
              background: 'rgba(0,229,255,0.12)',
              border: '1px solid rgba(0,229,255,0.4)',
              color: 'var(--color-primary)',
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            START GAME
          </motion.button>
        )}
      </div>

      {/* ── Controls Card ────────────────────────────── */}
      <div className="glass rounded-3xl p-3 flex flex-col gap-2" style={{ border: '1px solid var(--color-border)' }}>
        <h2 className="text-xs font-bold tracking-wider px-1" style={{ color: 'var(--color-text-muted)' }}>CONTROLS</h2>
        <div className="grid grid-cols-2 gap-1.5">
          <ControlItem icon={<Zap className="w-3.5 h-3.5" />} color="var(--color-primary)" name="Swipe" desc="Slice Targets" />
          <ControlItem icon={<Shield className="w-3.5 h-3.5" />} color="var(--color-secondary)" name="Open Palm" desc="Activate Shield" />
          <ControlItem icon={<Activity className="w-3.5 h-3.5" />} color="var(--color-danger)" name="Fist" desc="Shockwave" />
          <ControlItem icon={<Target className="w-3.5 h-3.5" />} color="#f97316" name="Pinch" desc="Charge Blast" />
          <ControlItem icon={<span className="text-xs">✌️</span>} color="var(--color-accent)" name="Peace Sign" desc="Settings" />
          <ControlItem icon={<span className="text-xs">👍</span>} color="var(--color-accent)" name="Thumbs Up" desc="Resume Game" />
        </div>
      </div>

      {/* ── Stats Card ───────────────────────────────── */}
      <div className="glass rounded-3xl p-3 flex flex-col gap-3 flex-grow" style={{ border: '1px solid var(--color-border)' }}>
        <h2 className="text-xs font-bold tracking-wider px-1" style={{ color: 'var(--color-text-muted)' }}>BATTLE STATS</h2>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="SCORE" value={score} icon={<Award className="w-3 h-3" />} />
          <StatBox label="LEVEL" value={level} accent="var(--color-primary)" />
          <StatBox label="MAX COMBO" value={`${maxCombo}x`} accent="var(--color-secondary)" />
          <StatBox label="ACCURACY" value={`${accuracy}%`} />
          <StatBox label="KILLS" value={targetsDestroyed} />
          <StatBox label="AVG FPS" value={Math.round(avgFps)} />
          <StatBox label="GESTURES" value={gesturesDetected} />
          <StatBox label="SESSION" value={`${Math.floor(sessionDuration / 60)}m ${Math.floor(sessionDuration % 60)}s`} />
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <BarRow label="HEALTH" value={health} color="var(--color-danger)" />
          <BarRow label="ENERGY" value={energy} color="#f97316" />
        </div>
      </div>

      {/* Debug overlay toggle (bottom) */}
      <button
        onClick={() => updateSettings({ showDebugOverlay: !settings.showDebugOverlay })}
        className="flex items-center gap-2 justify-center py-2 rounded-xl text-xs font-bold transition-colors"
        style={{
          color: settings.showDebugOverlay ? 'var(--color-primary)' : 'var(--color-text-muted)',
          background: 'var(--color-glass-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Bug className="w-3.5 h-3.5" />
        {settings.showDebugOverlay ? 'Debug: ON' : 'Debug: OFF'}
      </button>
    </div>
  )
}

function ControlItem({ icon, name, desc, color }: any) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl transition-colors"
      style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-border)' }}>
      <div className="p-1.5 rounded-lg flex-shrink-0"
        style={{ background: 'var(--color-glass-bg)', color }}>{icon}</div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>{name}</span>
        <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</span>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, accent }: any) {
  return (
    <div className="p-2.5 rounded-xl flex flex-col"
      style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-border)' }}>
      <span className="text-[9px] font-bold tracking-widest flex items-center gap-0.5"
        style={{ color: 'var(--color-text-muted)' }}>
        {icon} {label}
      </span>
      <span className="text-lg font-mono font-black leading-tight"
        style={{ color: accent ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-1 px-0.5"
        style={{ color: 'var(--color-text-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}80` }} />
      </div>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sun, Moon, RotateCcw } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { useEffect } from 'react'

export function SettingsModal() {
  const { gameState, settings, updateSettings, closeSettings, updateCalibration, setCalibrated } = useGameStore()
  const isOpen = gameState === 'settings'

  // Apply theme to <html>
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('hand-strike-theme', settings.theme)
  }, [settings.theme])

  function toggleTheme() {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
  }

  function resetCalibration() {
    updateCalibration({
      pinchThreshold: 0.04,
      fistCurlRatio: 0.8,
      swipeMinDist: 0.15,
      swipeMinVel: 0.0015,
      palmExtendRatio: 1.1,
    })
    setCalibrated(false)
  }

  function resetHighScores() {
    // Clear only score-related parts of the store
    useGameStore.setState({ score: 0, maxCombo: 0 })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={closeSettings}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              className="glass rounded-3xl p-8 w-full max-w-lg pointer-events-auto relative"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                  ⚙ Settings
                </h2>
                <button
                  onClick={closeSettings}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Theme */}
                <Section title="Appearance">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Theme</span>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                      style={{
                        background: 'var(--color-glass-bg)',
                        border: '1px solid var(--color-glass-bdr)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {settings.theme === 'dark'
                        ? <><Moon className="w-4 h-4" /> Dark</>
                        : <><Sun className="w-4 h-4" /> Light</>}
                    </button>
                  </div>
                </Section>

                {/* Audio */}
                <Section title="Audio">
                  <SliderRow
                    label="Music Volume"
                    value={settings.musicVolume}
                    onChange={(v) => updateSettings({ musicVolume: v })}
                  />
                  <SliderRow
                    label="Effects Volume"
                    value={settings.sfxVolume}
                    onChange={(v) => updateSettings({ sfxVolume: v })}
                  />
                </Section>

                {/* Tracking */}
                <Section title="Hand Tracking">
                  <SliderRow
                    label="Tracking Smoothing"
                    value={settings.trackingSmoothing}
                    onChange={(v) => updateSettings({ trackingSmoothing: v })}
                    hint="Higher = smoother orb, lower = faster response"
                  />
                  <SliderRow
                    label="Gesture Sensitivity"
                    value={settings.gestureSensitivity}
                    onChange={(v) => updateSettings({ gestureSensitivity: v })}
                    hint="Higher = triggers more easily"
                  />
                  <ToggleRow
                    label="Debug Overlay"
                    value={settings.showDebugOverlay}
                    onChange={(v) => updateSettings({ showDebugOverlay: v })}
                  />
                </Section>

                {/* Danger zone */}
                <Section title="Reset">
                  <div className="flex gap-3">
                    <DangerButton icon={<RotateCcw className="w-4 h-4" />} label="Reset Calibration" onClick={resetCalibration} />
                    <DangerButton icon={<RotateCcw className="w-4 h-4" />} label="Reset High Scores" onClick={resetHighScores} />
                  </div>
                </Section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </span>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function SliderRow({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{label}</span>
        <span className="text-sm font-mono" style={{ color: 'var(--color-primary)' }}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: 'var(--color-primary)' }}
      />
      {hint && <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{hint}</span>}
    </div>
  )
}

function ToggleRow({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{ background: value ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ x: value ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

function DangerButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold flex-1 justify-center transition-colors"
      style={{
        border: '1px solid var(--color-danger)',
        color: 'var(--color-danger)',
        background: 'transparent',
      }}
    >
      {icon} {label}
    </button>
  )
}

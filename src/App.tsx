import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/LandingScreen'
import { PermissionsScreen } from './components/PermissionsScreen'
import { GuidedCalibrationScreen } from './components/GuidedCalibrationScreen'
import { ReadyScreen } from './components/ReadyScreen'
import { DashboardScreen } from './components/DashboardScreen'

const PLAYING_STATES = ['dashboard', 'playing', 'paused', 'settings']

function App() {
  const { gameState, score, maxCombo, targetsDestroyed, sessionDuration, resetGame, settings } = useGameStore()

  // Apply persisted theme on first load
  useEffect(() => {
    const saved = localStorage.getItem('hand-strike-theme') ?? settings.theme
    if (saved === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }, [])

  const showDashboard = PLAYING_STATES.includes(gameState)

  return (
    <div
      className="w-screen h-screen overflow-hidden font-sans relative"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <AnimatePresence mode="wait">

        {/* ── Landing ─────────────────────────────── */}
        {gameState === 'landing' && (
          <Page key="landing"><LandingScreen /></Page>
        )}

        {/* ── Camera Permissions ──────────────────── */}
        {gameState === 'permissions' && (
          <Page key="permissions"><PermissionsScreen /></Page>
        )}

        {/* ── Guided Calibration ──────────────────── */}
        {gameState === 'calibration' && (
          <Page key="calibration"><GuidedCalibrationScreen /></Page>
        )}

        {/* ── Ready Screen (idle, waiting for START) ─ */}
        {gameState === 'ready' && (
          <Page key="ready"><ReadyScreen /></Page>
        )}

        {/* ── Game Dashboard (playing / paused / settings) ── */}
        {showDashboard && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <DashboardScreen />
          </motion.div>
        )}

        {/* ── Game Over ───────────────────────────── */}
        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Dashboard still visible underneath */}
            <DashboardScreen />

            {/* Game Over overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-50"
              style={{ background: 'rgba(5,8,22,0.92)', backdropFilter: 'blur(16px)' }}
            >
              <motion.h1
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="font-black text-center leading-none mb-4"
                style={{
                  fontSize: 'clamp(3rem, 12vw, 8rem)',
                  backgroundImage: 'linear-gradient(180deg, var(--color-danger) 0%, #7f1d1d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 30px rgba(255,77,109,0.6))',
                }}
              >
                SYSTEM<br />FAILURE
              </motion.h1>

              <div className="glass rounded-3xl p-8 w-full max-w-lg mb-10"
                style={{ border: '1px solid rgba(255,77,109,0.25)' }}>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <Stat label="SCORE" value={score} />
                  <Stat label="MAX COMBO" value={`${maxCombo}x`} color="var(--color-secondary)" />
                  <Stat label="KILLS" value={targetsDestroyed} color="var(--color-primary)" />
                </div>
                <div className="mt-4 pt-4 text-center"
                  style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Session: {Math.floor(sessionDuration / 60)}m {Math.floor(sessionDuration % 60)}s
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => resetGame()}
                className="px-14 py-5 rounded-2xl font-black text-xl tracking-[0.2em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: 'white',
                  boxShadow: '0 0 30px rgba(0,229,255,0.4)',
                }}
              >
                Restart Sequence
              </motion.button>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

function Page({ children, key: _ }: { children: React.ReactNode; key?: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-4xl font-mono font-black" style={{ color: color ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

export default App

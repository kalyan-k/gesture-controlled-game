import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/LandingScreen'
import { PermissionsScreen } from './components/PermissionsScreen'
import { DashboardScreen } from './components/DashboardScreen'
import { BlockBreakerLivesHUD } from './components/blockBreaker/BlockBreakerLivesHUD'
import { audio } from './hooks/useAudio'

function App() {
  const { gameState, settings, updateSettings, selectedGame } = useGameStore()

  useEffect(() => {
    const saved = localStorage.getItem('spellcaster-theme') ?? settings.theme
    if (saved === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }, [])

  const isDark = settings.theme === 'dark'

  const toggleTheme = () => {
    audio.unlock()
    audio.playClick()
    const nextTheme = isDark ? 'light' : 'dark'
    updateSettings({ theme: nextTheme })
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
      localStorage.setItem('spellcaster-theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('spellcaster-theme', 'dark')
    }
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden font-sans relative"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      {/* Theme toggle + block breaker lives */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {gameState === 'dashboard' && selectedGame === 'block_breaker' && (
          <BlockBreakerLivesHUD />
        )}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-full glass border border-themed flex items-center justify-center shadow-lg cursor-pointer"
          style={{ background: 'var(--color-bg-panel)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'landing' && (
          <Page key="landing"><LandingScreen /></Page>
        )}
        {gameState === 'permissions' && (
          <Page key="permissions"><PermissionsScreen /></Page>
        )}
        {gameState === 'dashboard' && (
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
      </AnimatePresence>
    </div>
  )
}

function Page({ children }: { children: React.ReactNode }) {
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

export default App

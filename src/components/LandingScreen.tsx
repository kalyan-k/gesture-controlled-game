import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Wand2, ChevronRight, Blocks } from 'lucide-react'
import { audio } from '../hooks/useAudio'
import { GESTURE_HELP, PAUSE_GESTURE_HELP } from '../gestures/GestureTypes'
import type { SelectedGame } from '../store/gameStore'

export function LandingScreen() {
  const { setGameState, setSelectedGame, selectedGame } = useGameStore()

  const pickGame = (game: SelectedGame) => {
    audio.playClick()
    setSelectedGame(game)
  }

  const enter = () => {
    audio.unlock()
    audio.playClick()
    setGameState('permissions')
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,77,255,0.08) 0%, transparent 80%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 flex flex-col items-center text-center px-6 max-w-3xl w-full"
      >
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight mb-2"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Hand Gesture Arcade
        </h1>
        <p className="text-base mb-6 font-light" style={{ color: 'var(--color-text-muted)' }}>
          Choose a game — both use your webcam. Processed locally in your browser.
        </p>

        {/* Game selector — landing page only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => pickGame('block_breaker')}
            className="glass rounded-2xl p-5 text-left border-2 cursor-pointer transition-colors"
            style={{
              borderColor: selectedGame === 'block_breaker' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Blocks className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>
                Hand Block Breaker
              </h2>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Classic brick breaker. Move your hand left ↔ right to control the paddle. Catch power-ups!
            </p>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => pickGame('spellcaster')}
            className="glass rounded-2xl p-5 text-left border-2 cursor-pointer transition-colors"
            style={{
              borderColor: selectedGame === 'spellcaster' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-6 h-6" style={{ color: 'var(--color-secondary)' }} />
              <h2 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>
                Spellcaster&apos;s attack Enemies
              </h2>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Cast elemental spells with hand gestures. Defend the barrier from falling enemies.
            </p>
          </motion.button>
        </div>

        {selectedGame === 'block_breaker' && (
          <div className="glass rounded-3xl p-5 w-full max-w-lg text-left border-themed mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <h2 className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: 'var(--color-primary)' }}>
              Block Breaker Controls
            </h2>
            <ul className="space-y-2 text-xs">
              <li>🖐️ Move hand <b>horizontally</b> — paddle follows instantly</li>
              <li>🖐️ <b>Open Palm</b> — launch ball (after countdown &amp; each life lost)</li>
              <li>❤️ <b>3 lives per level</b> — cleared level resets lives to 3</li>
              <li>🔴 Red = 50 &nbsp; 🟡 Yellow = 30 &nbsp; 🟢 Green = 10</li>
              <li>💊 Drops: extra life, +1 ball, 30s full-width safety bar</li>
              <li>⏸️ Hand out of frame for 8 frames — game auto-pauses</li>
            </ul>
          </div>
        )}

        {selectedGame === 'spellcaster' && (
          <div className="glass rounded-3xl p-5 w-full max-w-lg text-left border-themed mb-6">
            <h2 className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: 'var(--color-primary)' }}>
              Spellcaster Controls
            </h2>
            <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
              <li>🔥 <b>Fist</b> — {GESTURE_HELP.fist.effect}</li>
              <li>🛡️ <b>Open Palm</b> — {GESTURE_HELP.open_palm.effect}</li>
              <li>⚡ <b>L-Shape</b> — {GESTURE_HELP.l_shape.effect}</li>
              <li>🤘 <b>Horns</b> — {GESTURE_HELP.rock_on.effect}</li>
              <li>💧 <b>OK Sign</b> — {GESTURE_HELP.ok_sign.effect}</li>
              <li className="pt-1 border-t text-xs" style={{ borderColor: 'var(--color-border)' }}>
                ⏸️ {PAUSE_GESTURE_HELP.effect}
              </li>
            </ul>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={enter}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg tracking-widest uppercase cursor-pointer"
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            border: '2px solid rgba(0,0,0,0.15)',
          }}
        >
          {selectedGame === 'block_breaker' ? 'Play Block Breaker' : 'Play Spellcaster\'s attack Enemies'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className="mt-3 text-[11px]" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
          Webcam required • All processing stays on your device
        </p>
      </motion.div>
    </div>
  )
}

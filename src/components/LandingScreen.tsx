import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Wand2, ChevronRight } from 'lucide-react'
import { audio } from '../hooks/useAudio'
import { GESTURE_HELP, PAUSE_GESTURE_HELP } from '../gestures/GestureTypes'

export function LandingScreen() {
  const setGameState = useGameStore((s) => s.setGameState)

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,77,255,0.08) 0%, transparent 80%)' }} />

      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
            left: `${(i * 37 + 10) % 100}%`,
            top: `${(i * 53 + 5) % 100}%`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 flex flex-col items-center text-center px-6 max-w-2xl"
      >
        <div className="relative mb-6">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <Wand2 className="w-20 h-20" style={{ color: 'var(--color-secondary)' }} />
          </motion.div>
        </div>

        <h1
          className="text-5xl md:text-7xl font-black tracking-tight mb-2 leading-none"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 50%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          The Spellcaster&apos;s Academy
        </h1>

        <p className="text-lg mb-6 font-light" style={{ color: 'var(--color-text-muted)' }}>
          Use your hands to defend the barrier. Master five elemental spells.
        </p>

        <div className="glass rounded-3xl p-5 w-full max-w-lg text-left border-themed mb-6">
          <h2 className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: 'var(--color-primary)' }}>
            How It Works
          </h2>
          <ul className="text-sm space-y-3" style={{ color: 'var(--color-text-muted)' }}>
            <li>
              🔥 <b>Tight Fist</b> — {GESTURE_HELP.fist.effect}
              <div className="text-xs mt-0.5 opacity-80">{GESTURE_HELP.fist.howTo}</div>
            </li>
            <li>
              🛡️ <b>Open Palm</b> — {GESTURE_HELP.open_palm.effect}
              <div className="text-xs mt-0.5 opacity-80">{GESTURE_HELP.open_palm.howTo}</div>
            </li>
            <li>
              ⚡ <b>L-Shape</b> — {GESTURE_HELP.l_shape.effect}
              <div className="text-xs mt-0.5 opacity-80">{GESTURE_HELP.l_shape.howTo}</div>
            </li>
            <li>
              🤘 <b>Horns Sign</b> — {GESTURE_HELP.rock_on.effect}
              <div className="text-xs mt-0.5 opacity-80">{GESTURE_HELP.rock_on.howTo}</div>
            </li>
            <li>
              💧 <b>OK Sign</b> — {GESTURE_HELP.ok_sign.effect}
              <div className="text-xs mt-0.5 opacity-80">{GESTURE_HELP.ok_sign.howTo}</div>
            </li>
            <li className="pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
              ⏸️ <b>Pause / Resume</b> — {PAUSE_GESTURE_HELP.effect}
              <div className="text-xs mt-0.5 opacity-80">{PAUSE_GESTURE_HELP.howTo}</div>
            </li>
          </ul>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            audio.unlock()
            audio.playClick()
            setGameState('permissions')
          }}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg tracking-widest uppercase cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
            boxShadow: '0 0 20px rgba(0,229,255,0.25)',
          }}
        >
          Enter the Academy
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <p className="mt-3 text-[11px]" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
          Webcam required • Processed locally in your browser
        </p>
      </motion.div>
    </div>
  )
}

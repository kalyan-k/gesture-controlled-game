import { motion } from 'framer-motion'
import { CheckCircle2, Cpu, Camera, Zap, Play } from 'lucide-react'
import { useGameStore } from '../store/gameStore'

export function ReadyScreen() {
  const { fps, isCameraReady, isCalibrated, setGameState, startSession } = useGameStore()

  const statusItems = [
    { label: 'Camera', ok: isCameraReady, icon: <Camera className="w-4 h-4" /> },
    { label: 'Calibration', ok: isCalibrated, icon: <Cpu className="w-4 h-4" /> },
    { label: 'Gesture Engine', ok: true, icon: <Zap className="w-4 h-4" /> },
    { label: 'Tracking FPS', ok: fps > 20, icon: <CheckCircle2 className="w-4 h-4" />, value: `${fps} FPS` },
  ]

  function handleStart() {
    startSession()
    setGameState('playing')
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08), transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center gap-10 w-full max-w-md px-6"
      >
        {/* Icon ring */}
        <motion.div
          animate={{ boxShadow: ['0 0 20px rgba(0,229,255,0.2)', '0 0 50px rgba(0,229,255,0.5)', '0 0 20px rgba(0,229,255,0.2)'] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, var(--color-primary), var(--color-secondary))' }}
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>

        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter" style={{ color: 'var(--color-text)' }}>
            System Ready
          </h1>
          <p className="mt-2 text-lg" style={{ color: 'var(--color-text-muted)' }}>
            All systems operational. Press start when ready.
          </p>
        </div>

        {/* Status grid */}
        <div className="glass rounded-3xl p-6 w-full grid grid-cols-2 gap-3">
          {statusItems.map((item) => (
            <div key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--color-glass-bg)' }}
            >
              <span style={{ color: item.ok ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                {item.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  {item.label}
                </span>
                <span className="text-sm font-mono font-bold" style={{ color: item.ok ? 'var(--color-text)' : 'var(--color-danger)' }}>
                  {item.value ?? (item.ok ? 'READY' : 'NOT READY')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Big start button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 0 20px rgba(0,229,255,0.3)', '0 0 50px rgba(0,229,255,0.6)', '0 0 20px rgba(0,229,255,0.3)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={handleStart}
          className="w-full py-6 rounded-2xl font-black text-2xl tracking-[0.2em] uppercase flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'white',
          }}
        >
          <Play className="w-7 h-7 fill-white" />
          START GAME
        </motion.button>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Tip: ✌️ Peace sign = Settings · 👍 Thumbs up = Resume
        </p>
      </motion.div>
    </div>
  )
}

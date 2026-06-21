import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useGameStore } from '../store/gameStore'

type PermState = 'checking' | 'granted' | 'prompt' | 'denied'

export function PermissionsScreen() {
  const [permState, setPermState] = useState<PermState>('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const setGameState = useGameStore((s) => s.setGameState)

  useEffect(() => {
    checkPermissions()
  }, [])

  async function checkPermissions() {
    try {
      // Modern browsers support navigator.permissions
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (result.state === 'granted') {
          setPermState('granted')
        } else if (result.state === 'denied') {
          setPermState('denied')
        } else {
          setPermState('prompt')
        }
        result.onchange = () => {
          if (result.state === 'granted') setPermState('granted')
          else if (result.state === 'denied') setPermState('denied')
        }
      } else {
        // Fallback: just show prompt state
        setPermState('prompt')
      }
    } catch {
      setPermState('prompt')
    }
  }

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop()) // release immediately
      setPermState('granted')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPermState('denied')
        setErrorMsg('Camera access was denied.')
      } else {
        setErrorMsg(err.message ?? 'Unknown error')
      }
    }
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.07), transparent)' }} />

      <AnimatePresence mode="wait">
        {permState === 'checking' && (
          <motion.div key="checking"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Camera className="w-16 h-16 animate-pulse" style={{ color: 'var(--color-primary)' }} />
            <p className="font-mono text-lg" style={{ color: 'var(--color-text-muted)' }}>Checking camera permissions…</p>
          </motion.div>
        )}

        {permState === 'granted' && (
          <motion.div key="granted"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <CheckCircle className="w-20 h-20" style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-4xl font-black" style={{ color: 'var(--color-text)' }}>
              ✅ Camera Ready
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-lg max-w-sm">
              Your webcam is accessible. Click below to initialize the hand-tracking system.
            </p>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGameState('calibration')}
              className="mt-4 px-12 py-4 rounded-2xl font-black text-xl tracking-widest uppercase"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
                boxShadow: '0 0 30px rgba(0,229,255,0.4)',
              }}
            >
              Initialize System
            </motion.button>
          </motion.div>
        )}

        {permState === 'prompt' && (
          <motion.div key="prompt"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center max-w-md"
          >
            <AlertTriangle className="w-20 h-20" style={{ color: '#f59e0b' }} />
            <h2 className="text-4xl font-black" style={{ color: 'var(--color-text)' }}>
              ⚠ Camera Access Required
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-lg">
              HAND STRIKE uses your webcam for real-time hand tracking. No footage is stored or transmitted.
            </p>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={requestCamera}
              className="mt-4 px-12 py-4 rounded-2xl font-black text-xl tracking-widest uppercase"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
                boxShadow: '0 0 30px rgba(0,229,255,0.3)',
              }}
            >
              Enable Camera
            </motion.button>
          </motion.div>
        )}

        {permState === 'denied' && (
          <motion.div key="denied"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center max-w-md"
          >
            <XCircle className="w-20 h-20" style={{ color: 'var(--color-danger)' }} />
            <h2 className="text-4xl font-black" style={{ color: 'var(--color-text)' }}>
              ❌ Camera Access Blocked
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }} className="text-base">
              {errorMsg || 'Camera permission was denied.'}
            </p>
            <div className="glass rounded-2xl p-5 text-left text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
              <p className="font-bold" style={{ color: 'var(--color-text)' }}>How to enable:</p>
              <p>1. Click the 🔒 lock icon in your browser address bar.</p>
              <p>2. Set <b>Camera</b> to <b>Allow</b>.</p>
              <p>3. Refresh the page and click Try Again.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setPermState('checking'); checkPermissions() }}
              className="px-10 py-3 rounded-xl font-bold tracking-widest uppercase border"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              Try Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

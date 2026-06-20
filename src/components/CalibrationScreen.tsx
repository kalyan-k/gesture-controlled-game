import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Camera, CheckCircle2 } from 'lucide-react'
import { useHandTracking } from '../hooks/useHandTracking'
import { audio } from '../hooks/useAudio'

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm base
]

export function CalibrationScreen() {
  const { setGameState, isCameraReady } = useGameStore()
  const { videoRef, landmarks } = useHandTracking()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (landmarks.length > 0 && canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const w = canvasRef.current.width
      const h = canvasRef.current.height
      
      ctx.clearRect(0, 0, w, h)
      
      // Draw Connections
      ctx.strokeStyle = '#00e5ff'
      ctx.lineWidth = 2
      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const start = landmarks[startIdx]
        const end = landmarks[endIdx]
        
        ctx.beginPath()
        ctx.moveTo(start.x * w, start.y * h)
        ctx.lineTo(end.x * w, end.y * h)
        ctx.stroke()
      }

      // Draw Landmarks
      ctx.fillStyle = '#00ffb3'
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [landmarks])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-bg-dark relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl flex flex-col items-center max-w-2xl w-full text-center z-10"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">System Calibration</h2>
        
        <p className="text-gray-400 mb-8">
          Please allow camera access. Position yourself so your hand is clearly visible in the frame.
        </p>

        <div className="w-full max-w-[640px] aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden">
          {!isCameraReady && (
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 flex items-center justify-center">
              <span className="text-primary font-mono text-sm animate-pulse">Initializing Camera...</span>
            </div>
          )}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            audio.init()
            setGameState('playing')
          }}
          disabled={!isCameraReady || landmarks.length === 0}
          className="w-full py-4 bg-primary text-bg-dark font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5" />
          Confirm Tracking
        </motion.button>
      </motion.div>
    </div>
  )
}

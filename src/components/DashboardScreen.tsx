import { useEffect, useRef } from 'react'
import { LeftPanel } from './LeftPanel'
import { GameplayScreen } from './GameplayScreen'
import { useHandTracking } from '../hooks/useHandTracking'
import { useGameStore } from '../store/gameStore'
import { GestureFeedback } from './GestureFeedback'

// Hand connections for drawing the skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
]

export function DashboardScreen() {
  const { videoRef, landmarks, gestureResult, confidence } = useHandTracking()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isCameraReady = useGameStore((state) => state.isCameraReady)

  // Draw skeleton on the left panel canvas
  useEffect(() => {
    if (landmarks.length > 0 && canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const w = canvasRef.current.width
      const h = canvasRef.current.height
      
      ctx.clearRect(0, 0, w, h)
      
      // Draw Connections
      ctx.strokeStyle = '#00e5ff'
      ctx.lineWidth = 3
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
        ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [landmarks])

  return (
    <div className="w-full h-full bg-bg-dark flex flex-col md:grid md:grid-cols-[30%_70%] overflow-hidden relative">
      {/* Background neon glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 w-[600px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Panel: Command Center */}
      <LeftPanel 
        videoRef={videoRef} 
        canvasRef={canvasRef} 
        confidence={confidence} 
        isReady={isCameraReady} 
      />

      {/* Right Panel: Immersive Gameplay */}
      <div className="relative h-full w-full bg-black/40 border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <GameplayScreen landmarks={landmarks} gestureResult={gestureResult} />
        
        {/* Floating Gesture Notification Layer */}
        <GestureFeedback />
      </div>
    </div>
  )
}

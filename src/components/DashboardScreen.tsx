import { useEffect, useRef } from 'react'
import { LeftPanel } from './LeftPanel'
import { GameplayScreen } from './GameplayScreen'
import { useHandTracking } from '../hooks/useHandTracking'
import { useGameStore } from '../store/gameStore'
import { GestureFeedback } from './GestureFeedback'
import { SettingsModal } from './SettingsModal'

// Hand connections for webcam skeleton overlay
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
]

export function DashboardScreen() {
  const { videoRef, landmarks, gestureResult, confidence } = useHandTracking()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isCameraReady, settings, idleWarning } = useGameStore()

  // Draw skeleton on the webcam canvas (left panel)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (landmarks.length > 0) {
      ctx.strokeStyle = settings.theme === 'light' ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 3
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
      }
      ctx.fillStyle = settings.theme === 'light' ? '#00b37d' : '#00ffb3'
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [landmarks, settings.theme])

  return (
    <div
      className="w-full h-full flex flex-col md:grid md:grid-cols-[30%_70%] overflow-hidden relative"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.05), transparent)' }} />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,77,255,0.05), transparent)' }} />

      {/* Left Panel */}
      <LeftPanel
        videoRef={videoRef}
        canvasRef={canvasRef}
        confidence={confidence}
        isReady={isCameraReady}
      />

      {/* Right Panel */}
      <div className="relative h-full w-full" style={{ borderLeft: '1px solid var(--color-border)' }}>
        <GameplayScreen landmarks={landmarks} gestureResult={gestureResult} />
        <GestureFeedback />

        {/* Hand-lost idle warning */}
        {idleWarning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <p className="text-5xl font-black mb-2" style={{ color: 'var(--color-danger)' }}>✋ Hand Lost</p>
            <p style={{ color: 'var(--color-text-muted)' }}>Show your hand to resume tracking</p>
          </div>
        )}
      </div>

      {/* Settings modal (global overlay) */}
      <SettingsModal />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { LeftPanel } from './LeftPanel'
import { SpellcasterCanvas } from './SpellcasterCanvas'
import { useHandTracking } from '../hooks/useHandTracking'
import { useGameStore } from '../store/gameStore'
import { GestureFeedback } from './GestureFeedback'
import { SettingsModal } from './SettingsModal'
import { TrainingIntroOverlay } from './TrainingIntroOverlay'
import { GameOverOverlay } from './GameOverOverlay'
import { TRAINING_GESTURES, type SpellGesture } from '../gestures/GestureTypes'
import { getPlayZoneDisplayBounds } from '../game/handMapping'
import { audio } from '../hooks/useAudio'

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
  const { isCameraReady, settings, stage } = useGameStore()

  const handCenter = gestureResult.handCenter ?? null
  const playPosition = gestureResult.playPosition ?? null

  // Training gesture tracker
  const stageRef = useGameStore((s) => s.stage)
  const currentGesture = useGameStore((s) => s.currentGesture)
  const trainingGestures = useGameStore((s) => s.trainingGestures)

  useEffect(() => {
    if (stageRef !== 'TRAINING_INTRO' || !currentGesture) return
    const spell = currentGesture as SpellGesture
    if (TRAINING_GESTURES.includes(spell) && !trainingGestures[spell]) {
      useGameStore.getState().markTrainingGesture(spell)
      audio.playTrainingDing()
    }
  }, [currentGesture, stageRef, trainingGestures])

  // Draw skeleton on webcam canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Play zone — inner camera area that maps to full game canvas
    const zone = getPlayZoneDisplayBounds()
    const zx = zone.left * w
    const zy = zone.top * h
    const zw = zone.width * w
    const zh = zone.height * h
    ctx.strokeStyle = settings.theme === 'light' ? 'rgba(0,119,255,0.45)' : 'rgba(0,229,255,0.45)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(zx, zy, zw, zh)
    ctx.setLineDash([])
    ctx.fillStyle = settings.theme === 'light' ? 'rgba(0,119,255,0.04)' : 'rgba(0,229,255,0.06)'
    ctx.fillRect(zx, zy, zw, zh)
    ctx.font = '9px Inter, system-ui, sans-serif'
    ctx.fillStyle = settings.theme === 'light' ? '#0077ff' : '#00e5ff'
    ctx.fillText('AIM ZONE → full play area', zx + 4, zy + 12)

    if (landmarks.length > 0) {
      ctx.strokeStyle = settings.theme === 'light' ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 2
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
      }
      ctx.fillStyle = settings.theme === 'light' ? '#00b37d' : '#00ffb3'
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Mapped crosshair dot on camera (bitmap coords; canvas is CSS-mirrored)
    if (playPosition) {
      const px = (1 - playPosition.x) * w
      const py = playPosition.y * h
      ctx.strokeStyle = '#00ffb3'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#00ffb3'
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [landmarks, settings.theme, playPosition])

  return (
    <div
      className="w-full h-full grid grid-cols-4 overflow-hidden relative"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.05), transparent)' }} />

      {/* Left Column — 25% */}
      <LeftPanel
        videoRef={videoRef}
        canvasRef={canvasRef}
        confidence={confidence}
        isReady={isCameraReady}
        handCenter={handCenter}
        playPosition={playPosition}
      />

      {/* Right Column — 75% */}
      <div className="col-span-3 relative h-full" style={{ borderLeft: '1px solid var(--color-border)' }}>
        <SpellcasterCanvas gestureResult={gestureResult} />
        <GestureFeedback />

        {stage === 'TRAINING_INTRO' && <TrainingIntroOverlay />}
        <GameOverOverlay />
      </div>

      <SettingsModal />
    </div>
  )
}

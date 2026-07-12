import { useEffect, useRef } from 'react'
import type { HandTrackingResult } from '../../hooks/useHandTracking'
import { BlockBreakerLeftPanel } from './BlockBreakerLeftPanel'
import { BlockBreakerCanvas } from './BlockBreakerCanvas'
import { SettingsModal } from '../SettingsModal'
import { useGameStore } from '../../store/gameStore'
import { getPlayZoneDisplayBounds } from '../../game/handMapping'

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
]

interface BlockBreakerDashboardProps {
  tracking: HandTrackingResult
}

export function BlockBreakerDashboard({ tracking }: BlockBreakerDashboardProps) {
  const { videoRef, landmarks, gestureResult, confidence } = tracking
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isCameraReady, settings } = useGameStore()

  const handCenter = gestureResult.handCenter ?? null
  const paddleX = gestureResult.paddleX ?? null
  const isLight = settings.theme === 'light'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const zone = getPlayZoneDisplayBounds()
    const zx = zone.left * w
    const zy = zone.top * h
    const zw = zone.width * w
    const zh = zone.height * h
    ctx.strokeStyle = isLight ? 'rgba(0,119,255,0.45)' : 'rgba(0,229,255,0.45)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(zx, zy, zw, zh)
    ctx.setLineDash([])
    ctx.fillStyle = isLight ? 'rgba(0,119,255,0.05)' : 'rgba(0,229,255,0.06)'
    ctx.fillRect(zx, zy, zw, zh)
    ctx.font = '9px Inter, system-ui, sans-serif'
    ctx.fillStyle = isLight ? '#0077ff' : '#00e5ff'
    ctx.fillText('AIM ZONE → full paddle range', zx + 4, zy + 12)

    if (landmarks.length > 0) {
      ctx.strokeStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 2
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
      }
      ctx.fillStyle = isLight ? '#00b37d' : '#00ffb3'
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (paddleX != null) {
      const px = (1 - paddleX) * w
      const py = zy + zh * 0.55
      ctx.strokeStyle = isLight ? '#00b37d' : '#00ffb3'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px - 20, py)
      ctx.lineTo(px + 20, py)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fillStyle = isLight ? '#00b37d' : '#00ffb3'
      ctx.fill()
    }
  }, [landmarks, isLight, paddleX])

  return (
    <div
      className="w-full h-full grid grid-cols-4 overflow-hidden relative"
      style={{ background: 'var(--color-bg)' }}
    >
      <BlockBreakerLeftPanel
        videoRef={videoRef}
        canvasRef={canvasRef}
        confidence={confidence}
        isReady={isCameraReady}
        handCenter={handCenter}
        paddleX={paddleX}
      />

      <div className="col-span-3 relative h-full" style={{ borderLeft: '1px solid var(--color-border)' }}>
        <BlockBreakerCanvas gestureResult={gestureResult} />
      </div>

      <SettingsModal />
    </div>
  )
}

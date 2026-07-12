import { getPatternLabel } from '../../game/blockBreaker/brickPatterns'
import type { Brick } from '../../game/blockBreaker/blockBreakerTypes'
import { POWER_UP_LABELS, type PowerUpType } from '../../game/blockBreaker/blockBreakerTypes'

export interface GamePalette {
  bgTop: string
  bgBottom: string
  hudText: string
  hudMuted: string
  ball: string
  ballStroke: string
  paddle: string
  paddleStroke: string
  safetyBar: string
  safetyBarFill: string
  overlay: string
  overlayDark: string
  accent: string
  launchHint: string
  launchHintBg: string
  powerUpText: string
}

export function drawBrick(
  ctx: CanvasRenderingContext2D,
  brick: Brick,
  isLight: boolean
) {
  ctx.shadowBlur = 0
  ctx.fillStyle = brick.color
  ctx.fillRect(brick.x, brick.y, brick.w, brick.h)

  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1)

  const cx = brick.x + brick.w / 2
  const cy = brick.y + brick.h / 2
  ctx.fillStyle = isLight ? '#ffffff' : '#000000'
  ctx.globalAlpha = isLight ? 0.95 : 0.45
  ctx.font = 'bold 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(brick.points), cx, cy + 4)
  ctx.globalAlpha = 1
}

export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  left: number,
  y: number,
  width: number,
  palette: GamePalette
) {
  ctx.shadowBlur = 0
  ctx.fillStyle = palette.paddle
  ctx.beginPath()
  ctx.roundRect(left, y - 7, width, 14, 4)
  ctx.fill()
  ctx.strokeStyle = palette.paddleStroke
  ctx.lineWidth = 2
  ctx.stroke()
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: GamePalette
) {
  ctx.shadowBlur = 0
  ctx.fillStyle = palette.ball
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = palette.ballStroke
  ctx.lineWidth = 2
  ctx.stroke()
}

export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  type: PowerUpType,
  isLight: boolean,
  palette: GamePalette
) {
  const info = POWER_UP_LABELS[type]
  ctx.shadowBlur = 0
  ctx.fillStyle = isLight ? info.lightColor : info.color
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6)
  ctx.fill()
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = palette.powerUpText
  ctx.font = 'bold 11px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(info.label, x, y + 4)
}

export function drawSafetyBar(
  ctx: CanvasRenderingContext2D,
  barY: number,
  canvasW: number,
  remainingSec: number,
  palette: GamePalette
) {
  ctx.shadowBlur = 0
  ctx.fillStyle = palette.safetyBarFill
  ctx.fillRect(8, barY - 4, canvasW - 16, 8)
  ctx.strokeStyle = palette.safetyBar
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(8, barY)
  ctx.lineTo(canvasW - 8, barY)
  ctx.stroke()
  ctx.fillStyle = palette.safetyBar
  ctx.font = 'bold 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Safety ${remainingSec}s`, canvasW / 2, barY + 16)
}

export function getCanvasPalette(isLight: boolean): GamePalette {
  if (isLight) {
    return {
      bgTop: '#dce3f0',
      bgBottom: '#c8d2e6',
      hudText: '#0f172a',
      hudMuted: '#475569',
      ball: '#0f172a',
      ballStroke: '#1e40af',
      paddle: '#1d4ed8',
      paddleStroke: '#1e3a8a',
      safetyBar: '#1d4ed8',
      safetyBarFill: 'rgba(29,78,216,0.25)',
      overlay: 'rgba(255,255,255,0.88)',
      overlayDark: 'rgba(220,228,240,0.95)',
      accent: '#1d4ed8',
      launchHint: '#15803d',
      launchHintBg: 'rgba(255,255,255,0.92)',
      powerUpText: '#ffffff',
    }
  }
  return {
    bgTop: '#0f1428',
    bgBottom: '#080b18',
    hudText: '#e2e8f0',
    hudMuted: '#94a3b8',
    ball: '#f8fafc',
    ballStroke: '#0891b2',
    paddle: '#0891b2',
    paddleStroke: '#0e7490',
    safetyBar: '#2563eb',
    safetyBarFill: 'rgba(37,99,235,0.3)',
    overlay: 'rgba(8,11,24,0.8)',
    overlayDark: 'rgba(8,11,24,0.92)',
    accent: '#0891b2',
    launchHint: '#22c55e',
    launchHintBg: 'rgba(8,11,24,0.88)',
    powerUpText: '#ffffff',
  }
}

export { getPatternLabel }

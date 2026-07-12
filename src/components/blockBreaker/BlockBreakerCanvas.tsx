import { useEffect, useRef } from 'react'
import type { GestureResult } from '../../gestures/GestureTypes'
import { BlockBreakerEngine } from '../../game/blockBreaker/BlockBreakerEngine'
import { drawBrick, getCanvasPalette, getPatternLabel, drawPaddle, drawBall, drawPowerUp, drawSafetyBar } from '../../game/blockBreaker/blockBreakerDraw'
import { useBlockBreakerStore } from '../../store/blockBreakerStore'
import { useGameStore } from '../../store/gameStore'
import { audio } from '../../hooks/useAudio'

interface BlockBreakerCanvasProps {
  gestureResult: GestureResult
}

const BASE_BALL_SPEED = 300

function createEngine(): BlockBreakerEngine {
  return new BlockBreakerEngine({
    onBrickHit: (pts) => {
      audio.playBrickHit()
      useBlockBreakerStore.getState().addScore(pts)
    },
    onWallHit: () => audio.playWallBounce(),
    onPowerUpCatch: (type) => {
      audio.playPowerUpCatch()
      if (type === 'extra_life') {
        useBlockBreakerStore.getState().addLife()
      }
    },
    onBallLost: () => {
      audio.playLifeLost()
      const bb = useBlockBreakerStore.getState()
      bb.loseLife()
      const after = useBlockBreakerStore.getState()
      if (after.stage === 'PLAYING' && engineRefHolder.current) {
        const eng = engineRefHolder.current
        eng.balls = []
        const h = canvasSizeRef.current.h
        if (h > 0) eng.spawnBall(h, true)
      }
    },
    onLevelClear: () => {
      audio.playLevelUp()
      useBlockBreakerStore.getState().nextLevel()
      const level = useBlockBreakerStore.getState().level
      if (engineRefHolder.current) {
        const eng = engineRefHolder.current
        const { w, h } = canvasSizeRef.current
        eng.level = level
        eng.levelBaseSpeed = BASE_BALL_SPEED + (level - 1) * 12
        eng.levelElapsed = 0
        eng.ballSpeed = eng.levelBaseSpeed
        eng.balls = []
        eng.clearedPending = false
        eng.clearLevelPowers()
        if (w > 0 && h > 0) {
          const isLight = useGameStore.getState().settings.theme === 'light'
          eng.buildBricks(w, h, isLight)
          eng.spawnBall(h, true)
        }
      }
    },
  })
}

const engineRefHolder = { current: null as BlockBreakerEngine | null }
const canvasSizeRef = { current: { w: 0, h: 0 } }

export function BlockBreakerCanvas({ gestureResult }: BlockBreakerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BlockBreakerEngine | null>(null)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const gestureRef = useRef(gestureResult)
  const initializedRef = useRef(false)
  const lastThemeRef = useRef<'light' | 'dark'>('dark')

  gestureRef.current = gestureResult
  engineRefHolder.current = engineRef.current

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0) {
        canvas.width = w
        canvas.height = h
        canvasSizeRef.current = { w, h }
        if (engineRef.current) {
          const isLight = useGameStore.getState().settings.theme === 'light'
          engineRef.current.initLayout(w, h, isLight)
        }
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    if (!engineRef.current) {
      engineRef.current = createEngine()
      engineRefHolder.current = engineRef.current
      useBlockBreakerStore.getState().startGame()
    }

    const loop = (now: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      if (canvas.width === 0 || canvas.height === 0) resize()
      const w = canvas.width
      const h = canvas.height
      canvasSizeRef.current = { w, h }

      const bb = useBlockBreakerStore.getState()
      const isLight = useGameStore.getState().settings.theme === 'light'
      const frozen = bb.isPaused || bb.handMissingPause || bb.stage === 'GAME_OVER'

      const dt = frozen ? 0 : Math.min((now - lastTimeRef.current) / 1000, 0.05)
      if (!frozen) lastTimeRef.current = now

      const engine = engineRef.current!
      if (!initializedRef.current && w > 0 && h > 0) {
        engine.reset(bb.level)
        engine.initLayout(w, h, isLight)
        initializedRef.current = true
        lastThemeRef.current = isLight ? 'light' : 'dark'
      } else if (lastThemeRef.current !== (isLight ? 'light' : 'dark') && w > 0 && h > 0) {
        lastThemeRef.current = isLight ? 'light' : 'dark'
        engine.buildBricks(w, h, isLight)
      }

      engine.stage = bb.stage === 'GAME_OVER' ? 'GAME_OVER' : engine.stage
      if (bb.stage === 'COUNTDOWN' && engine.stage !== 'COUNTDOWN') {
        engine.stage = 'COUNTDOWN'
        engine.countdown = 3
      }

      const g = gestureRef.current
      const paddleX = g.paddleX ?? 0.5
      engine.setPaddleNormalizedX(paddleX, w)

      engine.update(dt, w, h, frozen, g.gesture, g.stabilityMs ?? 0, now)

      // Sync countdown → playing transition to store
      if (engine.stage === 'PLAYING' && bb.stage === 'COUNTDOWN') {
        useBlockBreakerStore.getState().setStage('PLAYING')
      }

      const palette = getCanvasPalette(isLight)

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, palette.bgTop)
      bg.addColorStop(1, palette.bgBottom)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Bricks
      for (const brick of engine.bricks) {
        if (!brick.alive) continue
        drawBrick(ctx, brick, isLight)
      }

      // Power-ups
      for (const pu of engine.powerUps) {
        drawPowerUp(ctx, pu.x, pu.y, pu.w, pu.h, pu.type, isLight, palette)
      }

      // Paddle
      const paddleLeft = engine.paddleX - engine.paddleW / 2
      drawPaddle(ctx, paddleLeft, engine.paddleY, engine.paddleW, palette)

      // Safety bar — full-width line below the paddle
      if (engine.isSafetyBarActive(now)) {
        const remaining = Math.ceil((engine.safetyBarUntil - now) / 1000)
        drawSafetyBar(ctx, engine.getSafetyBarY(), w, remaining, palette)
      }

      // Balls
      for (const ball of engine.balls) {
        drawBall(ctx, ball.x, ball.y, 8, palette)
      }

      // HUD on canvas
      ctx.fillStyle = palette.hudText
      ctx.font = 'bold 14px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Level ${bb.level}`, 14, 24)
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillStyle = palette.hudMuted
      ctx.fillText(getPatternLabel(bb.level), 14, 42)

      // Launch hint when ball waiting on paddle
      if (engine.hasStuckBall() && engine.stage === 'PLAYING' && !bb.handMissingPause) {
        ctx.fillStyle = palette.overlay
        ctx.fillRect(w / 2 - 130, h - 120, 260, 36)
        ctx.strokeStyle = palette.launchHint
        ctx.lineWidth = 1.5
        ctx.strokeRect(w / 2 - 130, h - 120, 260, 36)
        ctx.fillStyle = palette.launchHint
        ctx.textAlign = 'center'
        ctx.font = 'bold 13px Inter, system-ui, sans-serif'
        ctx.fillText('🖐️ Open Palm to launch ball', w / 2, h - 95)
      }

      // Countdown overlay
      if (engine.stage === 'COUNTDOWN') {
        ctx.fillStyle = palette.overlay
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = palette.accent
        ctx.textAlign = 'center'
        ctx.font = 'bold 64px Inter, system-ui, sans-serif'
        ctx.fillText(String(Math.ceil(engine.countdown)), w / 2, h / 2 + 20)
        ctx.font = '16px Inter, system-ui, sans-serif'
        ctx.fillStyle = palette.hudMuted
        ctx.fillText('Position your hand — then Open Palm to launch', w / 2, h / 2 + 56)
      }

      // Hand missing pause
      if (bb.handMissingPause && bb.stage === 'PLAYING') {
        ctx.save()
        ctx.filter = 'blur(6px)'
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.5)' : 'rgba(5, 8, 22, 0.5)'
        ctx.fillRect(0, 0, w, h)
        ctx.restore()
        ctx.fillStyle = palette.overlayDark
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = palette.hudText
        ctx.textAlign = 'center'
        ctx.font = 'bold 22px Inter, system-ui, sans-serif'
        ctx.fillText('🖐️ Connection Lost', w / 2, h / 2 - 8)
        ctx.font = '15px Inter, system-ui, sans-serif'
        ctx.fillStyle = palette.hudMuted
        ctx.fillText('Show your hand to resume', w / 2, h / 2 + 22)
      }

      // Game over
      if (bb.stage === 'GAME_OVER') {
        ctx.fillStyle = palette.overlayDark
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = palette.hudText
        ctx.textAlign = 'center'
        ctx.font = 'bold 32px Inter, system-ui, sans-serif'
        ctx.fillText('GAME OVER', w / 2, h / 2 - 40)
        ctx.font = '18px Inter, system-ui, sans-serif'
        ctx.fillStyle = palette.launchHint
        ctx.fillText(`Score: ${bb.score}`, w / 2, h / 2)
        ctx.fillStyle = palette.hudMuted
        ctx.fillText(`High Score: ${bb.highScore}`, w / 2, h / 2 + 28)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  const stage = useBlockBreakerStore((s) => s.stage)

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {stage === 'GAME_OVER' && (
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto px-8 py-3 rounded-xl font-black tracking-widest uppercase cursor-pointer"
            style={{
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: '2px solid rgba(0,0,0,0.2)',
            }}
            onClick={() => {
              audio.playClick()
              initializedRef.current = false
              useBlockBreakerStore.getState().restart()
              if (engineRef.current) {
                engineRef.current.reset(1)
              }
            }}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  )
}

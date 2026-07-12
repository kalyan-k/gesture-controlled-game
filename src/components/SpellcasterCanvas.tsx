import { useEffect, useRef } from 'react'
import type { GestureResult } from '../gestures/GestureTypes'
import { SpellcasterEngine } from '../game/SpellcasterEngine'
import { SPELL_LABELS } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'
import { audio } from '../hooks/useAudio'

interface SpellcasterCanvasProps {
  gestureResult: GestureResult
}

function createEngine(): SpellcasterEngine {
  return new SpellcasterEngine({
    onHit: (base, bullseye) => useGameStore.getState().addHitScore(base, bullseye),
    onSpellWeaver: () => {
      audio.playSpellWeaver()
      return useGameStore.getState().applySpellWeaverBonus()
    },
    onBarrierDamage: (amt) => {
      audio.playBarrierThud()
      useGameStore.getState().takeBarrierDamage(amt)
    },
    onComboReset: () => useGameStore.getState().resetComboMultiplier(),
    onCast: (spell) => {
      audio.playCast(spell)
      useGameStore.getState().recordSpellCast(spell)
    },
    onKill: () => audio.playExplosion(),
    onMiss: () => audio.playMiss(),
  })
}

export function SpellcasterCanvas({ gestureResult }: SpellcasterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SpellcasterEngine | null>(null)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const gestureRef = useRef(gestureResult)
  const prevStageRef = useRef<string>('TRAINING_INTRO')

  gestureRef.current = gestureResult

  // Ambient audio tied to PLAYING stage
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      if (state.stage === 'PLAYING') {
        audio.setVolumes(state.settings.sfxVolume, state.settings.musicVolume)
        audio.startAmbient()
      } else {
        audio.stopAmbient()
      }
    })
    const s = useGameStore.getState()
    if (s.stage === 'PLAYING') {
      audio.setVolumes(s.settings.sfxVolume, s.settings.musicVolume)
      audio.startAmbient()
    }
    return () => {
      unsub()
      audio.stopAmbient()
    }
  }, [])

  // Stable RAF loop — never restarted on gesture frames
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
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, isLight: boolean) => {
      const bgGrad = ctx.createLinearGradient(0, 0, w, h)
      if (isLight) {
        bgGrad.addColorStop(0, '#e8edf8')
        bgGrad.addColorStop(1, '#d4daf0')
      } else {
        bgGrad.addColorStop(0, '#0a0e27')
        bgGrad.addColorStop(1, '#12183a')
      }
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'
      for (let i = 0; i < 50; i++) {
        const sx = ((i * 137) % 1000) / 1000 * w
        const sy = ((i * 97) % 1000) / 1000 * h
        ctx.beginPath()
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawGame = (
      ctx: CanvasRenderingContext2D,
      engine: SpellcasterEngine,
      w: number,
      h: number,
      isLight: boolean
    ) => {
      const barrierY = engine.getBarrierY(h)
      const health = useGameStore.getState().barrierHealth
      const { comboMultiplier } = useGameStore.getState()

      // Horizontal barrier line at bottom
      const barrierGrad = ctx.createLinearGradient(0, barrierY - 20, 0, barrierY + 20)
      barrierGrad.addColorStop(0, 'transparent')
      barrierGrad.addColorStop(0.5, isLight ? '#0077ff' : '#00e5ff')
      barrierGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = barrierGrad
      ctx.lineWidth = 4
      ctx.shadowColor = isLight ? '#0077ff' : '#00e5ff'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.moveTo(0, barrierY)
      ctx.lineTo(w, barrierY)
      ctx.stroke()
      ctx.shadowBlur = 0

      const healthColor = health > 50 ? '#00ffb3' : health > 25 ? '#fbbf24' : '#ff4d6d'
      ctx.fillStyle = healthColor + '25'
      ctx.fillRect(0, barrierY - 8, w, 16)

      if (engine.shieldActive) {
        ctx.strokeStyle = '#7c4dff'
        ctx.lineWidth = 3
        ctx.shadowColor = '#7c4dff'
        ctx.shadowBlur = 30
        ctx.beginPath()
        ctx.arc(w / 2, barrierY, 80, Math.PI, 0)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Enemies
      for (const enemy of engine.enemies) {
        const cfg = enemy.config
        const r = cfg.size * 0.5
        ctx.save()
        ctx.translate(enemy.x, enemy.y)
        if (enemy.slowed) ctx.globalAlpha = 0.65

        ctx.fillStyle = cfg.color
        ctx.shadowColor = cfg.color
        ctx.shadowBlur = 14
        ctx.beginPath()
        if (cfg.type === 'bat') {
          ctx.ellipse(0, 0, r * 1.4, r * 0.8, 0, 0, Math.PI * 2)
        } else {
          ctx.arc(0, 0, r, 0, Math.PI * 2)
        }
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.fillStyle = isLight ? '#0d1117' : '#ffffff'
        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(cfg.label, 0, -r - 10)
        ctx.font = '9px Inter, system-ui, sans-serif'
        ctx.fillStyle = cfg.color
        ctx.fillText(`(${cfg.element})`, 0, -r + 2)
        // Weakness hint — which gesture knocks this out
        const weakSpell = SPELL_LABELS[cfg.weakTo]
        ctx.fillStyle = '#00ffb3'
        ctx.font = 'bold 8px Inter, system-ui, sans-serif'
        ctx.fillText(`Beat: ${weakSpell.emoji} ${weakSpell.name}`, 0, r + 12)
        ctx.restore()
      }

      // Hit explosion effects
      for (const fx of engine.hitEffects) {
        const alpha = fx.timer / 0.4
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = fx.color
        ctx.lineWidth = 3
        ctx.shadowColor = fx.color
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.arc(fx.x, fx.y, 30 * (1 - alpha) + 10, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // Spell projectiles
      for (const proj of engine.projectiles) {
        const colors: Record<string, string> = {
          fist: '#f97316',
          ok_sign: '#38bdf8',
          l_shape: '#fbbf24',
          rock_on: '#a16207',
        }
        ctx.fillStyle = colors[proj.spell] ?? '#f97316'
        ctx.shadowColor = ctx.fillStyle as string
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Enemy projectiles
      for (const ep of engine.enemyProjectiles) {
        ctx.fillStyle = '#ff4d6d'
        ctx.shadowColor = '#ff4d6d'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Crosshair reticle
      const cx = engine.crosshair.x * w
      const cy = engine.crosshair.y * h
      ctx.strokeStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 12, cy)
      ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 30, cy)
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 12)
      ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 30)
      ctx.stroke()
      ctx.fillStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()

      // HUD
      ctx.fillStyle = isLight ? '#0d1117' : '#f0f4ff'
      ctx.font = 'bold 13px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Wave ${engine.wave}`, 14, 24)
      ctx.fillText(`Combo ${comboMultiplier.toFixed(1)}x`, 14, 44)
      ctx.fillText(`Enemies ${engine.enemies.length}`, 14, 64)
      if (engine.lastCastSpell) {
        const s = SPELL_LABELS[engine.lastCastSpell]
        ctx.fillStyle = '#00ffb3'
        ctx.fillText(`Last cast: ${s.emoji} ${s.name}`, 14, 84)
      }
    }

    const drawPauseOverlay = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      handMissing: boolean
    ) => {
      ctx.fillStyle = 'rgba(5, 8, 22, 0.72)'
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = '#f0f4ff'
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px Inter, system-ui, sans-serif'
      if (handMissing) {
        ctx.fillText('🔮 Magic Dissipated', w / 2, h / 2 - 12)
        ctx.font = '15px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#8892b0'
        ctx.fillText('Show your hand to resume', w / 2, h / 2 + 18)
      } else {
        ctx.fillText('⏸ PAUSED', w / 2, h / 2)
        ctx.font = '14px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#8892b0'
        ctx.fillText('Fist → Peace sign to resume', w / 2, h / 2 + 20)
      }
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

      const store = useGameStore.getState()
      const isLight = store.settings.theme === 'light'
      const stage = store.stage
      const frozen = store.isPaused || store.handMissingPause

      // Prevent dt spike when resuming from pause — clock stops while frozen
      const dt = frozen
        ? 0
        : Math.min((now - lastTimeRef.current) / 1000, 0.05)
      if (!frozen) {
        lastTimeRef.current = now
      }

      drawBackground(ctx, w, h, isLight)

      // Reset engine when entering PLAYING
      if (stage === 'PLAYING' && prevStageRef.current !== 'PLAYING') {
        if (!engineRef.current) engineRef.current = createEngine()
        engineRef.current.reset()
      }
      prevStageRef.current = stage

      if (stage === 'PLAYING') {
        if (!engineRef.current) engineRef.current = createEngine()

        const engine = engineRef.current
        const g = gestureRef.current

        engine.update(
          dt,
          w,
          h,
          g.gesture,
          g.handCenter ?? null,
          g.playPosition ?? null,
          frozen,
          g.stabilityMs ?? 0
        )

        drawGame(ctx, engine, w, h, isLight)

        if (frozen) {
          drawPauseOverlay(ctx, w, h, store.handMissingPause)
        }
      } else if (stage === 'TRAINING_INTRO') {
        ctx.fillStyle = isLight ? 'rgba(0,119,255,0.06)' : 'rgba(0,229,255,0.05)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = isLight ? '#64748b' : '#8892b0'
        ctx.font = '15px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Training Ground', w / 2, h / 2 - 10)
        ctx.font = '12px Inter, system-ui, sans-serif'
        ctx.fillText('Complete gestures in the overlay to begin the assault', w / 2, h / 2 + 14)

        // Show crosshair during training too
        const g = gestureRef.current
        if (g.playPosition) {
          const cx = g.playPosition.x * w
          const cy = g.playPosition.y * h
          ctx.strokeStyle = isLight ? '#0077ff88' : '#00e5ff88'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(cx, cy, 18, 0, Math.PI * 2)
          ctx.stroke()
        }
      } else if (stage === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(5,8,22,0.4)'
        ctx.fillRect(0, 0, w, h)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  )
}

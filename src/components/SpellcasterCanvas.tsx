import { useEffect, useRef } from 'react'
import type { GestureResult } from '../gestures/GestureTypes'
import { SpellcasterEngine } from '../game/SpellcasterEngine'
import { SPELL_LABELS, TRAINING_GESTURES } from '../gestures/GestureTypes'
import {
  ELEMENT_DISPLAY,
  type Enemy,
} from '../game/spellcasterTypes'
import { useGameStore } from '../store/gameStore'
import { audio } from '../hooks/useAudio'

const SPAWN_ANIM_S = 0.55
const TARGET_HINT_RADIUS = 150

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function findNearestTargetedEnemy(
  enemies: Enemy[],
  cx: number,
  cy: number
): Enemy | null {
  let nearest: Enemy | null = null
  let minDist = Infinity
  for (const enemy of enemies) {
    const reach = enemy.config.size * 0.5 + TARGET_HINT_RADIUS
    const d = Math.hypot(enemy.x - cx, enemy.y - cy)
    if (d <= reach && d < minDist) {
      minDist = d
      nearest = enemy
    }
  }
  return nearest
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

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
    onKill: (element, elite) => audio.playKnockout(element, elite),
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

      drawSpellbookBar(ctx, w, barrierY, isLight, useGameStore.getState().currentGesture)

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

      // Barrier core — player spells launch from here
      const coreX = w / 2
      const coreY = barrierY - 10
      ctx.fillStyle = isLight ? 'rgba(0,119,255,0.2)' : 'rgba(0,229,255,0.25)'
      ctx.beginPath()
      ctx.arc(coreX, coreY, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Enemies — spawn animation + element badges
      const cx = engine.crosshair.x * w
      const cy = engine.crosshair.y * h
      const targeted = findNearestTargetedEnemy(engine.enemies, cx, cy)

      for (const enemy of engine.enemies) {
        const cfg = enemy.config
        const r = cfg.size * 0.5
        const spawnT = Math.min(1, enemy.spawnAge / SPAWN_ANIM_S)
        const enter = easeOutCubic(spawnT)
        const isTargeted = targeted?.id === enemy.id

        ctx.save()
        ctx.translate(enemy.x, enemy.y)
        ctx.globalAlpha = (enemy.slowed ? 0.75 : 1) * (0.25 + 0.75 * enter)
        ctx.scale(0.45 + 0.55 * enter, 0.45 + 0.55 * enter)

        // Spawn portal ring
        if (spawnT < 1) {
          ctx.strokeStyle = cfg.color + 'aa'
          ctx.lineWidth = 3
          ctx.shadowColor = cfg.color
          ctx.shadowBlur = 18
          ctx.beginPath()
          ctx.arc(0, 0, r + 18 * (1 - spawnT), 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Target highlight ring (nearest enemy only)
        if (isTargeted) {
          const pulse = 0.5 + 0.5 * Math.sin(engine.elapsed * 6)
          ctx.strokeStyle = `rgba(0, 255, 179, ${0.35 + pulse * 0.45})`
          ctx.lineWidth = 3
          ctx.shadowColor = '#00ffb3'
          ctx.shadowBlur = 22
          ctx.beginPath()
          ctx.arc(0, 0, r + 10 + pulse * 4, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Body
        ctx.fillStyle = cfg.color
        ctx.shadowColor = cfg.color
        ctx.shadowBlur = isTargeted ? 22 : 16
        ctx.beginPath()
        if (cfg.type === 'bat') {
          ctx.ellipse(0, 0, r * 1.4, r * 0.8, 0, 0, Math.PI * 2)
        } else {
          ctx.arc(0, 0, r, 0, Math.PI * 2)
        }
        ctx.fill()
        ctx.shadowBlur = 0

        // White rim for contrast
        ctx.strokeStyle = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Elite crown marker
        if (cfg.elite) {
          ctx.fillStyle = '#fbbf24'
          ctx.font = 'bold 10px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('★', 0, -r - 6)
        }

        // Name plate
        const elem = ELEMENT_DISPLAY[cfg.element]
        const plateW = Math.max(72, cfg.label.length * 6.5 + 36)
        const plateH = 34
        const plateY = -r - (cfg.elite ? 24 : 16) - plateH
        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(8,12,32,0.88)'
        roundRect(ctx, -plateW / 2, plateY, plateW, plateH, 8)
        ctx.fill()
        ctx.strokeStyle = cfg.color
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.textAlign = 'center'
        ctx.fillStyle = isLight ? '#0d1117' : '#f0f4ff'
        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.fillText(cfg.label, 0, plateY + 13)
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.fillStyle = cfg.color
        ctx.fillText(`${elem.emoji} ${elem.label}`, 0, plateY + 27)

        ctx.restore()
      }

      // Gesture hint — only on nearest targeted enemy
      if (targeted) {
        const cfg = targeted.config
        const spell = SPELL_LABELS[cfg.weakTo]
        const r = cfg.size * 0.5
        const bx = targeted.x
        const by = targeted.y + r + 28

        const badgeW = 118
        const badgeH = 44
        ctx.save()
        ctx.translate(bx, by)

        // Connector line from crosshair
        ctx.strokeStyle = 'rgba(0, 255, 179, 0.35)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(0, -18)
        ctx.lineTo(cx - bx, cy - by)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(6,10,28,0.94)'
        roundRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 10)
        ctx.fill()
        ctx.strokeStyle = '#00ffb3'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.textAlign = 'center'
        ctx.font = '22px Inter, system-ui, sans-serif'
        ctx.fillText(spell.emoji, -28, 6)
        ctx.fillStyle = isLight ? '#0d1117' : '#f0f4ff'
        ctx.font = 'bold 11px Inter, system-ui, sans-serif'
        ctx.fillText(spell.name, 12, -2)
        ctx.font = '9px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#00ffb3'
        ctx.fillText('CAST THIS', 12, 12)
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

      // Spell projectiles — trail from barrier core toward target
      for (const proj of engine.projectiles) {
        const colors: Record<string, string> = {
          fist: '#f97316',
          ok_sign: '#38bdf8',
          l_shape: '#fbbf24',
          rock_on: '#a16207',
        }
        const color = colors[proj.spell] ?? '#f97316'

        const grad = ctx.createLinearGradient(proj.prevX, proj.prevY, proj.x, proj.y)
        grad.addColorStop(0, color + '22')
        grad.addColorStop(1, color)
        ctx.strokeStyle = grad
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(proj.prevX, proj.prevY)
        ctx.lineTo(proj.x, proj.y)
        ctx.stroke()

        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Enemy projectiles — trail toward barrier core
      for (const ep of engine.enemyProjectiles) {
        const grad = ctx.createLinearGradient(ep.prevX, ep.prevY, ep.x, ep.y)
        grad.addColorStop(0, 'rgba(255,77,109,0.2)')
        grad.addColorStop(1, '#ff4d6d')
        ctx.strokeStyle = grad
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(ep.prevX, ep.prevY)
        ctx.lineTo(ep.x, ep.y)
        ctx.stroke()

        ctx.fillStyle = '#ff4d6d'
        ctx.shadowColor = '#ff4d6d'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Crosshair reticle
      const reticleX = engine.crosshair.x * w
      const reticleY = engine.crosshair.y * h
      ctx.strokeStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(reticleX, reticleY, 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(reticleX - 30, reticleY); ctx.lineTo(reticleX - 12, reticleY)
      ctx.moveTo(reticleX + 12, reticleY); ctx.lineTo(reticleX + 30, reticleY)
      ctx.moveTo(reticleX, reticleY - 30); ctx.lineTo(reticleX, reticleY - 12)
      ctx.moveTo(reticleX, reticleY + 12); ctx.lineTo(reticleX, reticleY + 30)
      ctx.stroke()
      ctx.fillStyle = isLight ? '#0077ff' : '#00e5ff'
      ctx.beginPath()
      ctx.arc(reticleX, reticleY, 3, 0, Math.PI * 2)
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

    const drawSpellbookBar = (
      ctx: CanvasRenderingContext2D,
      w: number,
      barrierY: number,
      isLight: boolean,
      currentGesture: string | null
    ) => {
      const spells = TRAINING_GESTURES
      const slotW = Math.min(118, (w - 32) / spells.length)
      const totalW = slotW * spells.length
      const startX = (w - totalW) / 2
      const barTop = barrierY + 10

      ctx.textAlign = 'center'
      ctx.fillStyle = isLight ? '#475569' : '#94a3b8'
      ctx.font = 'bold 9px Inter, system-ui, sans-serif'
      ctx.fillText('SPELLBOOK', w / 2, barTop + 10)

      for (let i = 0; i < spells.length; i++) {
        const gesture = spells[i]
        const info = SPELL_LABELS[gesture]
        const isActive = currentGesture === gesture
        const x = startX + i * slotW
        const badgeW = slotW - 6
        const badgeH = 24
        const badgeY = barTop + 16

        ctx.fillStyle = isActive
          ? (isLight ? 'rgba(0,119,255,0.18)' : 'rgba(0,229,255,0.18)')
          : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)')
        roundRect(ctx, x + 3, badgeY, badgeW, badgeH, 6)
        ctx.fill()
        ctx.strokeStyle = isActive
          ? (isLight ? '#0077ff' : '#00e5ff')
          : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)')
        ctx.lineWidth = isActive ? 2 : 1
        ctx.stroke()

        ctx.fillStyle = isLight ? '#0d1117' : '#f0f4ff'
        ctx.font = isActive ? 'bold 10px Inter, system-ui, sans-serif' : '10px Inter, system-ui, sans-serif'
        ctx.fillText(`${info.emoji} ${info.name}`, x + slotW / 2, badgeY + 16)
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

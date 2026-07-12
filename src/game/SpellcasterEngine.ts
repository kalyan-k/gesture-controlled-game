import type { SpellGesture } from '../gestures/GestureTypes'
import {
  type Enemy,
  type Projectile,
  type EnemyProjectile,
  type HitEffect,
  type EnemyType,
  type EnemyElement,
  ENEMY_CONFIGS,
  canKnockOut,
} from './spellcasterTypes'
import { checkSpellWeaver } from '../store/gameStore'

const BARRIER_Y_RATIO = 0.92
const BULLSEYE_RADIUS = 24
const PROJECTILE_SPEED = 480
const CAST_COOLDOWN_MS = 350
const SHIELD_DURATION_MS = 1000
const SPAWN_MIN_S = 3
const SPAWN_MAX_S = 5
const SPAWN_CHANNELS = 5
const CAST_STABILITY_MS = 120
const ENEMY_PROJECTILE_SPEED = 260

export interface GameEngineCallbacks {
  onHit: (basePoints: number, bullseye: boolean) => number
  onSpellWeaver: () => number
  onBarrierDamage: (amount: number) => void
  onComboReset: () => void
  onCast: (spell: SpellGesture) => void
  onKill: (element: EnemyElement, elite: boolean) => void
  onMiss: () => void
}

export class SpellcasterEngine {
  enemies: Enemy[] = []
  projectiles: Projectile[] = []
  enemyProjectiles: EnemyProjectile[] = []
  hitEffects: HitEffect[] = []

  crosshair = { x: 0.5, y: 0.5 }
  shieldActive = false
  shieldTimer = 0
  wave = 1
  spawnTimer = 3
  elapsed = 0
  lastCastSpell: SpellGesture | null = null

  private lastCastTime = 0
  private lastGesture: string = 'none'
  private castThisHold = false
  private noneFrameStreak = 0
  private recentSpells: { spell: SpellGesture; time: number }[] = []
  private spellWeaverTriggered = false
  private callbacks: GameEngineCallbacks

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks
  }

  reset() {
    this.enemies = []
    this.projectiles = []
    this.enemyProjectiles = []
    this.hitEffects = []
    this.wave = 1
    this.spawnTimer = SPAWN_MIN_S + Math.random() * (SPAWN_MAX_S - SPAWN_MIN_S)
    this.elapsed = 0
    this.shieldActive = false
    this.shieldTimer = 0
    this.lastGesture = 'none'
    this.castThisHold = false
    this.noneFrameStreak = 0
    this.recentSpells = []
    this.spellWeaverTriggered = false
    this.lastCastTime = 0
    this.lastCastSpell = null
  }

  update(
    dt: number,
    width: number,
    height: number,
    gesture: string,
    handCenter: { x: number; y: number } | null,
    playPosition: { x: number; y: number } | null,
    frozen: boolean,
    stabilityMs = 0
  ) {
    if (playPosition) {
      this.crosshair.x = playPosition.x
      this.crosshair.y = playPosition.y
    } else if (handCenter) {
      // Fallback if mapping not applied
      this.crosshair.x = 1 - handCenter.x
      this.crosshair.y = handCenter.y
    }

    if (frozen || width <= 0 || height <= 0) return

    this.elapsed += dt
    const barrierY = this.getBarrierY(height)

    // ── Cast when gesture is stable (tolerate brief flicker to 'none') ──
    const isSpell = gesture !== 'none' && gesture !== 'pause_toggle'
    if (isSpell) {
      this.noneFrameStreak = 0
      if (gesture !== this.lastGesture) {
        this.lastGesture = gesture
        this.castThisHold = false
      }
      if (
        !this.castThisHold &&
        stabilityMs >= CAST_STABILITY_MS &&
        performance.now() - this.lastCastTime > CAST_COOLDOWN_MS
      ) {
        this.castSpell(gesture as SpellGesture, width, height, barrierY)
        this.lastCastTime = performance.now()
        this.castThisHold = true
      }
    } else {
      this.noneFrameStreak++
      if (this.noneFrameStreak > 3) {
        this.lastGesture = 'none'
        this.castThisHold = false
      }
    }

    if (this.shieldActive) {
      this.shieldTimer -= dt * 1000
      if (this.shieldTimer <= 0) this.shieldActive = false
    }

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnEnemy(width)
      this.spawnTimer = SPAWN_MIN_S + Math.random() * (SPAWN_MAX_S - SPAWN_MIN_S)
    }

    this.wave = Math.max(1, Math.floor(this.elapsed / 30) + 1)

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue
      enemy.spawnAge += dt

      const speedMult = enemy.slowed ? 0.4 : 1
      enemy.y += enemy.config.speed * speedMult * dt
      enemy.x += enemy.vx * dt

      if (enemy.slowed) {
        enemy.slowTimer -= dt
        if (enemy.slowTimer <= 0) enemy.slowed = false
      }

      if (
        enemy.config.canShoot &&
        enemy.y > height * 0.15 &&
        enemy.y < barrierY - 40 &&
        Math.random() < 0.003
      ) {
        const originX = enemy.x
        const originY = enemy.y + enemy.config.size * 0.5
        const targetX = width / 2
        const targetY = barrierY
        const dx = targetX - originX
        const dy = targetY - originY
        const dist = Math.hypot(dx, dy) || 1
        this.enemyProjectiles.push({
          id: crypto.randomUUID(),
          x: originX,
          y: originY,
          prevX: originX,
          prevY: originY,
          vx: (dx / dist) * ENEMY_PROJECTILE_SPEED,
          vy: (dy / dist) * ENEMY_PROJECTILE_SPEED,
          active: true,
        })
      }

      if (enemy.y + enemy.config.size * 0.5 >= barrierY) {
        this.callbacks.onBarrierDamage(enemy.config.elite ? 12 : 6)
        this.callbacks.onComboReset()
        enemy.hp = 0
      }
    }

    // Move projectiles, then collide BEFORE out-of-bounds check
    for (const proj of this.projectiles) {
      if (!proj.active || proj.missed) continue
      proj.prevX = proj.x
      proj.prevY = proj.y
      proj.x += proj.vx * dt
      proj.y += proj.vy * dt
    }

    this.resolveCollisions()

    for (const proj of this.projectiles) {
      if (!proj.active || proj.missed) continue
      if (proj.impact === 'point' && proj.targetX != null && proj.targetY != null) {
        const remaining = Math.hypot(proj.targetX - proj.x, proj.targetY - proj.y)
        const step = Math.hypot(proj.x - proj.prevX, proj.y - proj.prevY)
        if (remaining < 24 || (remaining < step && step > 0)) {
          this.detonateAt(proj.spell, proj.targetX, proj.targetY, proj.impactRadius ?? 120)
          proj.active = false
        }
      }
    }

    for (const proj of this.projectiles) {
      if (!proj.active || proj.missed) continue
      const oob =
        proj.y < -60 ||
        proj.y > height + 60 ||
        proj.x < -60 ||
        proj.x > width + 60
      if (oob) {
        proj.missed = true
        proj.active = false
        this.callbacks.onMiss()
        this.callbacks.onComboReset()
      }
    }

    for (const ep of this.enemyProjectiles) {
      if (!ep.active) continue
      ep.prevX = ep.x
      ep.prevY = ep.y
      ep.x += ep.vx * dt
      ep.y += ep.vy * dt

      if (this.shieldActive && ep.y > barrierY - 60) {
        ep.active = false
        continue
      }

      const distToCore = Math.hypot(ep.x - width / 2, ep.y - barrierY)
      if (distToCore < 36) {
        ep.active = false
        this.callbacks.onBarrierDamage(4)
        this.callbacks.onComboReset()
      }
    }

    for (const fx of this.hitEffects) {
      fx.timer -= dt
    }
    this.hitEffects = this.hitEffects.filter((fx) => fx.timer > 0)

    this.enemies = this.enemies.filter((e) => e.hp > 0)
    this.projectiles = this.projectiles.filter((p) => p.active)
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.active)
  }

  private castSpell(spell: SpellGesture, width: number, height: number, barrierY: number) {
    this.callbacks.onCast(spell)
    this.lastCastSpell = spell

    const now = Date.now()
    this.recentSpells = [...this.recentSpells, { spell, time: now }].filter(
      (e) => now - e.time < 15_000
    )

    if (checkSpellWeaver(this.recentSpells) && !this.spellWeaverTriggered) {
      this.spellWeaverTriggered = true
      this.callbacks.onSpellWeaver()
      setTimeout(() => { this.spellWeaverTriggered = false }, 15_000)
    }

    const cx = this.crosshair.x * width
    const cy = this.crosshair.y * height
    const origin = this.getBarrierOrigin(width, barrierY)

    if (spell === 'open_palm') {
      this.shieldActive = true
      this.shieldTimer = SHIELD_DURATION_MS
      return
    }

    if (spell === 'l_shape') {
      this.fireFromBarrier(spell, origin.x, origin.y, cx, cy, 'point', 120)
      return
    }

    if (spell === 'rock_on') {
      this.fireFromBarrier(spell, origin.x, origin.y, cx, cy, 'point', 140)
      return
    }

    if (spell === 'ok_sign') {
      this.fireFromBarrier(spell, origin.x, origin.y, cx, cy, 'point', 120)
      return
    }

    this.fireFromBarrier(spell, origin.x, origin.y, cx, cy, 'enemy')
  }

  private getBarrierOrigin(width: number, barrierY: number) {
    return { x: width / 2, y: barrierY - 10 }
  }

  private fireFromBarrier(
    spell: SpellGesture,
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    impact: Projectile['impact'],
    impactRadius?: number
  ) {
    const dx = targetX - originX
    const dy = targetY - originY
    const dist = Math.hypot(dx, dy) || 1
    this.projectiles.push({
      id: crypto.randomUUID(),
      spell,
      x: originX,
      y: originY,
      prevX: originX,
      prevY: originY,
      vx: (dx / dist) * PROJECTILE_SPEED,
      vy: (dy / dist) * PROJECTILE_SPEED,
      active: true,
      missed: false,
      impact,
      targetX,
      targetY,
      impactRadius,
    })
  }

  private detonateAt(spell: SpellGesture, x: number, y: number, radius: number) {
    if (spell === 'l_shape') {
      this.strikeAt(spell, x, y, radius)
      this.addAoeRing(x, y, '#fbbf24')
      return
    }
    if (spell === 'rock_on') {
      this.aoeAt(spell, x, y, radius)
      this.addAoeRing(x, y, '#a16207')
      return
    }
    if (spell === 'ok_sign') {
      this.aoeAt(spell, x, y, radius)
      this.addAoeRing(x, y, '#38bdf8')
    }
  }

  private addAoeRing(x: number, y: number, color: string) {
    this.hitEffects.push({ id: crypto.randomUUID(), x, y, timer: 0.35, color })
  }

  private strikeAt(spell: SpellGesture, x: number, y: number, radius: number) {
    let hit = false
    for (const enemy of [...this.enemies]) {
      if (enemy.hp <= 0) continue
      if (!this.isNear(enemy, x, y, radius)) continue
      if (canKnockOut(spell, enemy.config.type)) {
        this.killEnemy(enemy, x, y)
        hit = true
      }
    }
    if (!hit) {
      this.callbacks.onMiss()
      this.callbacks.onComboReset()
    }
  }

  private aoeAt(spell: SpellGesture, x: number, y: number, radius: number) {
    let hit = false
    for (const enemy of [...this.enemies]) {
      if (enemy.hp <= 0) continue
      if (!this.isNear(enemy, x, y, radius)) continue
      if (canKnockOut(spell, enemy.config.type)) {
        this.killEnemy(enemy, x, y)
        hit = true
      } else if (spell === 'rock_on') {
        enemy.slowed = true
        enemy.slowTimer = 3
      }
    }
    if (!hit) {
      this.callbacks.onMiss()
      this.callbacks.onComboReset()
    }
  }

  private resolveCollisions() {
    for (const proj of this.projectiles) {
      if (!proj.active || proj.impact !== 'enemy') continue
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue

        const hitNow = this.isNear(enemy, proj.x, proj.y, 22)
        const hitPath = this.segmentHitsEnemy(
          proj.prevX, proj.prevY, proj.x, proj.y, enemy, 22
        )

        if (!hitNow && !hitPath) continue

        if (canKnockOut(proj.spell, enemy.config.type)) {
          this.killEnemy(enemy, proj.x, proj.y)
          proj.active = false
          break
        }
      }
    }
  }

  private segmentHitsEnemy(
    x1: number, y1: number, x2: number, y2: number,
    enemy: Enemy, padding: number
  ): boolean {
    const r = enemy.config.size * 0.5 + padding
    const dx = x2 - x1
    const dy = y2 - y1
    const fx = x1 - enemy.x
    const fy = y1 - enemy.y
    const a = dx * dx + dy * dy
    if (a === 0) return Math.hypot(fx, fy) < r
    const t = Math.max(0, Math.min(1, -(fx * dx + fy * dy) / a))
    const cx = x1 + t * dx
    const cy = y1 + t * dy
    return Math.hypot(cx - enemy.x, cy - enemy.y) < r
  }

  private isNear(enemy: Enemy, x: number, y: number, radius: number): boolean {
    return Math.hypot(enemy.x - x, enemy.y - y) < enemy.config.size * 0.5 + radius
  }

  private killEnemy(enemy: Enemy, hitX: number, hitY: number) {
    const bullseye = Math.hypot(hitX - enemy.x, hitY - enemy.y) < BULLSEYE_RADIUS
    this.callbacks.onHit(enemy.config.basePoints, bullseye)
    this.callbacks.onKill(enemy.config.element, enemy.config.elite)
    enemy.hp = 0
    this.hitEffects.push({
      id: crypto.randomUUID(),
      x: enemy.x,
      y: enemy.y,
      timer: 0.4,
      color: enemy.config.color,
    })
  }

  private spawnEnemy(width: number) {
    const types: EnemyType[] = ['goblin', 'frost', 'fire', 'orc', 'bat']
    const weights = [0.28, 0.22, 0.15, 0.15, 0.2]
    let r = Math.random()
    let type: EnemyType = 'goblin'
    for (let i = 0; i < types.length; i++) {
      r -= weights[i]
      if (r <= 0) { type = types[i]; break }
    }

    const config = ENEMY_CONFIGS[type]
    const channel = Math.floor(Math.random() * SPAWN_CHANNELS)
    const channelWidth = width / SPAWN_CHANNELS
    const x = channelWidth * channel + channelWidth * 0.5 + (Math.random() - 0.5) * channelWidth * 0.4

    this.enemies.push({
      id: crypto.randomUUID(),
      config,
      x: Math.max(config.size, Math.min(width - config.size, x)),
      y: -config.size,
      vx: (Math.random() - 0.5) * 15,
      vy: config.speed,
      hp: 1,
      slowed: false,
      slowTimer: 0,
      spawnAge: 0,
    })
  }

  getBarrierY(height: number) {
    return height * BARRIER_Y_RATIO
  }
}

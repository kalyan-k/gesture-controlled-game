import type { SpellGesture } from '../gestures/GestureTypes'
import { SPELL_LABELS } from '../gestures/GestureTypes'

export type EnemyType = 'goblin' | 'frost' | 'fire' | 'orc' | 'bat'
export type EnemyElement = 'wood' | 'ice' | 'fire' | 'earth' | 'air'

export interface EnemyConfig {
  type: EnemyType
  element: EnemyElement
  label: string
  color: string
  basePoints: number
  speed: number
  size: number
  elite: boolean
  canShoot: boolean
  /** Which spell gesture knocks this enemy out */
  weakTo: SpellGesture
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  goblin: { type: 'goblin', element: 'wood',  label: 'Goblin',         color: '#22c55e', basePoints: 100, speed: 70,  size: 32, elite: false, canShoot: false, weakTo: 'fist' },
  frost:  { type: 'frost',  element: 'ice',   label: 'Frost Spirit',   color: '#38bdf8', basePoints: 100, speed: 100, size: 28, elite: false, canShoot: true,  weakTo: 'fist' },
  fire:   { type: 'fire',   element: 'fire',  label: 'Fire Elemental', color: '#f97316', basePoints: 500, speed: 60,  size: 38, elite: true,  canShoot: true,  weakTo: 'ok_sign' },
  orc:    { type: 'orc',    element: 'earth', label: 'Orc',            color: '#a16207', basePoints: 500, speed: 45,  size: 42, elite: true,  canShoot: false, weakTo: 'rock_on' },
  bat:    { type: 'bat',    element: 'air',   label: 'Bat',            color: '#a78bfa', basePoints: 100, speed: 130, size: 24, elite: false, canShoot: false, weakTo: 'l_shape' },
}

/** Player-facing matchup chart: gesture → which enemies it destroys */
export const SPELL_KNOCKOUTS: Record<SpellGesture, { targets: string; enemyTypes: EnemyType[] }> = {
  fist:      { targets: 'Goblin, Frost Spirit',     enemyTypes: ['goblin', 'frost'] },
  open_palm: { targets: 'None — blocks shots only', enemyTypes: [] },
  l_shape:   { targets: 'Bat, Frost Spirit',        enemyTypes: ['bat', 'frost'] },
  rock_on:   { targets: 'Orc',                      enemyTypes: ['orc'] },
  ok_sign:   { targets: 'Fire Elemental',           enemyTypes: ['fire'] },
}

export function getKnockoutLabel(gesture: SpellGesture): string {
  const info = SPELL_LABELS[gesture]
  const knock = SPELL_KNOCKOUTS[gesture]
  return `${info.emoji} ${info.name} → ${knock.targets}`
}

export function getEnemyWeaknessLabel(type: EnemyType): string {
  const cfg = ENEMY_CONFIGS[type]
  const spell = SPELL_LABELS[cfg.weakTo]
  return `Use ${spell.emoji} ${spell.name}`
}

export interface Enemy {
  id: string
  config: EnemyConfig
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  slowed: boolean
  slowTimer: number
}

export interface Projectile {
  id: string
  spell: SpellGesture
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  active: boolean
  missed: boolean
}

export interface EnemyProjectile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
}

export interface HitEffect {
  id: string
  x: number
  y: number
  timer: number
  color: string
}

/** True when this spell can destroy this enemy element */
export function isSpellEffective(spell: SpellGesture, element: EnemyElement): boolean {
  switch (spell) {
    case 'fist':      return element === 'ice' || element === 'wood'
    case 'open_palm': return false
    case 'l_shape':   return element === 'air' || element === 'ice'
    case 'rock_on':   return element === 'earth'
    case 'ok_sign':   return element === 'fire'
    default:          return false
  }
}

/** Check spell vs specific enemy type (uses weakTo for clarity) */
export function canKnockOut(spell: SpellGesture, enemyType: EnemyType): boolean {
  return ENEMY_CONFIGS[enemyType].weakTo === spell ||
    isSpellEffective(spell, ENEMY_CONFIGS[enemyType].element)
}

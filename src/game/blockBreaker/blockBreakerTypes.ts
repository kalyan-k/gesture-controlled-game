export type PowerUpType = 'extra_life' | 'extra_ball' | 'safety_bar'

export type BlockBreakerStage = 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER'

export interface Brick {
  id: string
  x: number
  y: number
  w: number
  h: number
  color: string
  points: number
  alive: boolean
}

export interface Ball {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  stuck: boolean
}

export interface PowerUp {
  id: string
  x: number
  y: number
  type: PowerUpType
  vy: number
  w: number
  h: number
  active: boolean
}

export const BRICK_ROWS = [
  { color: '#dc2626', lightColor: '#a84848', points: 50 },
  { color: '#dc2626', lightColor: '#a84848', points: 50 },
  { color: '#ca8a04', lightColor: '#9a7030', points: 30 },
  { color: '#ca8a04', lightColor: '#9a7030', points: 30 },
  { color: '#16a34a', lightColor: '#3d7a52', points: 10 },
  { color: '#16a34a', lightColor: '#3d7a52', points: 10 },
]

/** Brick field width & top inset: 90% occupancy → 5% margin on left, right, and top */
export const BOARD_FILL_RATIO = 0.9
/** Brick field height: at most this fraction of the vertical play area (above paddle) */
export const BRICK_ZONE_HEIGHT_RATIO = 0.3

export const POWER_UP_LABELS: Record<PowerUpType, { label: string; color: string; lightColor: string }> = {
  extra_life: { label: '♥', color: '#dc2626', lightColor: '#b91c1c' },
  extra_ball: { label: '+1', color: '#ea580c', lightColor: '#c2410c' },
  safety_bar: { label: '▬', color: '#2563eb', lightColor: '#1d4ed8' },
}

export const SAFETY_BAR_DURATION_MS = 30_000
export const POWER_UP_DROP_CHANCE = 0.22
export const LIVES_PER_LEVEL = 3
export const LAUNCH_GESTURE_STABILITY_MS = 100

/** Brick grid inset from canvas edges (legacy — layout uses BOARD_FILL_RATIO) */
export const BRICK_MARGIN_X_RATIO = 0.05
export const BRICK_MARGIN_TOP_RATIO = 0.05
export const BRICK_COLS = 8

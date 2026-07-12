import {
  type Ball,
  type Brick,
  type PowerUp,
  type PowerUpType,
  BRICK_ROWS,
  BRICK_COLS,
  BOARD_FILL_RATIO,
  BRICK_ZONE_HEIGHT_RATIO,
  POWER_UP_DROP_CHANCE,
  SAFETY_BAR_DURATION_MS,
  LAUNCH_GESTURE_STABILITY_MS,
} from './blockBreakerTypes'
import { getRowBrickCounts, getLayoutNameForLevel } from './brickPatterns'

const BASE_PADDLE_W = Math.round(110 * 1.15)
const PADDLE_H = 14
const BALL_R = 8
const BASE_BALL_SPEED = 300
const PADDLE_Y_OFFSET = 48
const POWER_UP_FALL_SPEED = 140
const COUNTDOWN_S = 3
const SAFETY_BAR_BELOW_PADDLE = 10
const BRICK_CLEARANCE_ABOVE_PADDLE = 20
const MIN_VY_RATIO = 0.38
/** Max speed = level base + 40% */
const MAX_SPEED_RAMP = 0.4
/** Seconds to reach max in-level speed */
const SPEED_RAMP_DURATION_S = 90

export interface BlockBreakerCallbacks {
  onBrickHit: (points: number) => void
  onWallHit: () => void
  onPowerUpCatch: (type: PowerUpType) => void
  onBallLost: () => void
  onLevelClear: () => void
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Prevent horizontal-only trajectories */
function enforceBallAngle(ball: Ball) {
  const speed = Math.hypot(ball.vx, ball.vy) || ball.speed || BASE_BALL_SPEED
  let vx = ball.vx
  let vy = ball.vy

  if (Math.abs(vy) < speed * MIN_VY_RATIO) {
    const signY = vy === 0 ? -1 : Math.sign(vy)
    vy = signY * speed * MIN_VY_RATIO
    const maxVx = Math.sqrt(Math.max(0, speed * speed - vy * vy))
    vx = clamp(vx, -maxVx, maxVx)
    if (Math.abs(vx) < 1) {
      vx = (Math.random() > 0.5 ? 1 : -1) * maxVx * 0.6
    }
  }

  ball.vx = vx
  ball.vy = vy
  ball.speed = speed
}

export class BlockBreakerEngine {
  paddleX = 0
  paddleW = BASE_PADDLE_W
  paddleY = 0
  balls: Ball[] = []
  bricks: Brick[] = []
  powerUps: PowerUp[] = []

  stage: 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER' = 'COUNTDOWN'
  countdown = COUNTDOWN_S
  level = 1
  levelBaseSpeed = BASE_BALL_SPEED
  levelElapsed = 0
  ballSpeed = BASE_BALL_SPEED
  clearedPending = false
  safetyBarUntil = 0
  layoutName = 'Rectangle'

  private waitingForServe = false
  private lastLaunchGesture = 'none'
  private callbacks: BlockBreakerCallbacks

  constructor(callbacks: BlockBreakerCallbacks) {
    this.callbacks = callbacks
  }

  reset(level = 1) {
    this.level = level
    this.levelBaseSpeed = BASE_BALL_SPEED + (level - 1) * 12
    this.levelElapsed = 0
    this.ballSpeed = this.levelBaseSpeed
    this.stage = 'COUNTDOWN'
    this.countdown = COUNTDOWN_S
    this.paddleW = BASE_PADDLE_W
    this.safetyBarUntil = 0
    this.powerUps = []
    this.balls = []
    this.waitingForServe = false
    this.lastLaunchGesture = 'none'
    this.clearedPending = false
  }

  clearLevelPowers() {
    this.powerUps = []
    this.safetyBarUntil = 0
  }

  initLayout(width: number, height: number, isLight = false) {
    this.paddleY = height - PADDLE_Y_OFFSET
    this.paddleX = width / 2
    this.buildBricks(width, height, isLight)
    if (this.balls.length === 0) {
      this.spawnBall(height, true)
    }
  }

  setPaddleNormalizedX(normalizedX: number, width: number) {
    const half = this.paddleW / 2
    this.paddleX = clamp(normalizedX * width, half, width - half)
    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = this.paddleX
        ball.y = this.paddleY - PADDLE_H / 2 - BALL_R - 2
      }
    }
  }

  buildBricks(width: number, height: number, isLight = false) {
    const rows = BRICK_ROWS.length
    const maxCols = BRICK_COLS

    const margin = width * ((1 - BOARD_FILL_RATIO) / 2)
    const gridWidth = width * BOARD_FILL_RATIO
    const gridStartX = margin

    const paddleY = this.paddleY > 0 ? this.paddleY : height - PADDLE_Y_OFFSET
    const paddleTop = paddleY - PADDLE_H / 2
    const playTop = height * ((1 - BOARD_FILL_RATIO) / 2)
    const playBottom = paddleTop - BRICK_CLEARANCE_ABOVE_PADDLE
    const playHeight = Math.max(playBottom - playTop, 60)

    const gridTop = playTop
    const gridHeight = playHeight * BRICK_ZONE_HEIGHT_RATIO

    const gapX = Math.max(4, Math.round(gridWidth * 0.012))
    const gapY = Math.max(4, Math.round(gridHeight * 0.025))

    const brickW = (gridWidth - gapX * (maxCols - 1)) / maxCols
    const brickH = (gridHeight - gapY * (rows - 1)) / rows

    const rowCounts = getRowBrickCounts(this.level, rows, maxCols)
    this.layoutName = getLayoutNameForLevel(this.level)

    const bricks: Brick[] = []

    for (let row = 0; row < rows; row++) {
      const rowCfg = BRICK_ROWS[row]
      const count = rowCounts[row]
      const rowWidth = count * brickW + (count - 1) * gapX
      const startX = gridStartX + (gridWidth - rowWidth) / 2

      for (let col = 0; col < count; col++) {
        bricks.push({
          id: `${row}-${col}`,
          x: startX + col * (brickW + gapX),
          y: gridTop + row * (brickH + gapY),
          w: brickW,
          h: brickH,
          color: isLight ? rowCfg.lightColor : rowCfg.color,
          points: rowCfg.points,
          alive: true,
        })
      }
    }
    this.bricks = bricks
    this.clearedPending = false
  }

  private computeLevelSpeed(): number {
    const ramp = Math.min(1, this.levelElapsed / SPEED_RAMP_DURATION_S)
    return this.levelBaseSpeed * (1 + ramp * MAX_SPEED_RAMP)
  }

  private syncBallSpeeds() {
    this.ballSpeed = this.computeLevelSpeed()
    for (const ball of this.balls) {
      if (ball.stuck) continue
      const cur = Math.hypot(ball.vx, ball.vy)
      if (cur < 1) continue
      const scale = this.ballSpeed / cur
      ball.vx *= scale
      ball.vy *= scale
      ball.speed = this.ballSpeed
      enforceBallAngle(ball)
    }
  }

  spawnBall(height: number, stuck = false, offsetX = 0) {
    const angle = (Math.random() * 0.4 - 0.2) - Math.PI / 2
    const speed = this.ballSpeed
    const ball: Ball = {
      id: crypto.randomUUID(),
      x: this.paddleX + offsetX,
      y: stuck ? this.paddleY - PADDLE_H / 2 - BALL_R - 2 : height * 0.5,
      vx: stuck ? 0 : Math.cos(angle) * speed * 0.35,
      vy: stuck ? 0 : Math.sin(angle) * speed,
      speed,
      stuck,
    }
    if (!stuck) enforceBallAngle(ball)
    this.balls.push(ball)
    this.waitingForServe = false
  }

  hasStuckBall(): boolean {
    return this.balls.some((b) => b.stuck)
  }

  getSafetyBarY(): number {
    return this.paddleY + PADDLE_H / 2 + SAFETY_BAR_BELOW_PADDLE
  }

  isSafetyBarActive(now: number): boolean {
    return this.safetyBarUntil > now
  }

  update(
    dt: number,
    width: number,
    height: number,
    frozen: boolean,
    gesture: string,
    stabilityMs: number,
    now: number
  ) {
    if (width <= 0 || height <= 0) return

    this.paddleY = height - PADDLE_Y_OFFSET

    if (frozen) return

    if (this.stage === 'COUNTDOWN') {
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.stage = 'PLAYING'
      }
      return
    }

    if (this.stage !== 'PLAYING') return

    this.levelElapsed += dt
    this.syncBallSpeeds()

    if (
      gesture === 'open_palm' &&
      this.lastLaunchGesture !== 'open_palm' &&
      stabilityMs >= LAUNCH_GESTURE_STABILITY_MS
    ) {
      this.launchAllStuckBalls()
    }
    this.lastLaunchGesture = gesture === 'open_palm' ? 'open_palm' : 'none'

    const safetyBarY = this.getSafetyBarY()
    const safetyActive = this.isSafetyBarActive(now)

    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = this.paddleX
        ball.y = this.paddleY - PADDLE_H / 2 - BALL_R - 2
        continue
      }

      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      if (ball.x - BALL_R <= 0) {
        ball.x = BALL_R
        ball.vx = Math.abs(ball.vx)
        enforceBallAngle(ball)
        this.callbacks.onWallHit()
      } else if (ball.x + BALL_R >= width) {
        ball.x = width - BALL_R
        ball.vx = -Math.abs(ball.vx)
        enforceBallAngle(ball)
        this.callbacks.onWallHit()
      }

      if (ball.y - BALL_R <= 0) {
        ball.y = BALL_R
        ball.vy = Math.abs(ball.vy)
        enforceBallAngle(ball)
        this.callbacks.onWallHit()
      }

      const paddleTop = this.paddleY - PADDLE_H / 2
      const paddleBottom = this.paddleY + PADDLE_H / 2
      const paddleLeft = this.paddleX - this.paddleW / 2
      const paddleRight = this.paddleX + this.paddleW / 2

      if (
        ball.vy > 0 &&
        ball.y + BALL_R >= paddleTop &&
        ball.y + BALL_R <= paddleBottom + 6 &&
        ball.x >= paddleLeft - BALL_R &&
        ball.x <= paddleRight + BALL_R
      ) {
        ball.y = paddleTop - BALL_R - 0.5
        const hitPos = clamp((ball.x - this.paddleX) / (this.paddleW / 2), -1, 1)
        const maxAngle = Math.PI / 2.8
        const angle = hitPos * maxAngle
        const speed = Math.hypot(ball.vx, ball.vy) || ball.speed
        ball.vx = speed * Math.sin(angle)
        ball.vy = -Math.abs(speed * Math.cos(angle))
        ball.speed = speed
        enforceBallAngle(ball)
        this.callbacks.onWallHit()
      }

      if (
        safetyActive &&
        ball.vy > 0 &&
        ball.y + BALL_R >= safetyBarY - 2 &&
        ball.y + BALL_R <= safetyBarY + 12
      ) {
        ball.y = safetyBarY - BALL_R - 1
        const hitPos = clamp((ball.x - width / 2) / (width / 2), -1, 1)
        const maxAngle = Math.PI / 3
        const angle = hitPos * maxAngle
        const speed = Math.hypot(ball.vx, ball.vy) || ball.speed
        ball.vx = speed * Math.sin(angle)
        ball.vy = -Math.abs(speed * Math.cos(angle))
        enforceBallAngle(ball)
        this.callbacks.onWallHit()
      }

      for (const brick of this.bricks) {
        if (!brick.alive) continue
        if (!this.circleRectCollision(ball.x, ball.y, BALL_R, brick)) continue

        brick.alive = false
        const overlapTop = ball.y + BALL_R - brick.y
        const overlapBottom = brick.y + brick.h - (ball.y - BALL_R)
        const overlapLeft = ball.x + BALL_R - brick.x
        const overlapRight = brick.x + brick.w - (ball.x - BALL_R)
        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight)

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          ball.vy *= -1
        } else {
          ball.vx *= -1
        }
        enforceBallAngle(ball)

        this.callbacks.onBrickHit(brick.points)
        this.maybeDropPowerUp(brick)
        break
      }

      if (ball.y - BALL_R > height + 20) {
        ball.vx = 0
        ball.vy = 0
      }
    }

    const beforeCount = this.balls.length
    this.balls = this.balls.filter((b) => b.y - BALL_R <= height + 20)

    if (
      this.balls.length === 0 &&
      beforeCount > 0 &&
      !this.waitingForServe &&
      this.stage === 'PLAYING'
    ) {
      this.waitingForServe = true
      this.callbacks.onBallLost()
    }

    for (const pu of this.powerUps) {
      if (!pu.active) continue
      pu.y += pu.vy * dt

      const paddleLeft = this.paddleX - this.paddleW / 2
      const paddleRight = this.paddleX + this.paddleW / 2
      const paddleTop = this.paddleY - PADDLE_H / 2
      const paddleBottom = this.paddleY + PADDLE_H / 2

      if (
        pu.x + pu.w / 2 >= paddleLeft &&
        pu.x - pu.w / 2 <= paddleRight &&
        pu.y + pu.h / 2 >= paddleTop &&
        pu.y - pu.h / 2 <= paddleBottom
      ) {
        pu.active = false
        this.activatePowerUp(pu.type, width, height, now)
        this.callbacks.onPowerUpCatch(pu.type)
      }
    }
    this.powerUps = this.powerUps.filter((p) => p.active)

    const aliveBricks = this.bricks.filter((b) => b.alive)
    if (aliveBricks.length === 0 && this.bricks.length > 0 && !this.clearedPending) {
      this.clearedPending = true
      this.callbacks.onLevelClear()
    }
  }

  private launchAllStuckBalls() {
    let offset = 0
    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = this.paddleX + offset
        offset += 14
        this.launchBall(ball)
      }
    }
  }

  private launchBall(ball: Ball) {
    const angle = (Math.random() * 0.4 - 0.2) - Math.PI / 2
    ball.stuck = false
    ball.vx = Math.cos(angle) * this.ballSpeed * 0.35
    ball.vy = Math.sin(angle) * this.ballSpeed
    ball.speed = this.ballSpeed
    enforceBallAngle(ball)
  }

  private circleRectCollision(cx: number, cy: number, r: number, brick: Brick): boolean {
    const nearestX = clamp(cx, brick.x, brick.x + brick.w)
    const nearestY = clamp(cy, brick.y, brick.y + brick.h)
    const dx = cx - nearestX
    const dy = cy - nearestY
    return dx * dx + dy * dy <= r * r
  }

  private maybeDropPowerUp(brick: Brick) {
    if (Math.random() > POWER_UP_DROP_CHANCE) return
    const types: PowerUpType[] = ['extra_life', 'extra_ball', 'safety_bar']
    const type = types[Math.floor(Math.random() * types.length)]
    this.powerUps.push({
      id: crypto.randomUUID(),
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      type,
      vy: POWER_UP_FALL_SPEED,
      w: 28,
      h: 16,
      active: true,
    })
  }

  private activatePowerUp(type: PowerUpType, width: number, height: number, now: number) {
    if (type === 'extra_ball') {
      const moving = this.balls.find((b) => !b.stuck)
      if (moving) {
        const angle = Math.atan2(moving.vy, moving.vx) + 0.5
        const ball: Ball = {
          id: crypto.randomUUID(),
          x: moving.x,
          y: moving.y,
          vx: Math.cos(angle) * this.ballSpeed,
          vy: Math.sin(angle) * this.ballSpeed,
          speed: this.ballSpeed,
          stuck: false,
        }
        enforceBallAngle(ball)
        this.balls.push(ball)
      } else {
        const stuckCount = this.balls.filter((b) => b.stuck).length
        this.spawnBall(height, true, stuckCount * 14)
      }
      return
    }
    if (type === 'safety_bar') {
      this.safetyBarUntil = now + SAFETY_BAR_DURATION_MS
      const half = this.paddleW / 2
      this.paddleX = clamp(this.paddleX, half, width - half)
    }
  }
}

/**
 * Maps raw webcam hand coordinates to full play-area coordinates (0–1).
 *
 * The inner "play zone" rectangle on the camera feed maps to the entire game
 * canvas, so you never need to push your hand to the physical edge of the
 * webcam frame to reach edge targets.
 */

export interface Point2D {
  x: number
  y: number
}

/** Normalized inset on the camera feed (before mirror). */
export const CAMERA_PLAY_ZONE = {
  minX: 0.14,
  maxX: 0.86,
  minY: 0.12,
  maxY: 0.88,
}

/**
 * Convert raw MediaPipe hand center → game crosshair position (0–1).
 * X is mirrored to match the selfie-cam view.
 */
export function mapHandToPlayArea(raw: Point2D): Point2D {
  const mirroredX = 1 - raw.x
  const { minX, maxX, minY, maxY } = CAMERA_PLAY_ZONE

  const playX = clamp01((mirroredX - minX) / (maxX - minX))
  const playY = clamp01((raw.y - minY) / (maxY - minY))

  return { x: playX, y: playY }
}

/** Bounds of the play zone in mirrored display coordinates (for UI overlay). */
export function getPlayZoneDisplayBounds() {
  const { minX, maxX, minY, maxY } = CAMERA_PLAY_ZONE
  return {
    left: 1 - maxX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Exponential smoothing for stable crosshair */
export function smoothPoint(prev: Point2D, next: Point2D, factor = 0.35): Point2D {
  return {
    x: prev.x + (next.x - prev.x) * factor,
    y: prev.y + (next.y - prev.y) * factor,
  }
}

/** Map hand center → paddle X (0–1), using camera play-zone inset */
export function mapHandToPaddleX(raw: Point2D): number {
  return mapHandToPlayArea(raw).x
}

/** True if raw hand center is inside the play zone (still tracking comfortably) */
export function isInsidePlayZone(raw: Point2D): boolean {
  const mx = 1 - raw.x
  const { minX, maxX, minY, maxY } = CAMERA_PLAY_ZONE
  const margin = 0.06 // small outer tolerance before we warn
  return (
    mx >= minX - margin &&
    mx <= maxX + margin &&
    raw.y >= minY - margin &&
    raw.y <= maxY + margin
  )
}

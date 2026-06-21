import type { Landmark, GestureType } from './GestureTypes'
import type { CalibrationProfile } from '../store/gameStore'

interface Point { x: number; y: number }

const SYSTEM_STABILITY_MS = 500   // System gestures need 500 ms of stability
const SYSTEM_CONFIDENCE = 0.90    // System gestures need 90% confidence

export class GestureRecognizer {
  private history: { center: Point; time: number }[] = []
  private readonly historySize = 15

  private pinchStartTime = 0

  // Stability tracking
  private currentRawGesture: GestureType = 'none'
  private gestureStartTime = 0

  // Calibration (injected)
  private cal: CalibrationProfile = {
    pinchThreshold: 0.04,
    fistCurlRatio: 0.8,
    swipeMinDist: 0.15,
    swipeMinVel: 0.0015,
    palmExtendRatio: 1.1,
  }

  setCalibration(cal: CalibrationProfile) {
    this.cal = cal
  }

  analyze(
    landmarks: Landmark[],
    timestamp: number,
    confidence: number
  ): { gesture: GestureType; pinchPower?: number; stabilityMs?: number; isSystemGesture?: boolean } {
    const center = this.getHandCenter(landmarks)

    this.history.push({ center, time: timestamp })
    if (this.history.length > this.historySize) this.history.shift()

    // ── 1. Swipe check (high-priority, gesture-based) ──────────────────
    const swipe = this.detectSwipe()
    if (swipe !== 'none') {
      this.pinchStartTime = 0
      this.currentRawGesture = 'none'
      return { gesture: swipe }
    }

    // ── 2. Static gesture classification ──────────────────────────────
    const raw = this.classifyStatic(landmarks)

    // Stability / debouncing
    if (raw !== this.currentRawGesture) {
      this.currentRawGesture = raw
      this.gestureStartTime = timestamp
    }

    const duration = timestamp - this.gestureStartTime

    // System gestures (peace_sign, thumbs_up) need high confidence + 500 ms hold
    const isSystemGesture = raw === 'peace_sign' || raw === 'thumbs_up'
    if (isSystemGesture) {
      if (confidence < SYSTEM_CONFIDENCE || duration < SYSTEM_STABILITY_MS) {
        return { gesture: 'none' }
      }
      return { gesture: raw, isSystemGesture: true, stabilityMs: duration }
    }

    // Gameplay gestures
    if (raw === 'smash' && duration < 200) return { gesture: 'none' }
    if (raw === 'shield' && duration < 150) return { gesture: 'none' }

    if (raw === 'pinch') {
      if (this.pinchStartTime === 0) this.pinchStartTime = timestamp
      const power = Math.min(1, (timestamp - this.pinchStartTime) / 1000)
      return { gesture: 'pinch', pinchPower: power, stabilityMs: duration }
    } else {
      this.pinchStartTime = 0
    }

    return { gesture: raw, stabilityMs: duration }
  }

  // ── Detection helpers ────────────────────────────────────────────────

  private classifyStatic(landmarks: Landmark[]): GestureType {
    if (this.detectPinch(landmarks)) return 'pinch'
    if (this.detectPeaceSign(landmarks)) return 'peace_sign'
    if (this.detectThumbsUp(landmarks)) return 'thumbs_up'
    if (this.detectFist(landmarks)) return 'smash'
    if (this.detectOpenPalm(landmarks)) return 'shield'
    return 'none'
  }

  private getHandCenter(landmarks: Landmark[]): Point {
    const pts = [landmarks[0], landmarks[5], landmarks[17]]
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / 3,
      y: pts.reduce((s, p) => s + p.y, 0) / 3,
    }
  }

  private detectPinch(lm: Landmark[]) {
    const d = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y)
    return d < this.cal.pinchThreshold
  }

  private detectFist(lm: Landmark[]) {
    const wrist = lm[0]
    const tips  = [8, 12, 16, 20]
    const mcps  = [5, 9, 13, 17]
    for (let i = 0; i < 4; i++) {
      const td = Math.hypot(lm[tips[i]].x - wrist.x, lm[tips[i]].y - wrist.y)
      const md = Math.hypot(lm[mcps[i]].x - wrist.x, lm[mcps[i]].y - wrist.y)
      if (td > md * this.cal.fistCurlRatio) return false
    }
    return true
  }

  private detectOpenPalm(lm: Landmark[]) {
    const wrist = lm[0]
    const tips  = [8, 12, 16, 20]
    const pips  = [6, 10, 14, 18]
    let count = 0
    for (let i = 0; i < 4; i++) {
      const td = Math.hypot(lm[tips[i]].x - wrist.x, lm[tips[i]].y - wrist.y)
      const pd = Math.hypot(lm[pips[i]].x - wrist.x, lm[pips[i]].y - wrist.y)
      if (td > pd * this.cal.palmExtendRatio) count++
    }
    const thumbExt = Math.hypot(lm[4].x - wrist.x, lm[4].y - wrist.y) >
                     Math.hypot(lm[3].x - wrist.x, lm[3].y - wrist.y)
    if (thumbExt) count++
    return count === 5
  }

  /** Peace/V sign: Index + Middle extended, Ring + Pinky curled, Thumb loosely tucked */
  private detectPeaceSign(lm: Landmark[]) {
    const wrist = lm[0]
    // Index (8) and Middle (12) must be extended
    const indexExt = this.fingerExtended(lm, 8, 6, wrist)
    const midExt   = this.fingerExtended(lm, 12, 10, wrist)
    // Ring (16) and Pinky (20) must be curled
    const ringCurl  = !this.fingerExtended(lm, 16, 14, wrist)
    const pinkyCurl = !this.fingerExtended(lm, 20, 18, wrist)
    return indexExt && midExt && ringCurl && pinkyCurl
  }

  /** Thumbs Up: Thumb extended upward, all other fingers curled */
  private detectThumbsUp(lm: Landmark[]) {
    const wrist = lm[0]
    // Thumb tip should be clearly above wrist (lower y in normalized coords)
    const thumbUp = lm[4].y < wrist.y - 0.1
    // Other fingers curled
    const fist = this.detectFist(lm)
    // Check thumb is extended from its base
    const thumbExtended = Math.hypot(lm[4].x - wrist.x, lm[4].y - wrist.y) >
                          Math.hypot(lm[3].x - wrist.x, lm[3].y - wrist.y) * 1.1
    return thumbUp && thumbExtended && fist
  }

  private fingerExtended(
    lm: Landmark[],
    tipIdx: number,
    pipIdx: number,
    wrist: Landmark
  ): boolean {
    const tipD = Math.hypot(lm[tipIdx].x - wrist.x, lm[tipIdx].y - wrist.y)
    const pipD = Math.hypot(lm[pipIdx].x - wrist.x, lm[pipIdx].y - wrist.y)
    return tipD > pipD * this.cal.palmExtendRatio
  }

  private detectSwipe(): GestureType {
    if (this.history.length < 8) return 'none'
    const oldest = this.history[0]
    const newest = this.history[this.history.length - 1]
    const dt = newest.time - oldest.time
    if (dt === 0) return 'none'

    const dx = newest.center.x - oldest.center.x
    const dy = newest.center.y - oldest.center.y
    const dist = Math.hypot(dx, dy)
    const vx = dx / dt
    const vy = dy / dt

    if (dist > this.cal.swipeMinDist) {
      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx >  this.cal.swipeMinVel) return 'swipe_right'
        if (vx < -this.cal.swipeMinVel) return 'swipe_left'
      } else {
        if (vy >  this.cal.swipeMinVel) return 'swipe_down'
        if (vy < -this.cal.swipeMinVel) return 'swipe_up'
      }
    }
    return 'none'
  }
}

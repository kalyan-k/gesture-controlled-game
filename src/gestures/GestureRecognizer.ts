import type { Landmark, GestureType, SpellGesture } from './GestureTypes'
import type { CalibrationProfile } from '../store/gameStore'

interface Point { x: number; y: number }

const CAST_DEBOUNCE_MS = 180
const TRAINING_DEBOUNCE_MS = 100
const PAUSE_FIST_HOLD_MS = 400

export interface AnalyzeOptions {
  /** Pause gesture only works during active gameplay */
  pauseEnabled?: boolean
  /** Shorter hold time while completing the training checklist */
  trainingMode?: boolean
}

export class GestureRecognizer {
  private history: { center: Point; time: number }[] = []
  private readonly historySize = 15

  private currentRawGesture: GestureType = 'none'
  private gestureStartTime = 0

  // Pause: fist must be held, then peace sign (thumb tucked)
  private fistHoldStart = 0
  private fistQualified = false
  private pauseToggleCooldown = 0

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

  getHandCenter(landmarks: Landmark[]): Point {
    return this.computeHandCenter(landmarks)
  }

  analyze(
    landmarks: Landmark[],
    timestamp: number,
    _confidence: number,
    options: AnalyzeOptions = {}
  ): {
    gesture: GestureType
    handCenter: Point
    stabilityMs?: number
    isSystemGesture?: boolean
  } {
    const { pauseEnabled = false, trainingMode = false } = options
    const debounceMs = trainingMode ? TRAINING_DEBOUNCE_MS : CAST_DEBOUNCE_MS

    const center = this.computeHandCenter(landmarks)
    this.history.push({ center, time: timestamp })
    if (this.history.length > this.historySize) this.history.shift()

    const raw = this.classifyStatic(landmarks)

    // Track fist hold for pause (gameplay only)
    this.updateFistHold(raw, timestamp)

    // Pause toggle — only during PLAYING, never during training
    if (pauseEnabled) {
      const pauseToggle = this.detectPauseToggle(landmarks, raw, timestamp)
      if (pauseToggle) {
        return { gesture: 'pause_toggle', handCenter: center, isSystemGesture: true, stabilityMs: PAUSE_FIST_HOLD_MS }
      }
    } else {
      // Reset pause state so a training fist doesn't arm pause later
      this.resetPauseState()
    }

    if (raw !== this.currentRawGesture) {
      this.currentRawGesture = raw
      this.gestureStartTime = timestamp
    }

    const duration = timestamp - this.gestureStartTime

    if (raw === 'none') {
      return { gesture: 'none', handCenter: center, stabilityMs: duration }
    }

    if (duration < debounceMs) {
      return { gesture: 'none', handCenter: center, stabilityMs: duration }
    }

    return { gesture: raw, handCenter: center, stabilityMs: duration }
  }

  private resetPauseState() {
    this.fistHoldStart = 0
    this.fistQualified = false
  }

  private updateFistHold(raw: GestureType, timestamp: number) {
    if (raw === 'fist') {
      if (this.fistHoldStart === 0) this.fistHoldStart = timestamp
      this.fistQualified = timestamp - this.fistHoldStart >= PAUSE_FIST_HOLD_MS
    }
  }

  private classifyStatic(landmarks: Landmark[]): GestureType {
    if (this.detectOkSign(landmarks)) return 'ok_sign'
    if (this.detectLShape(landmarks)) return 'l_shape'
    if (this.detectRockOn(landmarks)) return 'rock_on'
    if (this.detectFist(landmarks)) return 'fist'
    if (this.detectOpenPalm(landmarks)) return 'open_palm'
    // Peace sign alone is NOT a spell — only used for pause after fist
    return 'none'
  }

  private computeHandCenter(landmarks: Landmark[]): Point {
    const pts = [landmarks[0], landmarks[5], landmarks[17]]
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / 3,
      y: pts.reduce((s, p) => s + p.y, 0) / 3,
    }
  }

  private detectOkSign(lm: Landmark[]): boolean {
    const thumbIndexDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y)
    if (thumbIndexDist > this.cal.pinchThreshold * 1.5) return false
    // Thumb and index touching is enough — don't require other fingers extended
    return true
  }

  private detectLShape(lm: Landmark[]): boolean {
    const wrist = lm[0]
    const indexExt = this.fingerExtended(lm, 8, 6, wrist)
    const thumbExt =
      Math.hypot(lm[4].x - wrist.x, lm[4].y - wrist.y) >
      Math.hypot(lm[3].x - wrist.x, lm[3].y - wrist.y) * 1.05
    const midCurl = !this.fingerExtended(lm, 12, 10, wrist)
    const ringCurl = !this.fingerExtended(lm, 16, 14, wrist)
    const pinkyCurl = !this.fingerExtended(lm, 20, 18, wrist)
    return indexExt && thumbExt && midCurl && ringCurl && pinkyCurl
  }

  private detectRockOn(lm: Landmark[]): boolean {
    const wrist = lm[0]
    const indexExt = this.fingerExtended(lm, 8, 6, wrist, 1.05)
    const pinkyExt = this.fingerExtended(lm, 20, 18, wrist, 1.05)
    const midCurl = !this.fingerExtended(lm, 12, 10, wrist, 1.05)
    const ringCurl = !this.fingerExtended(lm, 16, 14, wrist, 1.05)
    return indexExt && pinkyExt && midCurl && ringCurl
  }

  private detectFist(lm: Landmark[]): boolean {
    const wrist = lm[0]
    const tips = [8, 12, 16, 20]
    const mcps = [5, 9, 13, 17]
    for (let i = 0; i < 4; i++) {
      const td = Math.hypot(lm[tips[i]].x - wrist.x, lm[tips[i]].y - wrist.y)
      const md = Math.hypot(lm[mcps[i]].x - wrist.x, lm[mcps[i]].y - wrist.y)
      if (td > md * this.cal.fistCurlRatio) return false
    }
    return true
  }

  private detectOpenPalm(lm: Landmark[]): boolean {
    const wrist = lm[0]
    const tips = [8, 12, 16, 20]
    const pips = [6, 10, 14, 18]
    let count = 0
    for (let i = 0; i < 4; i++) {
      const td = Math.hypot(lm[tips[i]].x - wrist.x, lm[tips[i]].y - wrist.y)
      const pd = Math.hypot(lm[pips[i]].x - wrist.x, lm[pips[i]].y - wrist.y)
      if (td > pd * this.cal.palmExtendRatio) count++
    }
    const thumbExt =
      Math.hypot(lm[4].x - wrist.x, lm[4].y - wrist.y) >
      Math.hypot(lm[3].x - wrist.x, lm[3].y - wrist.y)
    if (thumbExt) count++
    return count >= 4
  }

  /** Peace / V sign: index + middle up, ring + pinky down, thumb tucked */
  private detectPeaceSign(lm: Landmark[]): boolean {
    const wrist = lm[0]
    const indexExt = this.fingerExtended(lm, 8, 6, wrist, 1.05)
    const midExt = this.fingerExtended(lm, 12, 10, wrist, 1.05)
    const ringCurl = !this.fingerExtended(lm, 16, 14, wrist, 1.05)
    const pinkyCurl = !this.fingerExtended(lm, 20, 18, wrist, 1.05)
    // Thumb must be tucked (not extended like L-shape)
    const thumbTucked =
      Math.hypot(lm[4].x - wrist.x, lm[4].y - wrist.y) <=
      Math.hypot(lm[3].x - wrist.x, lm[3].y - wrist.y) * 1.08
    return indexExt && midExt && ringCurl && pinkyCurl && thumbTucked
  }

  private fingerExtended(
    lm: Landmark[],
    tipIdx: number,
    pipIdx: number,
    wrist: Landmark,
    ratio?: number
  ): boolean {
    const r = ratio ?? this.cal.palmExtendRatio
    const tipD = Math.hypot(lm[tipIdx].x - wrist.x, lm[tipIdx].y - wrist.y)
    const pipD = Math.hypot(lm[pipIdx].x - wrist.x, lm[pipIdx].y - wrist.y)
    return tipD > pipD * r
  }

  private detectPauseToggle(lm: Landmark[], raw: GestureType, timestamp: number): boolean {
    if (raw === 'fist') return false

    if (!this.fistQualified || timestamp <= this.pauseToggleCooldown) {
      if (raw !== 'none') {
        this.resetPauseState()
      }
      return false
    }

    if (this.detectPeaceSign(lm)) {
      this.resetPauseState()
      this.pauseToggleCooldown = timestamp + 2000
      return true
    }

    if (raw !== 'none') {
      this.resetPauseState()
    }

    return false
  }

  isSpellGesture(g: GestureType): g is SpellGesture {
    return g === 'fist' || g === 'open_palm' || g === 'l_shape' || g === 'rock_on' || g === 'ok_sign'
  }
}

import type { Landmark, GestureType } from './GestureTypes'

interface Point {
  x: number
  y: number
}

export class GestureRecognizer {
  private history: { center: Point; time: number }[] = []
  private readonly historySize = 15 // Increased for better swipe tracking
  private pinchStartTime = 0
  
  // Stability tracking
  private currentStableGesture: GestureType = 'none'
  private gestureStartTime = 0

  analyze(landmarks: Landmark[], timestamp: number): { gesture: GestureType; pinchPower?: number } {
    const center = this.getHandCenter(landmarks)
    
    // Update history
    this.history.push({ center, time: timestamp })
    if (this.history.length > this.historySize) {
      this.history.shift()
    }

    // 1. Check Swipe (Immediate, overriding stability if detected strongly)
    const swipe = this.detectSwipe()
    if (swipe !== 'none') {
      this.pinchStartTime = 0
      this.currentStableGesture = 'none'
      return { gesture: swipe }
    }

    // 2. Check Static Gestures
    const isPinch = this.detectPinch(landmarks)
    const isFist = this.detectFist(landmarks)
    const isOpen = this.detectOpenPalm(landmarks)

    let rawGesture: GestureType = 'none'
    if (isPinch) rawGesture = 'pinch'
    else if (isFist) rawGesture = 'smash'
    else if (isOpen) rawGesture = 'shield'

    // Stability / Debouncing Check
    if (rawGesture !== this.currentStableGesture) {
      this.currentStableGesture = rawGesture
      this.gestureStartTime = timestamp
    }

    const duration = timestamp - this.gestureStartTime

    // Fist requires 200ms stability
    if (this.currentStableGesture === 'smash' && duration < 200) {
      return { gesture: 'none' } // Not stable yet
    }

    // Shield requires 150ms stability
    if (this.currentStableGesture === 'shield' && duration < 150) {
      return { gesture: 'none' }
    }

    // Pinch Logic (Continuous charging)
    if (this.currentStableGesture === 'pinch') {
      if (this.pinchStartTime === 0) this.pinchStartTime = timestamp
      const power = Math.min(1, (timestamp - this.pinchStartTime) / 1000) // Max power after 1 sec
      return { gesture: 'pinch', pinchPower: power }
    } else {
      this.pinchStartTime = 0
    }

    return { gesture: this.currentStableGesture }
  }

  private getHandCenter(landmarks: Landmark[]) {
    // Average of Wrist (0), Index MCP (5), Pinky MCP (17)
    const pts = [landmarks[0], landmarks[5], landmarks[17]]
    const x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length
    const y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length
    return { x, y }
  }

  private detectPinch(landmarks: Landmark[]) {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
    return dist < 0.04 // Stricter threshold
  }

  private detectFist(landmarks: Landmark[]) {
    // Check if tips (8, 12, 16, 20) are strictly below MCP joints relative to wrist
    const tips = [8, 12, 16, 20]
    const mcps = [5, 9, 13, 17]
    const wrist = landmarks[0]

    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y)
      const mcpDist = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y)
      
      // Fist requires fingers to be curled tightly (tip closer to wrist than MCP by a margin)
      if (tipDist > mcpDist * 0.8) return false
    }
    return true
  }

  private detectOpenPalm(landmarks: Landmark[]) {
    const tips = [8, 12, 16, 20]
    const pips = [6, 10, 14, 18]
    const wrist = landmarks[0]

    let extendedCount = 0
    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y)
      const pipDist = Math.hypot(landmarks[pips[i]].x - wrist.x, landmarks[pips[i]].y - wrist.y)
      
      // Open palm requires tips to be further out than PIP joints
      if (tipDist > pipDist * 1.1) extendedCount++
    }
    
    // Also check thumb extension
    const thumbTipDist = Math.hypot(landmarks[4].x - wrist.x, landmarks[4].y - wrist.y)
    const thumbIpDist = Math.hypot(landmarks[3].x - wrist.x, landmarks[3].y - wrist.y)
    if (thumbTipDist > thumbIpDist) extendedCount++

    // Require all 5 fingers extended for a stable open palm
    return extendedCount === 5
  }

  private detectSwipe(): GestureType {
    if (this.history.length < 8) return 'none'
    
    // Look back ~150ms in history (assuming 60fps, 10 frames = 166ms)
    const oldest = this.history[0]
    const newest = this.history[this.history.length - 1]
    const dt = newest.time - oldest.time
    if (dt === 0) return 'none'

    const dx = newest.center.x - oldest.center.x
    const dy = newest.center.y - oldest.center.y
    const distance = Math.hypot(dx, dy)
    const vx = dx / dt
    const vy = dy / dt

    // Require minimum distance to ignore micro jitters
    const minDistance = 0.15 // 15% of screen
    const minVelocity = 0.0015 // Velocity threshold

    if (distance > minDistance) {
      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx > minVelocity) return 'swipe_right'
        if (vx < -minVelocity) return 'swipe_left'
      } else {
        if (vy > minVelocity) return 'swipe_down'
        if (vy < -minVelocity) return 'swipe_up'
      }
    }

    return 'none'
  }
}

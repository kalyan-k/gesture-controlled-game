import type { Landmark, GestureType } from './GestureTypes'

export class GestureRecognizer {
  private history: { center: { x: number; y: number }; time: number }[] = []
  private readonly historySize = 10
  private pinchStartTime = 0

  analyze(landmarks: Landmark[], timestamp: number): { gesture: GestureType; pinchPower?: number } {
    const center = this.getHandCenter(landmarks)
    
    // Update history
    this.history.push({ center, time: timestamp })
    if (this.history.length > this.historySize) {
      this.history.shift()
    }

    // Check Swipe
    const swipe = this.detectSwipe()
    if (swipe !== 'none') {
      this.pinchStartTime = 0
      return { gesture: swipe }
    }

    // Check Static Gestures
    const isPinch = this.detectPinch(landmarks)
    const isFist = this.detectFist(landmarks)
    const isOpen = this.detectOpenPalm(landmarks)

    if (isPinch) {
      if (this.pinchStartTime === 0) this.pinchStartTime = timestamp
      const power = Math.min(1, (timestamp - this.pinchStartTime) / 1000) // Max power after 1 sec
      return { gesture: 'pinch', pinchPower: power }
    } else {
      // If we were pinching and just released, we could fire a blast event, but for now just state is none
      this.pinchStartTime = 0
    }

    if (isOpen) {
      return { gesture: 'shield' }
    }

    if (isFist) {
      return { gesture: 'smash' }
    }

    return { gesture: 'none' }
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
    return dist < 0.05 // Relative to image size (0-1)
  }

  private detectFist(landmarks: Landmark[]) {
    // Check if tips (8, 12, 16, 20) are below MCP joints (5, 9, 13, 17) relative to wrist
    const tips = [8, 12, 16, 20]
    const mcps = [5, 9, 13, 17]
    const wrist = landmarks[0]

    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y)
      const mcpDist = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y)
      // If tip is further from wrist than mcp, it's not curled
      if (tipDist > mcpDist) return false
    }
    return true
  }

  private detectOpenPalm(landmarks: Landmark[]) {
    const tips = [8, 12, 16, 20]
    const mcps = [5, 9, 13, 17]
    const wrist = landmarks[0]

    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y)
      const mcpDist = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y)
      // If tip is closer to wrist than mcp, it's curled
      if (tipDist < mcpDist * 1.2) return false // 1.2 margin
    }
    return true
  }

  private detectSwipe(): GestureType {
    if (this.history.length < 5) return 'none'
    
    const oldest = this.history[0]
    const newest = this.history[this.history.length - 1]
    const dt = newest.time - oldest.time
    if (dt === 0) return 'none'

    const dx = newest.center.x - oldest.center.x
    const dy = newest.center.y - oldest.center.y
    const vx = dx / dt
    const vy = dy / dt

    const velocityThreshold = 0.001 // Threshold might need tuning

    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > velocityThreshold) return 'swipe_right'
      if (vx < -velocityThreshold) return 'swipe_left'
    } else {
      if (vy > velocityThreshold) return 'swipe_down'
      if (vy < -velocityThreshold) return 'swipe_up'
    }

    return 'none'
  }
}

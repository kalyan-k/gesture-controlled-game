export type GestureType =
  | 'none'
  | 'swipe_up'
  | 'swipe_down'
  | 'swipe_left'
  | 'swipe_right'
  // Gameplay gestures
  | 'shield'
  | 'smash'
  | 'pinch'
  // System gestures (require higher stability)
  | 'peace_sign'     // V/Peace → Open Settings
  | 'thumbs_up'      // → Resume Game

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface GestureResult {
  gesture: GestureType
  confidence: number
  landmarks: Landmark[]
  pinchPower?: number      // 0–1 continuous
  isSystemGesture?: boolean
  stabilityMs?: number     // how long this gesture has been held
}

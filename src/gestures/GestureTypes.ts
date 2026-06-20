export type GestureType = 'none' | 'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right' | 'shield' | 'smash' | 'pinch'

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface GestureResult {
  gesture: GestureType
  confidence: number
  landmarks: Landmark[]
  pinchPower?: number // 0 to 1 depending on how long pinch is held
}

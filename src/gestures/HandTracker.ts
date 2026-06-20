import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null
  private isInitialized = false
  private lastVideoTime = -1

  async initialize() {
    if (this.isInitialized) return

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      )
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.7,
      })
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize HandTracker:', error)
      throw error
    }
  }

  detect(videoElement: HTMLVideoElement, timestamp: number) {
    if (!this.handLandmarker || !this.isInitialized) return null

    // Process frame only if video time has progressed
    if (videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = videoElement.currentTime
      return this.handLandmarker.detectForVideo(videoElement, timestamp)
    }

    return null
  }

  dispose() {
    if (this.handLandmarker) {
      this.handLandmarker.close()
      this.handLandmarker = null
      this.isInitialized = false
    }
  }
}

// Singleton instance
export const handTracker = new HandTracker()

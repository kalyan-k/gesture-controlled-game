import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameState =
  | 'landing'         // Welcome / permissions check
  | 'permissions'     // Explicit camera permission request
  | 'calibration'     // 5-step guided calibration
  | 'ready'           // System ready, idle – waiting for START GAME
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'dashboard'       // Dashboard idle (between calibration/playing, camera on)
  | 'settings'        // Settings modal open (overlaid)

export type Theme = 'dark' | 'light'

// Calibration thresholds personalised per player
export interface CalibrationProfile {
  pinchThreshold: number   // distance 0–1 for pinch
  fistCurlRatio: number    // tip/mcp ratio for fist
  swipeMinDist: number     // min normalized distance
  swipeMinVel: number      // min velocity
  palmExtendRatio: number  // tip/pip extension ratio
}

const DEFAULT_CALIBRATION: CalibrationProfile = {
  pinchThreshold: 0.04,
  fistCurlRatio: 0.8,
  swipeMinDist: 0.15,
  swipeMinVel: 0.0015,
  palmExtendRatio: 1.1,
}

export interface Settings {
  musicVolume: number     // 0–100
  sfxVolume: number       // 0–100
  sensitivity: number     // 0–100
  trackingSmoothing: number // 0–100
  showDebugOverlay: boolean
  camera: string          // deviceId or 'default'
  gestureSensitivity: number // 0–100
  theme: Theme
}

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 50,
  sfxVolume: 80,
  sensitivity: 70,
  trackingSmoothing: 60,
  showDebugOverlay: false,
  camera: 'default',
  gestureSensitivity: 70,
  theme: 'dark',
}

interface GameStore {
  // Flow state
  gameState: GameState
  previousGameState: GameState | null // for returning from settings

  // Game stats
  score: number
  combo: number
  maxCombo: number
  health: number
  energy: number
  level: number
  targetsDestroyed: number
  accuracy: number
  totalSwipes: number

  // Session stats
  sessionStart: number | null
  sessionDuration: number  // seconds
  gesturesDetected: number
  avgFps: number
  orbEnergyUsed: number

  // Runtime
  fps: number
  currentGesture: string | null
  isCameraReady: boolean
  isHandDetected: boolean
  lastHandSeenAt: number | null  // timestamp for idle detection
  idleWarning: boolean           // true when > 10s without hand
  showSystemFeedback: string | null // e.g. "GAME PAUSED"

  // Settings & calibration
  settings: Settings
  calibration: CalibrationProfile
  isCalibrated: boolean

  // Actions
  setGameState: (state: GameState) => void
  openSettings: () => void
  closeSettings: () => void

  addScore: (points: number) => void
  resetCombo: () => void
  takeDamage: (amount: number) => void
  useEnergy: (amount: number) => void
  chargeEnergy: (amount: number) => void
  recordSwipe: (hit: boolean) => void

  setFps: (fps: number) => void
  setCurrentGesture: (gesture: string | null) => void
  setCameraReady: (ready: boolean) => void
  setHandDetected: (detected: boolean, timestamp: number) => void
  setIdleWarning: (w: boolean) => void
  showFeedback: (msg: string) => void
  hideFeedback: () => void

  updateSettings: (partial: Partial<Settings>) => void
  updateCalibration: (profile: CalibrationProfile) => void
  setCalibrated: (v: boolean) => void

  startSession: () => void
  tickSession: (fps: number) => void

  resetGame: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Flow
      gameState: 'landing',
      previousGameState: null,

      // Game stats
      score: 0,
      combo: 0,
      maxCombo: 0,
      health: 100,
      energy: 100,
      level: 1,
      targetsDestroyed: 0,
      accuracy: 100,
      totalSwipes: 0,

      // Session
      sessionStart: null,
      sessionDuration: 0,
      gesturesDetected: 0,
      avgFps: 0,
      orbEnergyUsed: 0,

      // Runtime (not persisted)
      fps: 0,
      currentGesture: null,
      isCameraReady: false,
      isHandDetected: false,
      lastHandSeenAt: null,
      idleWarning: false,
      showSystemFeedback: null,

      // Settings & calibration (persisted)
      settings: DEFAULT_SETTINGS,
      calibration: DEFAULT_CALIBRATION,
      isCalibrated: false,

      // ── Actions ──────────────────────────────────────────────

      setGameState: (state) => set({ gameState: state }),

      openSettings: () => {
        const prev = get().gameState
        if (prev !== 'settings') {
          set({ previousGameState: prev, gameState: 'settings' })
        }
      },

      closeSettings: () => {
        const prev = get().previousGameState
        set({ gameState: prev ?? 'dashboard', previousGameState: null })
      },

      addScore: (points) =>
        set((state) => {
          const newCombo = state.combo + 1
          const newLevel = Math.floor(state.targetsDestroyed / 10) + 1
          return {
            score: state.score + points * newCombo,
            combo: newCombo,
            maxCombo: Math.max(state.maxCombo, newCombo),
            targetsDestroyed: state.targetsDestroyed + 1,
            level: newLevel,
            gesturesDetected: state.gesturesDetected + 1,
          }
        }),

      resetCombo: () => set({ combo: 0 }),

      takeDamage: (amount) =>
        set((state) => {
          const newHealth = Math.max(0, state.health - amount)
          if (newHealth === 0) return { health: 0, gameState: 'gameover' }
          return { health: newHealth }
        }),

      useEnergy: (amount) =>
        set((state) => ({
          energy: Math.max(0, state.energy - amount),
          orbEnergyUsed: state.orbEnergyUsed + amount,
        })),

      chargeEnergy: (amount) =>
        set((state) => ({ energy: Math.min(100, state.energy + amount) })),

      recordSwipe: (hit) =>
        set((state) => {
          const newTotal = state.totalSwipes + 1
          const hits = (state.accuracy / 100) * state.totalSwipes + (hit ? 1 : 0)
          return {
            totalSwipes: newTotal,
            accuracy: Math.round((hits / newTotal) * 100),
          }
        }),

      setFps: (fps) => set({ fps }),

      setCurrentGesture: (gesture) =>
        set((state) => ({
          currentGesture: gesture,
          gesturesDetected:
            gesture && gesture !== 'none'
              ? state.gesturesDetected + 1
              : state.gesturesDetected,
        })),

      setCameraReady: (ready) => set({ isCameraReady: ready }),

      setHandDetected: (detected, timestamp) =>
        set({
          isHandDetected: detected,
          lastHandSeenAt: detected ? timestamp : get().lastHandSeenAt,
          idleWarning: false,
        }),

      setIdleWarning: (w) => set({ idleWarning: w }),

      showFeedback: (msg) => set({ showSystemFeedback: msg }),
      hideFeedback: () => set({ showSystemFeedback: null }),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      updateCalibration: (profile) => set({ calibration: profile }),
      setCalibrated: (v) => set({ isCalibrated: v }),

      startSession: () =>
        set({ sessionStart: Date.now(), sessionDuration: 0, orbEnergyUsed: 0 }),

      tickSession: (fps) =>
        set((state) => {
          const now = Date.now()
          const elapsed = state.sessionStart
            ? (now - state.sessionStart) / 1000
            : 0
          const newAvg =
            state.avgFps === 0 ? fps : (state.avgFps * 0.95 + fps * 0.05)
          return { sessionDuration: elapsed, avgFps: newAvg, fps }
        }),

      resetGame: () =>
        set({
          gameState: 'dashboard',
          score: 0,
          combo: 0,
          health: 100,
          energy: 100,
          level: 1,
          targetsDestroyed: 0,
          totalSwipes: 0,
          accuracy: 100,
          currentGesture: null,
          gesturesDetected: 0,
          sessionStart: null,
          sessionDuration: 0,
          orbEnergyUsed: 0,
          idleWarning: false,
        }),
    }),
    {
      name: 'hand-strike-store',
      // Only persist settings + calibration, not runtime state
      partialize: (state) => ({
        settings: state.settings,
        calibration: state.calibration,
        isCalibrated: state.isCalibrated,
      }),
    }
  )
)

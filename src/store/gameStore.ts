import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpellGesture } from '../gestures/GestureTypes'
import { TRAINING_GESTURES } from '../gestures/GestureTypes'

export type GameStage = 'TRAINING_INTRO' | 'PLAYING' | 'GAME_OVER'

export type Theme = 'dark' | 'light'

export type GameState =
  | 'landing'
  | 'permissions'
  | 'dashboard'

export interface CalibrationProfile {
  pinchThreshold: number
  fistCurlRatio: number
  swipeMinDist: number
  swipeMinVel: number
  palmExtendRatio: number
}

const DEFAULT_CALIBRATION: CalibrationProfile = {
  pinchThreshold: 0.04,
  fistCurlRatio: 0.8,
  swipeMinDist: 0.15,
  swipeMinVel: 0.0015,
  palmExtendRatio: 1.1,
}

export interface Settings {
  musicVolume: number
  sfxVolume: number
  sensitivity: number
  trackingSmoothing: number
  showDebugOverlay: boolean
  camera: string
  gestureSensitivity: number
  theme: Theme
}

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 40,
  sfxVolume: 80,
  sensitivity: 70,
  trackingSmoothing: 60,
  showDebugOverlay: false,
  camera: 'default',
  gestureSensitivity: 70,
  theme: 'dark',
}

const MAX_COMBO_MULTIPLIER = 5.0
const COMBO_INCREMENT = 0.1
const SPELL_WEAVER_WINDOW_MS = 15_000

function emptyTrainingChecklist(): Record<SpellGesture, boolean> {
  return {
    fist: false,
    open_palm: false,
    l_shape: false,
    rock_on: false,
    ok_sign: false,
  }
}

interface GameStore {
  gameState: GameState
  stage: GameStage
  trainingComplete: boolean
  trainingGestures: Record<SpellGesture, boolean>
  skipTrainingOnRetry: boolean

  score: number
  highScore: number
  comboMultiplier: number
  maxComboMultiplier: number
  barrierHealth: number

  fps: number
  currentGesture: string | null
  lastCastGesture: SpellGesture | null
  isCameraReady: boolean
  isHandDetected: boolean
  lastHandSeenAt: number | null
  idleWarning: boolean
  handMissingPause: boolean
  isPaused: boolean
  showSystemFeedback: string | null
  showSettings: boolean

  settings: Settings
  calibration: CalibrationProfile

  // Spell weaver tracking
  recentSpells: { spell: SpellGesture; time: number }[]

  setGameState: (state: GameState) => void
  setStage: (stage: GameStage) => void
  markTrainingGesture: (gesture: SpellGesture) => void
  isTrainingComplete: () => boolean

  addHitScore: (basePoints: number, bullseye?: boolean) => number
  applySpellWeaverBonus: () => number
  resetComboMultiplier: () => void
  recordSpellCast: (spell: SpellGesture) => void
  takeBarrierDamage: (amount: number) => void

  setFps: (fps: number) => void
  setCurrentGesture: (gesture: string | null) => void
  setCameraReady: (ready: boolean) => void
  setHandDetected: (detected: boolean, timestamp: number) => void
  setHandMissingPause: (v: boolean) => void
  setIdleWarning: (w: boolean) => void
  setPaused: (paused: boolean) => void
  togglePause: () => void
  openSettings: () => void
  closeSettings: () => void
  showFeedback: (msg: string) => void
  hideFeedback: () => void

  updateSettings: (partial: Partial<Settings>) => void
  updateCalibration: (profile: CalibrationProfile) => void

  startAssault: () => void
  retryFromGameOver: () => void
  resetAll: () => void
  tickSession: (fps: number) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: 'landing',
      stage: 'TRAINING_INTRO',
      trainingComplete: false,
      trainingGestures: emptyTrainingChecklist(),
      skipTrainingOnRetry: false,

      score: 0,
      highScore: 0,
      comboMultiplier: 1.0,
      maxComboMultiplier: 1.0,
      barrierHealth: 100,

      fps: 0,
      currentGesture: null,
      lastCastGesture: null,
      isCameraReady: false,
      isHandDetected: false,
      lastHandSeenAt: null,
      idleWarning: false,
      handMissingPause: false,
      isPaused: false,
      showSystemFeedback: null,
      showSettings: false,

      settings: DEFAULT_SETTINGS,
      calibration: DEFAULT_CALIBRATION,
      recentSpells: [],

      setGameState: (state) => set({ gameState: state }),

      setStage: (stage) => set({ stage }),

      markTrainingGesture: (gesture) =>
        set((s) => {
          const updated = { ...s.trainingGestures, [gesture]: true }
          const complete = TRAINING_GESTURES.every((g) => updated[g])
          return {
            trainingGestures: updated,
            trainingComplete: complete,
          }
        }),

      isTrainingComplete: () => {
        const g = get().trainingGestures
        return TRAINING_GESTURES.every((k) => g[k])
      },

      addHitScore: (basePoints, bullseye = false) => {
        const state = get()
        const newMultiplier = Math.min(MAX_COMBO_MULTIPLIER, state.comboMultiplier + COMBO_INCREMENT)
        let points = Math.round(basePoints * newMultiplier)
        if (bullseye) points += 200

        set({
          score: state.score + points,
          highScore: Math.max(state.highScore, state.score + points),
          comboMultiplier: newMultiplier,
          maxComboMultiplier: Math.max(state.maxComboMultiplier, newMultiplier),
        })
        return points
      },

      applySpellWeaverBonus: () => {
        const bonus = 1000
        set((s) => ({
          score: s.score + bonus,
          highScore: Math.max(s.highScore, s.score + bonus),
        }))
        return bonus
      },

      resetComboMultiplier: () => set({ comboMultiplier: 1.0 }),

      recordSpellCast: (spell) => {
        const now = Date.now()
        set((s) => {
          const recent = [...s.recentSpells, { spell, time: now }].filter(
            (e) => now - e.time < SPELL_WEAVER_WINDOW_MS
          )
          return {
            lastCastGesture: spell,
            recentSpells: recent,
          }
        })
      },

      takeBarrierDamage: (amount) =>
        set((s) => {
          const newHealth = Math.max(0, s.barrierHealth - amount)
          if (newHealth === 0) {
            return {
              barrierHealth: 0,
              comboMultiplier: 1.0,
              stage: 'GAME_OVER' as GameStage,
              highScore: Math.max(s.highScore, s.score),
            }
          }
          return { barrierHealth: newHealth, comboMultiplier: 1.0 }
        }),

      setFps: (fps) => set({ fps }),
      setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
      setCameraReady: (ready) => set({ isCameraReady: ready }),

      setHandDetected: (detected, timestamp) =>
        set({
          isHandDetected: detected,
          lastHandSeenAt: detected ? timestamp : get().lastHandSeenAt,
        }),

      setHandMissingPause: (v) => set({ handMissingPause: v, idleWarning: v }),

      setIdleWarning: (w) => set({ idleWarning: w }),

      setPaused: (paused) => set({ isPaused: paused }),

      togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

      openSettings: () => set({ showSettings: true }),
      closeSettings: () => set({ showSettings: false }),

      showFeedback: (msg) => set({ showSystemFeedback: msg }),
      hideFeedback: () => set({ showSystemFeedback: null }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      updateCalibration: (profile) => set({ calibration: profile }),

      startAssault: () =>
        set({
          stage: 'PLAYING',
          score: 0,
          comboMultiplier: 1.0,
          maxComboMultiplier: 1.0,
          barrierHealth: 100,
          recentSpells: [],
          isPaused: false,
          handMissingPause: false,
        }),

      retryFromGameOver: () =>
        set((s) => ({
          stage: 'PLAYING',
          score: 0,
          comboMultiplier: 1.0,
          maxComboMultiplier: 1.0,
          barrierHealth: 100,
          recentSpells: [],
          isPaused: false,
          handMissingPause: false,
          skipTrainingOnRetry: true,
          highScore: Math.max(s.highScore, s.score),
        })),

      resetAll: () =>
        set({
          stage: 'TRAINING_INTRO',
          score: 0,
          comboMultiplier: 1.0,
          maxComboMultiplier: 1.0,
          barrierHealth: 100,
          trainingGestures: emptyTrainingChecklist(),
          trainingComplete: false,
          skipTrainingOnRetry: false,
          recentSpells: [],
          isPaused: false,
          handMissingPause: false,
        }),

      tickSession: (fps) => set({ fps }),
    }),
    {
      name: 'spellcaster-academy-store',
      partialize: (state) => ({
        settings: state.settings,
        calibration: state.calibration,
        highScore: state.highScore,
        trainingComplete: state.trainingComplete,
        trainingGestures: state.trainingGestures,
      }),
    }
  )
)

/** Check if all 5 spells were cast within rolling window */
export function checkSpellWeaver(recentSpells: { spell: SpellGesture; time: number }[]): boolean {
  const now = Date.now()
  const recent = recentSpells.filter((e) => now - e.time < SPELL_WEAVER_WINDOW_MS)
  const unique = new Set(recent.map((e) => e.spell))
  return unique.size === TRAINING_GESTURES.length
}

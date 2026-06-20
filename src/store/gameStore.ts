import { create } from 'zustand'

export type GameState = 'landing' | 'calibration' | 'playing' | 'paused' | 'gameover' | 'dashboard'

interface GameStore {
  gameState: GameState
  score: number
  combo: number
  maxCombo: number
  health: number
  energy: number // 0 to 100
  level: number
  targetsDestroyed: number
  accuracy: number // 0 to 100
  totalSwipes: number
  fps: number
  debugMode: boolean
  currentGesture: string | null
  isCameraReady: boolean
  
  setGameState: (state: GameState) => void
  addScore: (points: number) => void
  resetCombo: () => void
  takeDamage: (amount: number) => void
  useEnergy: (amount: number) => void
  chargeEnergy: (amount: number) => void
  recordSwipe: (hit: boolean) => void
  setFps: (fps: number) => void
  toggleDebugMode: () => void
  setCurrentGesture: (gesture: string | null) => void
  setCameraReady: (ready: boolean) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'landing',
  score: 0,
  combo: 0,
  maxCombo: 0,
  health: 100,
  energy: 100,
  level: 1,
  targetsDestroyed: 0,
  accuracy: 100,
  totalSwipes: 0,
  fps: 0,
  debugMode: false,
  currentGesture: null,
  isCameraReady: false,

  setGameState: (state) => set({ gameState: state }),

  addScore: (points) =>
    set((state) => {
      const newCombo = state.combo + 1
      const newLevel = Math.floor(state.targetsDestroyed / 10) + 1
      return {
        score: state.score + points * newCombo,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        targetsDestroyed: state.targetsDestroyed + 1,
        level: newLevel
      }
    }),

  resetCombo: () => set({ combo: 0 }),

  takeDamage: (amount) =>
    set((state) => {
      const newHealth = Math.max(0, state.health - amount)
      if (newHealth === 0) {
        return { health: 0, gameState: 'gameover' }
      }
      return { health: newHealth }
    }),

  useEnergy: (amount) => 
    set((state) => ({ energy: Math.max(0, state.energy - amount) })),
    
  chargeEnergy: (amount) => 
    set((state) => ({ energy: Math.min(100, state.energy + amount) })),

  recordSwipe: (hit) => 
    set((state) => {
      const newTotal = state.totalSwipes + 1
      const hits = (state.accuracy / 100) * state.totalSwipes + (hit ? 1 : 0)
      const newAccuracy = Math.round((hits / newTotal) * 100)
      return { totalSwipes: newTotal, accuracy: newAccuracy }
    }),

  setFps: (fps) => set({ fps }),
  
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
  
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),

  setCameraReady: (ready) => set({ isCameraReady: ready }),

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
      currentGesture: null
    }),
}))

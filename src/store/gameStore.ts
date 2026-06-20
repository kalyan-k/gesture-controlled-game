import { create } from 'zustand'

export type GameState = 'landing' | 'calibration' | 'playing' | 'paused' | 'gameover'

interface GameStore {
  gameState: GameState
  score: number
  combo: number
  maxCombo: number
  health: number
  level: number
  isCameraReady: boolean
  setGameState: (state: GameState) => void
  addScore: (points: number) => void
  resetCombo: () => void
  takeDamage: (amount: number) => void
  setCameraReady: (ready: boolean) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'landing',
  score: 0,
  combo: 0,
  maxCombo: 0,
  health: 100,
  level: 1,
  isCameraReady: false,

  setGameState: (state) => set({ gameState: state }),

  addScore: (points) =>
    set((state) => {
      const newCombo = state.combo + 1
      return {
        score: state.score + points * newCombo,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
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

  setCameraReady: (ready) => set({ isCameraReady: ready }),

  resetGame: () =>
    set({
      gameState: 'playing',
      score: 0,
      combo: 0,
      health: 100,
      level: 1,
    }),
}))

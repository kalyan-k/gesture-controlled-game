import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LIVES_PER_LEVEL } from '../game/blockBreaker/blockBreakerTypes'

export type BlockBreakerStage = 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER'

interface BlockBreakerStore {
  stage: BlockBreakerStage
  score: number
  highScore: number
  lives: number
  level: number
  handMissingPause: boolean
  isPaused: boolean

  setStage: (stage: BlockBreakerStage) => void
  addScore: (pts: number) => void
  loseLife: () => void
  addLife: () => void
  nextLevel: () => void
  setHandMissingPause: (v: boolean) => void
  setPaused: (paused: boolean) => void
  startGame: () => void
  restart: () => void
}

export const useBlockBreakerStore = create<BlockBreakerStore>()(
  persist(
    (set) => ({
      stage: 'COUNTDOWN',
      score: 0,
      highScore: 0,
      lives: LIVES_PER_LEVEL,
      level: 1,
      handMissingPause: false,
      isPaused: false,

      setStage: (stage) => set({ stage }),

      addScore: (pts) =>
        set((s) => {
          const score = s.score + pts
          return { score, highScore: Math.max(s.highScore, score) }
        }),

      loseLife: () =>
        set((s) => {
          const lives = s.lives - 1
          if (lives <= 0) {
            return {
              lives: 0,
              stage: 'GAME_OVER' as BlockBreakerStage,
              highScore: Math.max(s.highScore, s.score),
            }
          }
          return { lives }
        }),

      addLife: () =>
        set((s) => ({ lives: Math.min(LIVES_PER_LEVEL + 2, s.lives + 1) })),

      nextLevel: () =>
        set((s) => ({
          level: s.level + 1,
          lives: LIVES_PER_LEVEL,
        })),

      setHandMissingPause: (v) => set({ handMissingPause: v, isPaused: v }),

      setPaused: (paused) => set({ isPaused: paused }),

      startGame: () =>
        set({
          stage: 'COUNTDOWN',
          score: 0,
          lives: LIVES_PER_LEVEL,
          level: 1,
          handMissingPause: false,
          isPaused: false,
        }),

      restart: () =>
        set((s) => ({
          stage: 'COUNTDOWN',
          score: 0,
          lives: LIVES_PER_LEVEL,
          level: 1,
          handMissingPause: false,
          isPaused: false,
          highScore: Math.max(s.highScore, s.score),
        })),
    }),
    {
      name: 'block-breaker-store',
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
)

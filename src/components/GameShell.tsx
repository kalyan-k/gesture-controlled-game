import { useGameStore } from '../store/gameStore'
import { useBlockBreakerStore } from '../store/blockBreakerStore'
import { useHandTracking } from '../hooks/useHandTracking'
import { SpellcasterDashboard } from './SpellcasterDashboard'
import { BlockBreakerDashboard } from './blockBreaker/BlockBreakerDashboard'
import { audio } from '../hooks/useAudio'
import { Wand2, Blocks } from 'lucide-react'

export function GameShell() {
  const selectedGame = useGameStore((s) => s.selectedGame)
  const setSelectedGame = useGameStore((s) => s.setSelectedGame)
  const tracking = useHandTracking()

  const switchGame = (game: 'spellcaster' | 'block_breaker') => {
    if (game === selectedGame) return
    audio.playClick()
    setSelectedGame(game)
    if (game === 'block_breaker') {
      useBlockBreakerStore.getState().startGame()
    } else {
      useGameStore.getState().resetAll()
    }
  }

  return (
    <div className="w-full h-full relative">
      {/* In-game switcher — camera stays mounted */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex gap-1 p-1 rounded-xl glass border-themed"
        style={{ background: 'var(--color-bg-panel)' }}
      >
        <button
          type="button"
          onClick={() => switchGame('spellcaster')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide cursor-pointer transition-colors"
          style={{
            background: selectedGame === 'spellcaster' ? 'var(--color-primary)' : 'transparent',
            color: selectedGame === 'spellcaster' ? 'var(--color-bg)' : 'var(--color-text-muted)',
          }}
        >
          <Wand2 className="w-3 h-3" />
          Spellcaster
        </button>
        <button
          type="button"
          onClick={() => switchGame('block_breaker')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide cursor-pointer transition-colors"
          style={{
            background: selectedGame === 'block_breaker' ? 'var(--color-primary)' : 'transparent',
            color: selectedGame === 'block_breaker' ? 'var(--color-bg)' : 'var(--color-text-muted)',
          }}
        >
          <Blocks className="w-3 h-3" />
          Block Breaker
        </button>
      </div>

      {selectedGame === 'spellcaster' ? (
        <SpellcasterDashboard tracking={tracking} />
      ) : (
        <BlockBreakerDashboard tracking={tracking} />
      )}
    </div>
  )
}

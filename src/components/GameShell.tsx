import { useGameStore } from '../store/gameStore'
import { useHandTracking } from '../hooks/useHandTracking'
import { SpellcasterDashboard } from './SpellcasterDashboard'
import { BlockBreakerDashboard } from './blockBreaker/BlockBreakerDashboard'

export function GameShell() {
  const selectedGame = useGameStore((s) => s.selectedGame)
  const tracking = useHandTracking()

  return (
    <div className="w-full h-full relative">
      {selectedGame === 'spellcaster' ? (
        <SpellcasterDashboard tracking={tracking} />
      ) : (
        <BlockBreakerDashboard tracking={tracking} />
      )}
    </div>
  )
}

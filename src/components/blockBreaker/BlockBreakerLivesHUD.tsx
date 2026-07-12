import { useBlockBreakerStore } from '../../store/blockBreakerStore'
import { useGameStore } from '../../store/gameStore'
import { LIVES_PER_LEVEL } from '../../game/blockBreaker/blockBreakerTypes'

export function BlockBreakerLivesHUD() {
  const lives = useBlockBreakerStore((s) => s.lives)
  const stage = useBlockBreakerStore((s) => s.stage)
  const isDark = useGameStore((s) => s.settings.theme === 'dark')

  if (stage === 'GAME_OVER') return null

  const lostFromLeft = LIVES_PER_LEVEL - lives
  const fillColor = isDark ? '#0891b2' : '#1d4ed8'
  const emptyStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full glass border-themed"
      style={{ background: 'var(--color-bg-panel)' }}
      title={`${lives} of ${LIVES_PER_LEVEL} lives remaining`}
    >
      {Array.from({ length: LIVES_PER_LEVEL }).map((_, i) => {
        const isLost = i < lostFromLeft
        return (
          <div
            key={i}
            className="relative flex items-center justify-center"
            style={{ width: 18, height: 18 }}
          >
            {isLost ? (
              <div
                className="rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  border: `2px dashed ${emptyStroke}`,
                  background: 'transparent',
                }}
              />
            ) : (
              <div
                className="rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  background: fillColor,
                  border: `2px solid ${isDark ? '#0e7490' : '#1e3a8a'}`,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

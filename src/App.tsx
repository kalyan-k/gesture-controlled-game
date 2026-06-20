import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/LandingScreen'
import { CalibrationScreen } from './components/CalibrationScreen'
import { GameplayScreen } from './components/GameplayScreen'

function App() {
  const gameState = useGameStore((state) => state.gameState)

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-dark text-white">
      {gameState === 'landing' && <LandingScreen />}
      {gameState === 'calibration' && <CalibrationScreen />}
      {(gameState === 'playing' || gameState === 'paused') && <GameplayScreen />}
      {gameState === 'gameover' && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-bg-dark z-50">
          <h1 className="text-6xl font-black text-danger mb-4">GAME OVER</h1>
          <button 
            className="px-8 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            onClick={() => useGameStore.getState().resetGame()}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default App

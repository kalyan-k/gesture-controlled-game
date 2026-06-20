import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/LandingScreen'
import { CalibrationScreen } from './components/CalibrationScreen'
import { GameplayScreen } from './components/GameplayScreen'

function App() {
  const { gameState, score, maxCombo, resetGame } = useGameStore()

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-dark text-white">
      {gameState === 'landing' && <LandingScreen />}
      {gameState === 'calibration' && <CalibrationScreen />}
      {(gameState === 'playing' || gameState === 'paused') && <GameplayScreen />}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark/90 backdrop-blur-sm z-50">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-danger to-orange-500 mb-8 filter drop-shadow-[0_0_20px_rgba(255,77,109,0.8)]">
            SYSTEM FAILURE
          </h1>
          
          <div className="glass p-8 rounded-3xl flex flex-col items-center gap-6 mb-12 w-full max-w-md">
            <div className="flex flex-col items-center">
              <span className="text-gray-400 font-bold tracking-widest text-sm">FINAL SCORE</span>
              <span className="text-6xl font-mono font-bold text-white">{score}</span>
            </div>
            
            <div className="w-full h-px bg-white/10" />
            
            <div className="flex flex-col items-center">
              <span className="text-gray-400 font-bold tracking-widest text-sm">MAX COMBO</span>
              <span className="text-4xl font-mono font-bold text-secondary">{maxCombo}x</span>
            </div>
          </div>

          <button 
            className="px-12 py-5 bg-primary text-bg-dark rounded-2xl hover:bg-white hover:shadow-[0_0_30px_rgba(0,229,255,0.8)] transition-all font-bold text-2xl tracking-wider uppercase"
            onClick={() => resetGame()}
          >
            Restart Sequence
          </button>
        </div>
      )}
    </div>
  )
}

export default App

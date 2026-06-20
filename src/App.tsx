import { useGameStore } from './store/gameStore'
import { LandingScreen } from './components/LandingScreen'
import { DashboardScreen } from './components/DashboardScreen'

function App() {
  const { gameState, score, maxCombo, resetGame, targetsDestroyed } = useGameStore()

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg-dark text-white font-sans">
      {gameState === 'landing' && <LandingScreen />}
      
      {(gameState === 'dashboard' || gameState === 'playing' || gameState === 'paused') && (
        <DashboardScreen />
      )}
      
      {gameState === 'gameover' && (
        <>
          <DashboardScreen />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark/90 backdrop-blur-md z-50">
            <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-danger to-red-900 mb-2 filter drop-shadow-[0_0_30px_rgba(255,77,109,0.8)] leading-none">
              SYSTEM FAILURE
            </h1>
            
            <div className="glass p-10 rounded-[40px] flex flex-col items-center gap-8 mb-12 w-full max-w-xl border border-danger/30 shadow-[0_0_50px_rgba(255,77,109,0.2)]">
              <div className="flex w-full justify-between items-center px-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 font-bold tracking-widest text-sm mb-1">SCORE</span>
                  <span className="text-6xl font-mono font-bold text-white leading-none">{score}</span>
                </div>
                
                <div className="w-px h-16 bg-white/10" />
                
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 font-bold tracking-widest text-sm mb-1">COMBO</span>
                  <span className="text-5xl font-mono font-bold text-secondary leading-none">{maxCombo}x</span>
                </div>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div className="flex justify-center w-full">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 font-bold tracking-widest text-sm mb-1">TARGETS DESTROYED</span>
                  <span className="text-4xl font-mono font-bold text-primary leading-none">{targetsDestroyed}</span>
                </div>
              </div>
            </div>

            <button 
              className="px-16 py-6 bg-primary text-bg-dark rounded-full hover:bg-white hover:scale-105 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)] transition-all font-black text-2xl tracking-[0.2em] uppercase"
              onClick={() => resetGame()}
            >
              Restart Sequence
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default App

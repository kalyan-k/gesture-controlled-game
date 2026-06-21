import { Canvas } from '@react-three/fiber'
import { useGameStore } from '../store/gameStore'
import { Activity, Target } from 'lucide-react'
import { GameScene } from '../game/GameScene'

export function GameplayScreen({ landmarks, gestureResult }: any) {
  const { score, level, health, energy, gameState, settings } = useGameStore()

  return (
    <div className="relative w-full h-full overflow-hidden rounded-l-3xl">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas key={settings.theme} camera={{ position: [0, 0, 10], fov: 60 }}>
          <GameScene landmarks={landmarks} gestureResult={gestureResult} />
        </Canvas>
      </div>

      {/* HUD Layer - Minimalistic for Right Panel */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
          
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {/* Top Left: Score */}
            <div className="flex flex-col drop-shadow-md">
              <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Score</span>
              <span className="text-4xl font-mono font-black text-white leading-none">{score}</span>
            </div>

            {/* Top Center: Level */}
            <div className="glass px-6 py-2 rounded-full border border-primary/30 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-white font-bold tracking-widest">LEVEL {level}</span>
            </div>

            {/* Top Right: Health (Minimal) */}
            <div className="flex flex-col items-end drop-shadow-md">
              <span className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Integrity</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden flex justify-end">
                  <div 
                    className="h-full bg-gradient-to-l from-danger to-orange-500 transition-all duration-300"
                    style={{ width: `${health}%` }}
                  />
                </div>
                <Activity className={`w-5 h-5 ${health < 30 ? 'text-danger animate-pulse' : 'text-gray-300'}`} />
              </div>
            </div>
          </div>

          {/* Bottom Center: Energy Meter */}
          <div className="flex flex-col items-center drop-shadow-md mb-8">
            <span className="text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-2">Pinch Energy</span>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div 
                className="absolute left-1/2 -translate-x-1/2 h-full bg-orange-500 transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

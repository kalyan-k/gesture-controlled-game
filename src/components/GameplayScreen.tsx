import { useGameStore } from '../store/gameStore'
import { Activity, Shield, Zap } from 'lucide-react'

export function GameplayScreen() {
  const { score, combo, health } = useGameStore()

  return (
    <div className="relative w-full h-full bg-bg-dark overflow-hidden">
      {/* 3D Canvas will go here */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-gray-700 font-mono text-2xl opacity-50">3D ARENA (Canvas)</span>
      </div>

      {/* HUD Layer */}
      <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          {/* Score & Combo */}
          <div className="flex flex-col gap-2">
            <div className="glass px-6 py-3 rounded-2xl flex flex-col">
              <span className="text-gray-400 text-xs font-bold tracking-wider">SCORE</span>
              <span className="text-3xl font-mono font-bold text-white">{score.toString().padStart(6, '0')}</span>
            </div>
            
            {combo > 1 && (
              <div className="px-6 py-2 bg-secondary/20 border border-secondary/50 rounded-xl animate-pulse">
                <span className="text-secondary font-bold text-lg">{combo}x COMBO!</span>
              </div>
            )}
          </div>

          {/* Right side stats */}
          <div className="flex gap-4">
            {/* Health */}
            <div className="glass px-4 py-3 rounded-2xl flex items-center gap-3">
              <Activity className="text-danger w-6 h-6" />
              <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-danger to-orange-500 transition-all duration-300"
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Action Indicators */}
        <div className="flex justify-center gap-8">
          <ActionIndicator icon={<Zap className="w-6 h-6" />} label="SWIPE" active={false} color="primary" />
          <ActionIndicator icon={<Shield className="w-6 h-6" />} label="SHIELD" active={false} color="secondary" />
          <ActionIndicator icon={<Activity className="w-6 h-6" />} label="SMASH" active={false} color="danger" />
        </div>
      </div>
    </div>
  )
}

function ActionIndicator({ icon, label, active, color }: { icon: React.ReactNode, label: string, active: boolean, color: 'primary' | 'secondary' | 'danger' }) {
  const colorMap = {
    primary: 'text-primary border-primary/50',
    secondary: 'text-secondary border-secondary/50',
    danger: 'text-danger border-danger/50'
  }
  
  return (
    <div className={`flex flex-col items-center gap-2 transition-all ${active ? 'scale-110' : 'opacity-50'}`}>
      <div className={`w-14 h-14 rounded-full border-2 ${colorMap[color]} flex items-center justify-center glass ${active ? 'bg-white/20' : ''}`}>
        {icon}
      </div>
      <span className="text-xs font-bold tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

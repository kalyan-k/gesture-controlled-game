import { useGameStore } from '../store/gameStore'
import { Camera, Zap, Shield, Target, Award, Play, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

export function LeftPanel({ videoRef, canvasRef, confidence, isReady }: any) {
  const { score, maxCombo, accuracy, level, targetsDestroyed, energy, health, fps, setGameState } = useGameStore()

  return (
    <div className="flex flex-col gap-4 h-full max-h-screen overflow-y-auto p-4 z-20">
      
      {/* SECTION A: WEBCAM */}
      <div className="glass rounded-3xl p-4 flex flex-col gap-2 relative overflow-hidden group border border-white/10">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-gray-300 tracking-wider">HAND TRACKING</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-400">{fps} FPS</span>
            <div className={`px-2 py-0.5 rounded-full ${confidence > 0.85 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {confidence > 0.85 ? '🟢 Stable' : '🔴 Searching'}
            </div>
          </div>
        </div>

        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/5">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/80 z-10">
              <span className="text-primary animate-pulse text-sm font-mono">Initializing Camera...</span>
            </div>
          )}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          />
          {/* Tracking Confidence Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.round(confidence * 100)}%` }} />
          </div>
        </div>
        
        {/* Play Button Overlay (only if not playing) */}
        {useGameStore.getState().gameState === 'dashboard' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setGameState('playing')}
            className="mt-2 w-full py-3 bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            START GAME
          </motion.button>
        )}
      </div>

      {/* SECTION B: CONTROLS */}
      <div className="glass rounded-3xl p-4 flex flex-col gap-3 border border-white/10">
        <h2 className="text-sm font-bold text-gray-300 tracking-wider px-2">CONTROLS</h2>
        <div className="grid grid-cols-2 gap-2">
          <ControlItem icon={<Zap className="w-4 h-4" />} color="text-primary" name="Swipe" desc="Slice Targets" />
          <ControlItem icon={<Shield className="w-4 h-4" />} color="text-secondary" name="Open Palm" desc="Activate Shield" />
          <ControlItem icon={<Activity className="w-4 h-4" />} color="text-danger" name="Fist" desc="Shockwave" />
          <ControlItem icon={<Target className="w-4 h-4" />} color="text-orange-400" name="Pinch" desc="Charge Blast" />
        </div>
      </div>

      {/* SECTION C: STATS */}
      <div className="glass rounded-3xl p-4 flex flex-col gap-4 border border-white/10 flex-grow">
        <h2 className="text-sm font-bold text-gray-300 tracking-wider px-2">BATTLE STATS</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="SCORE" value={score} icon={<Award className="w-4 h-4" />} />
          <StatBox label="LEVEL" value={level} valueColor="text-primary" />
          <StatBox label="MAX COMBO" value={`${maxCombo}x`} valueColor="text-secondary" />
          <StatBox label="ACCURACY" value={`${accuracy}%`} />
          <StatBox label="KILLS" value={targetsDestroyed} />
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 px-1">
              <span>HEALTH</span>
              <span className="text-danger">{health}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-danger transition-all duration-300" style={{ width: `${health}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 px-1">
              <span>ENERGY</span>
              <span className="text-orange-500">{Math.round(energy)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${energy}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlItem({ icon, name, desc, color }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5 hover:bg-white/10 transition-colors">
      <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white leading-tight">{name}</span>
        <span className="text-xs text-gray-400">{desc}</span>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, valueColor = "text-white" }: any) {
  return (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
      <span className="text-[10px] font-bold tracking-widest text-gray-500 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className={`text-xl font-mono font-bold ${valueColor}`}>{value}</span>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Camera, CheckCircle2 } from 'lucide-react'

export function CalibrationScreen() {
  const { setGameState, isCameraReady } = useGameStore()

  // In the future, this screen will request camera permissions and initialize MediaPipe

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-bg-dark relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl flex flex-col items-center max-w-lg w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">System Calibration</h2>
        
        <p className="text-gray-400 mb-8">
          Please allow camera access. Position yourself so your hand is clearly visible in the frame.
        </p>

        <div className="w-full aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden">
          {/* Placeholder for video feed */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5" />
          <span className="text-gray-600 font-mono text-sm">Initializing Camera...</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGameState('playing')}
          className="w-full py-4 bg-primary text-bg-dark font-bold text-lg rounded-xl flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Confirm Tracking
        </motion.button>
      </motion.div>
    </div>
  )
}

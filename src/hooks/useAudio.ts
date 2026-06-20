class AudioEngine {
  private ctx: AudioContext | null = null

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playSwipe() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2)
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2)
    
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    
    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }

  playSmash() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'square'
    osc.frequency.setValueAtTime(100, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5)
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5)
    
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    
    osc.start()
    osc.stop(this.ctx.currentTime + 0.5)
  }

  playShield() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(300, this.ctx.currentTime)
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1)
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5)
    
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    
    osc.start()
    osc.stop(this.ctx.currentTime + 0.5)
  }

  playHit() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)
    
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    
    osc.start()
    osc.stop(this.ctx.currentTime + 0.1)
  }

  playMiss() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3)
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)
    
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    
    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)
  }
}

export const audio = new AudioEngine()

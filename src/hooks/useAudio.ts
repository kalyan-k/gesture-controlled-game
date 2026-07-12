/**
 * Web Audio API — one-shot SFX only; no continuous oscillator drone.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private unlocked = false
  private sfxVolume = 0.8
  private musicVolume = 0.4
  private lastPlayed: Record<string, number> = {}
  private ambientInterval: ReturnType<typeof setInterval> | null = null

  setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx / 100
    this.musicVolume = music / 100
  }

  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    this.unlocked = true
  }

  private ensureCtx(): AudioContext | null {
    if (!this.unlocked) return null
    if (!this.ctx) this.unlock()
    return this.ctx
  }

  /** Play a sound at most once per cooldown window (prevents per-frame loops) */
  private playOnce(key: string, fn: () => void, cooldownMs = 200) {
    const now = performance.now()
    if (now - (this.lastPlayed[key] ?? 0) < cooldownMs) return
    this.lastPlayed[key] = now
    fn()
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    freqEnd?: number
  ) {
    const ctx = this.ensureCtx()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), ctx.currentTime + duration)
    }
    gain.gain.setValueAtTime(volume * this.sfxVolume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration + 0.05)
  }

  playClick() {
    this.playOnce('click', () => this.tone(1200, 0.06, 'sine', 0.15), 80)
  }

  playTrainingDing() {
    this.playOnce('training', () => {
      this.tone(880, 0.15, 'sine', 0.35)
      setTimeout(() => this.tone(1320, 0.2, 'sine', 0.3), 80)
    }, 300)
  }

  playCastFire() {
    this.playOnce('cast_fire', () => this.tone(120, 0.35, 'sawtooth', 0.35, 40), 300)
  }

  playCastShield() {
    this.playOnce('cast_shield', () => this.tone(300, 0.45, 'triangle', 0.2), 300)
  }

  playCastLightning() {
    this.playOnce('cast_lightning', () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.tone(900 + i * 200, 0.06, 'square', 0.15), i * 40)
      }
    }, 300)
  }

  playCastEarth() {
    this.playOnce('cast_earth', () => this.tone(80, 0.45, 'square', 0.3, 30), 300)
  }

  playCastWater() {
    this.playOnce('cast_water', () => this.tone(400, 0.35, 'sine', 0.2, 200), 300)
  }

  playCast(spell: string) {
    switch (spell) {
      case 'fist':      this.playCastFire(); break
      case 'open_palm': this.playCastShield(); break
      case 'l_shape':   this.playCastLightning(); break
      case 'rock_on':   this.playCastEarth(); break
      case 'ok_sign':   this.playCastWater(); break
    }
  }

  playExplosion() {
    this.playOnce('explosion', () => {
      const ctx = this.ensureCtx()
      if (!ctx) return
      const bufferSize = ctx.sampleRate * 0.25
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      source.buffer = buffer
      gain.gain.setValueAtTime(0.35 * this.sfxVolume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    }, 150)
  }

  /** Distinct knockout sting per element — richer for elite (500pt) foes */
  playKnockout(element: string, elite: boolean) {
    const vol = elite ? 0.32 : 0.24
    const gap = elite ? 90 : 65

    const arpeggio = (notes: number[], type: OscillatorType = 'sine') => {
      notes.forEach((f, i) => {
        setTimeout(() => this.tone(f, elite ? 0.2 : 0.14, type, vol), i * gap)
      })
    }

    this.playOnce(`knockout_${element}`, () => {
      switch (element) {
        case 'wood':
          arpeggio([392, 494, 587, elite ? 784 : 659])
          break
        case 'ice':
          arpeggio([659, 784, 988, elite ? 1175 : 1047], 'triangle')
          break
        case 'air':
          arpeggio([523, 659, 784, elite ? 988 : 880], 'sine')
          break
        case 'fire':
          arpeggio([196, 262, 330, 392, elite ? 523 : 440], 'sawtooth')
          break
        case 'earth':
          arpeggio([82, 110, 147, elite ? 196 : 165], 'square')
          break
        default:
          this.playExplosion()
      }
    }, 80)
  }

  playBarrierThud() {
    this.playOnce('barrier', () => this.tone(60, 0.35, 'square', 0.4, 30), 400)
  }

  playMiss() {
    this.playOnce('miss', () => this.tone(200, 0.2, 'sawtooth', 0.15, 80), 350)
  }

  playSpellWeaver() {
    this.playOnce('weaver', () => {
      ;[523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => this.tone(f, 0.18, 'sine', 0.25), i * 100)
      })
    }, 2000)
  }

  /** Soft periodic chime — NOT continuous oscillators */
  startAmbient() {
    if (this.ambientInterval) return
    this.ambientInterval = setInterval(() => {
      if (this.musicVolume <= 0) return
      this.tone(196, 0.8, 'sine', 0.04 * this.musicVolume)
    }, 8000)
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval)
      this.ambientInterval = null
    }
  }
}

export const audio = new AudioEngine()

export function useAudio() {
  return audio
}

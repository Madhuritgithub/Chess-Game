"use client"

class SoundManager {
  private ctx: AudioContext | null = null

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  playMove() {
    this.initCtx()
    if (!this.ctx) return
    
    // Resume context if suspended (browser security autoplay policies)
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.type = "sine"
    osc.frequency.setValueAtTime(320, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.08)
  }

  playCapture() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.type = "triangle"
    osc.frequency.setValueAtTime(450, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.12)
  }

  playCheck() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const playBeep = (time: number, freq: number) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, time)
      
      gain.gain.setValueAtTime(0.15, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

      osc.start(time)
      osc.stop(time + 0.15)
    }

    playBeep(now, 600)
    playBeep(now + 0.12, 600)
  }

  playCheckmate() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const playNote = (time: number, freq: number, duration: number) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, time)
      
      gain.gain.setValueAtTime(0.2, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      osc.start(time)
      osc.stop(time + duration)
    }

    // Play minor chord progression
    playNote(now, 440, 0.4)       // A4
    playNote(now + 0.12, 349.23, 0.5) // F4
    playNote(now + 0.24, 277.18, 0.8) // C#4
  }

  playCastle() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const playSlide = (time: number) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = "sine"
      osc.frequency.setValueAtTime(280, time)
      osc.frequency.exponentialRampToValueAtTime(140, time + 0.06)

      gain.gain.setValueAtTime(0.15, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)

      osc.start(time)
      osc.stop(time + 0.06)
    }

    playSlide(now)
    playSlide(now + 0.08)
  }

  playPromotion() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)

      gain.gain.setValueAtTime(0.1, now + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2)

      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.2)
    })
  }

  playDraw() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    const playNote = (freq: number, duration: number) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.start(now)
      osc.stop(now + duration)
    }

    // Play E4 & G4 interval
    playNote(329.63, 0.4)
    playNote(392.00, 0.4)
  }

  playTimeout() {
    this.initCtx()
    if (!this.ctx) return

    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(180, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.5)

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.5)
  }
}

export const audio = new SoundManager()

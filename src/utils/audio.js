// Web Audio API Synthesizer Engine for FamSync (No external audio file required)

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientNodes = [];
    this.ambientGain = null;
    this.isAmbientPlaying = false;
    this.ambientInterval = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    // Initialize audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  playSFX(type) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (browser autoplay security policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    switch (type) {
      case "click": {
        // Soft wooden tick sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case "success": {
        // Ascending high-quality chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          
          osc.start(t);
          osc.stop(t + 0.25);
        });
        break;
      }
      case "delete": {
        // Descending warning chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.18);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
    }
  }

  // Synthesize relaxing ambient chord pad in real-time
  startAmbient() {
    this.init();
    if (!this.ctx) return;
    if (this.isAmbientPlaying) return;
    
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isAmbientPlaying = true;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2.0); // Slow fade-in
    
    // Low-pass filter to keep sound warm and relaxing
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    
    this.ambientGain.connect(filter);
    filter.connect(this.ctx.destination);

    // Chords (Cmaj7, Fmaj7, Am7, Gsus4)
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3 (Cmaj7)
      [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4 (Fmaj7)
      [220.00, 261.63, 329.63, 392.00], // A3, C4, E4, G4 (Am7)
      [196.00, 246.94, 293.66, 392.00]  // G3, B3, D4, G4 (Gsus4)
    ];

    let chordIdx = 0;
    
    const playNextChord = () => {
      if (!this.isAmbientPlaying) return;
      const now = this.ctx.currentTime;
      const freqs = chords[chordIdx];
      
      // Stop previous notes if any (rare since we match duration)
      this.ambientNodes.forEach(node => {
        try { node.stop(now); } catch(e) {}
      });
      this.ambientNodes = [];

      // Create new pad notes
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const nodeGain = this.ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        
        // Dynamic frequency vibrato (LFO simulation)
        osc.frequency.linearRampToValueAtTime(freq + 1, now + 3);
        osc.frequency.linearRampToValueAtTime(freq - 1, now + 6);
        
        // Slow attack and release envelope
        nodeGain.gain.setValueAtTime(0, now);
        nodeGain.gain.linearRampToValueAtTime(0.2, now + 1.5); // Attack
        nodeGain.gain.setValueAtTime(0.2, now + 4.5);
        nodeGain.gain.exponentialRampToValueAtTime(0.001, now + 6.8); // Release
        
        osc.connect(nodeGain);
        nodeGain.connect(this.ambientGain);
        
        osc.start(now);
        osc.stop(now + 7);
        this.ambientNodes.push(osc);
      });

      chordIdx = (chordIdx + 1) % chords.length;
    };

    // Trigger first chord immediately
    playNextChord();
    
    // Repeat progression every 6.8 seconds
    this.ambientInterval = setInterval(playNextChord, 6800);
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 1.5); // Slow fade-out
      
      setTimeout(() => {
        this.ambientNodes.forEach(node => {
          try { node.stop(); } catch(e) {}
        });
        this.ambientNodes = [];
      }, 1500);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const audioEngine = new AudioEngine();

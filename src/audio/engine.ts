import type { StateInterpretation } from "../types";

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private harmonicGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;

  async start(params: StateInterpretation["audioParams"]) {
    if (this.isPlaying) {
      await this.stop();
    }

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    this.createNoiseLayer(params);
    this.createDroneLayer(params);
    this.createHarmonicLayer(params);
    this.createModulation(params);

    this.isPlaying = true;

    // Fade in over 3 seconds
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 3);
  }

  private createNoiseLayer(params: StateInterpretation["audioParams"]) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);

      if (params.noiseType === "brown") {
        // Brown noise: integrated white noise
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        }
      } else if (params.noiseType === "pink") {
        // Pink noise: 1/f spectrum approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      } else {
        // White noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = "lowpass";
    this.noiseFilter.frequency.value = params.filterCutoff;
    this.noiseFilter.Q.value = 0.5;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = params.noiseVolume * 0.4;

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseNode.start();
  }

  private createDroneLayer(params: StateInterpretation["audioParams"]) {
    if (!this.ctx || !this.masterGain) return;

    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = "sine";
    this.droneOsc.frequency.value = params.baseFrequency;

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = params.baseFrequency * 3;
    this.droneFilter.Q.value = 1;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = params.droneVolume * 0.3;

    this.droneOsc.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();
  }

  private createHarmonicLayer(params: StateInterpretation["audioParams"]) {
    if (!this.ctx || !this.masterGain) return;

    // A fifth above the base, softened
    this.harmonicOsc = this.ctx.createOscillator();
    this.harmonicOsc.type = "sine";
    this.harmonicOsc.frequency.value = params.baseFrequency * 1.5;

    this.harmonicGain = this.ctx.createGain();
    this.harmonicGain.gain.value = params.harmonicContent * 0.12;

    this.harmonicOsc.connect(this.harmonicGain);
    this.harmonicGain.connect(this.masterGain);
    this.harmonicOsc.start();
  }

  private createModulation(params: StateInterpretation["audioParams"]) {
    if (!this.ctx || !this.noiseFilter) return;

    // LFO modulates the noise filter cutoff for movement
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = params.modulationSpeed;

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = params.filterCutoff * 0.3;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.noiseFilter.frequency);
    this.lfo.start();
  }

  async stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Fade out over 2 seconds
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 2);

    await new Promise((resolve) => setTimeout(resolve, 2100));

    this.noiseNode?.stop();
    this.droneOsc?.stop();
    this.harmonicOsc?.stop();
    this.lfo?.stop();
    await this.ctx.close();

    this.noiseNode = null;
    this.droneOsc = null;
    this.harmonicOsc = null;
    this.lfo = null;
    this.ctx = null;
    this.isPlaying = false;
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

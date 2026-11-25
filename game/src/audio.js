// All sound is synthesized with WebAudio: short oscillator blips and filtered
// noise, no audio files. The context is created on the first user gesture, so
// the page never tries to play before the player has interacted with it.

export function createAudio() {
  let context = null;
  let master = null;

  function ensure() {
    if (context !== null) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.22;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(frequency, duration, type, volume, slideTo) {
    if (!ensure() || context.state === 'suspended') return;
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function noise(duration, volume, cutoff) {
    if (!ensure() || context.state === 'suspended') return;
    const start = context.currentTime;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume();
    },
    pickup() { tone(520, 0.09, 'sine', 0.5, 760); },
    place() { tone(340, 0.08, 'triangle', 0.5, 300); },
    chop() { noise(0.09, 0.7, 2400); tone(180, 0.07, 'square', 0.25, 120); },
    sizzle() { noise(0.5, 0.35, 5200); },
    done() { tone(660, 0.1, 'sine', 0.5); setTimeout(() => tone(880, 0.14, 'sine', 0.5), 90); },
    serve() { tone(523, 0.1, 'triangle', 0.55); setTimeout(() => tone(659, 0.1, 'triangle', 0.55), 90); setTimeout(() => tone(784, 0.18, 'triangle', 0.55), 180); },
    wrong() { tone(220, 0.22, 'sawtooth', 0.3, 140); },
    expire() { tone(330, 0.3, 'square', 0.3, 180); },
    tick() { tone(980, 0.05, 'sine', 0.3); },
    start() { tone(392, 0.12, 'triangle', 0.5); setTimeout(() => tone(523, 0.12, 'triangle', 0.5), 110); setTimeout(() => tone(659, 0.2, 'triangle', 0.5), 220); },
  };
}

// Every sound is synthesized with WebAudio: no audio files, no network.
// The context is created lazily on the first player gesture (browsers block
// audio before one), and every call is guarded so a headless run stays silent.

let context = null;
let master = null;

function audioContext() {
  if (context) return context;
  try {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.16;
    master.connect(context.destination);
  } catch {
    context = null;
  }
  return context;
}

/** Call from any real input event so the browser unlocks sound. */
export function unlockAudio() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/** One oscillator note: frequency, seconds, wave, and an optional slide to. */
function tone(freq, seconds, type = 'sine', slideTo = null, delay = 0) {
  const ctx = audioContext();
  if (!ctx || !master) return;
  try {
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  } catch {
    // A sound failing must never break the game.
  }
}

/** A short burst of filtered noise: the chop thock and the wok sizzle. */
function noiseBurst(seconds, filterFreq, delay = 0) {
  const ctx = audioContext();
  if (!ctx || !master) return;
  try {
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  } catch {
    // A sound failing must never break the game.
  }
}

export const SOUNDS = {
  /** A knife hitting the board. */
  chop() {
    noiseBurst(0.09, 900);
    tone(180, 0.07, 'square', 90);
  },
  /** Something hitting hot oil. */
  sizzle() {
    noiseBurst(0.35, 3200);
  },
  /** An ingredient picked up. */
  pickup() {
    tone(520, 0.07, 'triangle', 700);
  },
  /** An ingredient lands on the plate. */
  plop() {
    tone(300, 0.09, 'sine', 170);
  },
  /** A station finished: the food is ready to collect. */
  ready() {
    tone(880, 0.12, 'sine');
    tone(1174, 0.16, 'sine', null, 0.1);
  },
  /** A dish served: the till ding. */
  serve() {
    tone(1046, 0.14, 'sine');
    tone(1568, 0.22, 'sine', null, 0.09);
  },
  /** A ticket expired: a low unhappy buzz. */
  wrong() {
    tone(220, 0.25, 'sawtooth', 140);
  },
  /** A ticket is about to run out: one sharp tick. */
  tick() {
    tone(1250, 0.05, 'square');
  },
  /** The shift is won: a rising little jingle. */
  win() {
    [523, 659, 784, 1046, 1318].forEach((freq, index) => tone(freq, 0.22, 'triangle', null, index * 0.11));
  },
  /** The shift is lost: three notes down. */
  lose() {
    [392, 330, 262].forEach((freq, index) => tone(freq, 0.3, 'triangle', null, index * 0.16));
  },
  /** Rush hour starts: a quick two-note call. */
  rush() {
    tone(660, 0.12, 'square');
    tone(990, 0.18, 'square', null, 0.12);
  },
};

/** Play one named sound; unknown names are ignored. */
export function playSound(name) {
  const sound = SOUNDS[name];
  if (sound) sound();
}

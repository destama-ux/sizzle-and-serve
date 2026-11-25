// audio.js — the kitchen's little noises, synthesised with WebAudio so the
// game ships no audio files: a pop for a pickup, a wooden knock for each
// chop, a ding when the wok is golden and a two-note chime at the till.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function unlockAudio() {
  if (muted) return;
  if (!context) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) context = new AudioCtor();
  }
  if (context && context.state === "suspended") context.resume();
}

function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
  if (muted || !context) return;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain).connect(context.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export const sfx = {
  pickup() { tone(520, 760, 0.08, "triangle", 0.12); },
  chop() { tone(210, 90, 0.06, "square", 0.08); },
  load() { tone(300, 180, 0.12, "sawtooth", 0.06); },
  ding() { tone(1180, 1180, 0.22, "sine", 0.14); tone(1770, 1770, 0.3, "sine", 0.07, 0.02); },
  burn() { tone(160, 60, 0.35, "sawtooth", 0.1); },
  plate() { tone(660, 880, 0.1, "triangle", 0.12); },
  serve() { tone(784, 784, 0.1, "sine", 0.13); tone(1047, 1047, 0.16, "sine", 0.13, 0.09); },
  trash() { tone(340, 120, 0.14, "triangle", 0.09); },
  pop() { tone(440, 660, 0.07, "sine", 0.1); },
  sad() { tone(392, 311, 0.25, "sine", 0.1); },
};

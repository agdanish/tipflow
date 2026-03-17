// Sound system using Web Audio API — no external audio files needed

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  startTime = 0,
  volume = 0.15,
): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  // Fade out to avoid click
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + startTime + duration,
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

/** Pleasant ascending two-tone chime for successful tips */
export function playSuccess(): void {
  if (!soundEnabled) return;
  playTone(523.25, 0.2, 'sine', 0, 0.12);     // C5
  playTone(659.25, 0.3, 'sine', 0.15, 0.12);   // E5
}

/** Low descending tone for errors */
export function playError(): void {
  if (!soundEnabled) return;
  playTone(330, 0.2, 'triangle', 0, 0.12);     // E4
  playTone(220, 0.35, 'triangle', 0.15, 0.12); // A3
}

/** Soft single tone for new events/notifications */
export function playNotification(): void {
  if (!soundEnabled) return;
  playTone(440, 0.25, 'sine', 0, 0.08); // A4 soft
}

/** Enable or disable all sounds */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  localStorage.setItem('tipflow-sound', enabled ? '1' : '0');
}

/** Check if sounds are enabled */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/** Initialize from persisted preference */
export function initSound(): void {
  const stored = localStorage.getItem('tipflow-sound');
  if (stored !== null) {
    soundEnabled = stored === '1';
  }
}

// Auto-init on module load
initSound();

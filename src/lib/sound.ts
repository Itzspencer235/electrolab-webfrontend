'use client';
// Short UI sounds — the same files ship with the mobile app (assets/sounds).
// Web Audio keeps latency low; sounds only ever play in response to a click,
// so browser autoplay rules are satisfied.

export type Sfx = 'cart_add' | 'cart_remove' | 'like' | 'success' | 'error' | 'notify';

const ALL: Sfx[] = ['cart_add', 'cart_remove', 'like', 'success', 'error', 'notify'];
const KEY = 'el_sound';
const VOLUME = 0.6;

let ctx: AudioContext | null = null;
const buffers = new Map<Sfx, AudioBuffer>();
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function isSoundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
  listeners.forEach(l => l());
  if (on) playSound('like');
}

/** Re-render hook-free components when the setting changes. */
export function onSoundChange(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined'
    ? (window.AudioContext || (window as any).webkitAudioContext)
    : undefined;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function preload(): Promise<void> {
  const c = getCtx();
  if (!c) return Promise.resolve();
  loading ??= Promise.all(ALL.map(async name => {
    try {
      const res = await fetch(`/sounds/${name}.m4a`);
      buffers.set(name, await c.decodeAudioData(await res.arrayBuffer()));
    } catch {}
  })).then(() => {});
  return loading;
}

export function playSound(name: Sfx) {
  if (typeof window === 'undefined' || !isSoundOn()) return;
  const c = getCtx();
  if (!c) {
    // Very old browsers: plain <audio>
    try { const a = new Audio(`/sounds/${name}.m4a`); a.volume = VOLUME; a.play().catch(() => {}); } catch {}
    return;
  }
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = () => {
    const buf = buffers.get(name);
    if (!buf) return;
    const src  = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = VOLUME;
    src.buffer = buf;
    src.connect(gain).connect(c.destination);
    src.start();
  };
  if (buffers.has(name)) start(); else preload().then(start);
}

// Warm up on the first interaction so the first real sound is instant.
if (typeof window !== 'undefined') {
  const warm = () => { if (isSoundOn()) preload(); };
  window.addEventListener('pointerdown', warm, { once: true, passive: true });
  window.addEventListener('keydown', warm, { once: true });
}

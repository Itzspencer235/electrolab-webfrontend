'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Zap, BookOpen, Bot, ShoppingBag,
  ChevronRight, Package, Cpu, Radio, Thermometer,
  Monitor, Settings, Battery, Wifi, Wrench,
} from 'lucide-react';
import { useLang } from '@/context/LangContext';
import { getProducts, getTutorials, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { levelColor, levelLabel } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/constants';

/* ── Intersection observer hook ─────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ── Animated counter ───────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

/* ── Category icon ───────────────────────────────────────────────────────── */
function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('micro') || n.includes('arduino') || n.includes('esp')) return <Cpu size={20} />;
  if (n.includes('sensor') || n.includes('capteur') || n.includes('temperature')) return <Thermometer size={20} />;
  if (n.includes('gsm') || n.includes('sim') || n.includes('module')) return <Radio size={20} />;
  if (n.includes('display') || n.includes('lcd') || n.includes('écran')) return <Monitor size={20} />;
  if (n.includes('power') || n.includes('battery') || n.includes('alimentation')) return <Battery size={20} />;
  if (n.includes('wifi') || n.includes('bluetooth')) return <Wifi size={20} />;
  if (n.includes('tool') || n.includes('outil')) return <Wrench size={20} />;
  if (n.includes('motor') || n.includes('servo')) return <Settings size={20} />;
  return <Package size={20} />;
}

/* ── Clock icon ─────────────────────────────────────────────────────────── */
function Clock({ size = 12, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATED ELECTRONICS VISUALS — pure canvas, always crisp & on-brand
══════════════════════════════════════════════════════════════════════════ */

/** 1. Live PCB Trace — animated signal flowing through circuit paths */
function PCBTraceCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    let t = 0;

    const paths = [
      [[0.05,0.5],[0.2,0.5],[0.2,0.2],[0.5,0.2],[0.5,0.5],[0.8,0.5],[0.8,0.8],[0.95,0.8]],
      [[0.05,0.2],[0.35,0.2],[0.35,0.65],[0.65,0.65],[0.65,0.35],[0.95,0.35]],
      [[0.1,0.85],[0.4,0.85],[0.4,0.5],[0.6,0.5],[0.6,0.15],[0.9,0.15]],
      [[0.05,0.65],[0.25,0.65],[0.25,0.35],[0.75,0.35],[0.75,0.65],[0.95,0.65]],
    ];

    const chips = [
      { x: 0.38, y: 0.38, w: 0.24, h: 0.24, pins: 6, label: 'ESP32' },
      { x: 0.12, y: 0.12, w: 0.12, h: 0.10, pins: 4, label: 'IC' },
      { x: 0.76, y: 0.62, w: 0.12, h: 0.10, pins: 4, label: 'MCU' },
    ];

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a1f0f';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(0,255,80,0.04)';
      for (let gx = 20; gx < W; gx += 28) {
        for (let gy = 20; gy < H; gy += 28) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      paths.forEach((path) => {
        ctx.beginPath();
        path.forEach(([px, py], i) => {
          const x = px * W, y = py * H;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(0,200,60,0.15)';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      paths.forEach((path, pi) => {
        let totalLen = 0;
        const segs: number[] = [];
        for (let i = 1; i < path.length; i++) {
          const dx = (path[i][0] - path[i-1][0]) * W;
          const dy = (path[i][1] - path[i-1][1]) * H;
          const len = Math.sqrt(dx*dx + dy*dy);
          segs.push(len);
          totalLen += len;
        }

        const speed = 0.0004;
        const offset = pi * 0.27;
        const progress = ((t * speed + offset) % 1);
        const targetDist = progress * totalLen;
        let traveled = 0;
        let pulseX = path[0][0] * W, pulseY = path[0][1] * H;
        for (let i = 0; i < segs.length; i++) {
          if (traveled + segs[i] >= targetDist) {
            const frac = (targetDist - traveled) / segs[i];
            pulseX = (path[i][0] + frac * (path[i+1][0] - path[i][0])) * W;
            pulseY = (path[i][1] + frac * (path[i+1][1] - path[i][1])) * H;
            break;
          }
          traveled += segs[i];
        }

        const grd = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 14);
        grd.addColorStop(0, 'rgba(0,255,100,0.95)');
        grd.addColorStop(0.3, 'rgba(0,255,80,0.5)');
        grd.addColorStop(1, 'rgba(0,255,50,0)');
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 14, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#afffbe';
        ctx.fill();
      });

      chips.forEach(chip => {
        const cx = chip.x * W, cy = chip.y * H;
        const cw = chip.w * W, ch = chip.h * H;
        ctx.fillStyle = '#1a3320';
        ctx.strokeStyle = 'rgba(0,200,60,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx, cy, cw, ch, 4);
        ctx.fill();
        ctx.stroke();
        const pinSpacing = ch / (chip.pins / 2 + 1);
        for (let p = 1; p <= chip.pins / 2; p++) {
          const py2 = cy + p * pinSpacing;
          ctx.beginPath(); ctx.moveTo(cx - 8, py2); ctx.lineTo(cx, py2);
          ctx.strokeStyle = 'rgba(0,200,60,0.5)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + cw, py2); ctx.lineTo(cx + cw + 8, py2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,255,80,0.7)';
        ctx.font = `bold ${Math.max(9, cw * 0.22)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(chip.label, cx + cw / 2, cy + ch / 2);
      });

      const pads = [
        [0.05,0.2],[0.05,0.5],[0.05,0.65],[0.95,0.35],[0.95,0.65],[0.95,0.8],
        [0.35,0.2],[0.65,0.15],[0.4,0.85],[0.1,0.85],
      ];
      pads.forEach(([px, py]) => {
        const x = px * W, y = py * H;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#c8a000'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1a3320'; ctx.fill();
      });

      t++;
      raf = requestAnimationFrame(draw);
    };

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

/** 2. Oscilloscope Waveform Canvas */
function OscilloscopeCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number, t = 0;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050d0a';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(0,200,60,0.08)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= W; gx += W/8) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (let gy = 0; gy <= H; gy += H/4) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

      // Channel 1 — yellow sine wave
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const amp = H * 0.28;
        const y = H/2 - amp * Math.sin((x / W) * Math.PI * 2 * 2.5 + t * 0.06);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#f5c400';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f5c400';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Channel 2 — cyan square wave (PWM)
      ctx.beginPath();
      const period = W / 3;
      for (let x = 0; x <= W; x++) {
        const phase = ((x + t * 1.5) % period) / period;
        const y = phase < 0.6 ? H * 0.25 : H * 0.55;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(8, 8, 160, 56);
      ctx.fillStyle = '#f5c400';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('CH1  2.4V  500Hz', 14, 26);
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('CH2  3.3V  PWM60%', 14, 46);

      ctx.strokeStyle = 'rgba(255,100,100,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,100,100,0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('TRIG', W - 36, H/2 - 4);

      t++;
      raf = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

/** 3. Blinking LED Array Canvas */
function LEDArrayCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number, t = 0;

    const cols = 8, rows = 5;
    const colors = ['#ff2222','#ff8800','#ffee00','#22ff44','#00ccff','#aa44ff'];
    const ledStates = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      }))
    );

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);

      const padX = W * 0.06, padY = H * 0.12;
      const cellW = (W - padX * 2) / cols;
      const cellH = (H - padY * 2) / rows;
      const r = Math.min(cellW, cellH) * 0.34;

      ledStates.forEach((row, ri) => {
        row.forEach((led, ci) => {
          const cx = padX + ci * cellW + cellW / 2;
          const cy = padY + ri * cellH + cellH / 2;
          let b = 0;

          if (ri === 0) {
            const sweep = Math.abs(Math.sin(t * 0.04)) * cols;
            b = Math.max(0, 1 - Math.abs(ci - sweep) * 0.7);
          } else if (ri === 1) {
            const counter = Math.floor(t / 8) % 256;
            b = ((counter >> ci) & 1) ? 1 : 0.05;
          } else if (ri === 2) {
            b = (Math.sin(ci * 0.8 + t * 0.07) + 1) / 2;
          } else if (ri === 3) {
            b = (Math.sin(led.phase + t * 0.05) + 1) / 2;
          } else {
            const chase = Math.floor(t / 4) % cols;
            b = ci === chase ? 1 : ci === (chase - 1 + cols) % cols ? 0.4 : 0.04;
          }

          ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#222'; ctx.fill();

          const alpha = 0.08 + b * 0.92;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = led.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();

          if (b > 0.4) {
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
            grd.addColorStop(0, led.color + Math.round(b * 80).toString(16).padStart(2, '0'));
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = grd; ctx.fill();
          }

          if (b > 0.2) {
            const sp = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, 0, cx, cy, r);
            sp.addColorStop(0, `rgba(255,255,255,${b * 0.5})`);
            sp.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = sp; ctx.fill();
          }
        });
      });

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GPIO OUTPUT MATRIX', W / 2, H - 8);

      t++;
      raf = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

/** 4. Microcontroller Chip Canvas */
function ChipCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number, t = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#08080f';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const chipW = Math.min(W, H) * 0.38;
      const chipH = chipW;

      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#1e2a4a';
      ctx.beginPath();
      ctx.roundRect(cx - chipW/2, cy - chipH/2, chipW, chipH, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - chipW/2, cy - chipH/2, chipW, chipH, 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy - chipH/2, 8, 0, Math.PI);
      ctx.fillStyle = '#08080f'; ctx.fill();
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = `bold ${chipW * 0.16}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ESP32', cx, cy - 10);
      ctx.font = `${chipW * 0.09}px monospace`;
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('240MHz · WiFi · BT', cx, cy + 12);

      const pins = 14;
      const pinSpacing = chipH / (pins / 2 + 1);
      const pinLen = 22;
      const activePins = Array.from({ length: pins }, (_, i) =>
        Math.sin(i * 1.3 + t * 0.04) > 0.3
      );

      for (let p = 0; p < pins / 2; p++) {
        const py2 = cy - chipH/2 + (p + 1) * pinSpacing;
        const active = activePins[p];
        ctx.beginPath(); ctx.moveTo(cx - chipW/2 - pinLen, py2); ctx.lineTo(cx - chipW/2, py2);
        ctx.strokeStyle = active ? '#60a5fa' : 'rgba(59,130,246,0.2)';
        ctx.lineWidth = active ? 2.5 : 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx - chipW/2 - pinLen, py2, 4, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#f5c400' : '#555'; ctx.fill();
        if (active) {
          const grd = ctx.createRadialGradient(cx - chipW/2 - pinLen, py2, 0, cx - chipW/2 - pinLen, py2, 14);
          grd.addColorStop(0, 'rgba(245,196,0,0.4)'); grd.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(cx - chipW/2 - pinLen, py2, 14, 0, Math.PI*2);
          ctx.fillStyle = grd; ctx.fill();
        }
      }

      for (let p = 0; p < pins / 2; p++) {
        const py2 = cy + chipH/2 - (p + 1) * pinSpacing;
        const active = activePins[p + pins / 2];
        ctx.beginPath(); ctx.moveTo(cx + chipW/2, py2); ctx.lineTo(cx + chipW/2 + pinLen, py2);
        ctx.strokeStyle = active ? '#60a5fa' : 'rgba(59,130,246,0.2)';
        ctx.lineWidth = active ? 2.5 : 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + chipW/2 + pinLen, py2, 4, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#f5c400' : '#555'; ctx.fill();
        if (active) {
          const grd = ctx.createRadialGradient(cx + chipW/2 + pinLen, py2, 0, cx + chipW/2 + pinLen, py2, 14);
          grd.addColorStop(0, 'rgba(245,196,0,0.4)'); grd.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(cx + chipW/2 + pinLen, py2, 14, 0, Math.PI*2);
          ctx.fillStyle = grd; ctx.fill();
        }
      }

      const numParticles = 6;
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + t * 0.015;
        const dist = 60 + ((t * 1.2 + i * 40) % 80);
        const px = cx + Math.cos(angle) * dist;
        const py2 = cy + Math.sin(angle) * dist;
        const alpha = 1 - (dist - 60) / 80;
        ctx.beginPath(); ctx.arc(px, py2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${alpha * 0.7})`; ctx.fill();
      }

      const ringR = chipW * 0.72 + Math.sin(t * 0.05) * 8;
      ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(59,130,246,${0.08 + Math.sin(t * 0.05) * 0.05})`;
      ctx.lineWidth = 1; ctx.stroke();

      t++;
      raf = requestAnimationFrame(draw);
    };
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

/* ── Hero Carousel — cycles through 4 animated canvas panels ─────────── */
const PANELS = [
  { Component: PCBTraceCanvas,     label: { fr: 'Circuit PCB live',          en: 'Live PCB circuit',         ar: 'دائرة PCB حية' } },
  { Component: ChipCanvas,         label: { fr: 'Microcontrôleur ESP32',      en: 'ESP32 microcontroller',    ar: 'معالج ESP32' } },
  { Component: OscilloscopeCanvas, label: { fr: 'Oscilloscope temps réel',    en: 'Real-time oscilloscope',   ar: 'راسم الذبذبات' } },
  { Component: LEDArrayCanvas,     label: { fr: 'Matrice LED GPIO',           en: 'GPIO LED matrix',          ar: 'مصفوفة LED' } },
];

function HeroCarousel({ lang }: { lang: 'fr' | 'en' | 'ar' }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % PANELS.length), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-blue-900/40">
      {PANELS.map(({ Component }, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          <Component className="w-full h-full" />
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/70 to-transparent z-10">
        <p className="text-xs font-mono text-green-300 opacity-80">{PANELS[current].label[lang]}</p>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
        {PANELS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'bg-green-400 w-5 h-1.5' : 'bg-white/30 w-1.5 h-1.5'}`} />
        ))}
      </div>
    </div>
  );
}

/* ── Showcase strip — 4 animated panels on blue background ──────────── */
function ShowcaseStrip({ lang }: { lang: 'fr' | 'en' | 'ar' }) {
  const items = [
    { Component: PCBTraceCanvas,     label: { fr: 'Circuit PCB animé',   en: 'Animated PCB circuit', ar: 'دائرة PCB متحركة' } },
    { Component: ChipCanvas,         label: { fr: 'Puce ESP32',           en: 'ESP32 chip',           ar: 'شريحة ESP32' } },
    { Component: OscilloscopeCanvas, label: { fr: 'Oscilloscope',         en: 'Oscilloscope',         ar: 'راسم الذبذبات' } },
    { Component: LEDArrayCanvas,     label: { fr: 'Matrice LED',          en: 'LED matrix',           ar: 'مصفوفة LED' } },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ Component, label }, i) => (
        <div key={i}
          className="group relative rounded-2xl overflow-hidden border border-blue-400/20
                     hover:border-blue-300/50 transition-all hover:-translate-y-1
                     hover:shadow-xl hover:shadow-blue-900/40"
          style={{ aspectRatio: '4/3' }}>
          <Component className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold font-mono">{label[lang]}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Tutorial strip — 3 mini animated panels ────────────────────────── */
function TutorialStrip({ lang }: { lang: 'fr' | 'en' | 'ar' }) {
  const items = [
    { Component: LEDArrayCanvas,     label: { fr: 'LED & GPIO',      en: 'LEDs & GPIO',      ar: 'LEDs ومداخل GPIO' } },
    { Component: OscilloscopeCanvas, label: { fr: 'Signaux & capteurs', en: 'Signals & sensors', ar: 'إشارات ومستشعرات' } },
    { Component: PCBTraceCanvas,     label: { fr: 'Conception PCB',  en: 'PCB design',       ar: 'تصميم PCB' } },
  ];
  return (
    <div className="mt-12 grid grid-cols-3 gap-4">
      {items.map(({ Component, label }, i) => (
        <div key={i}
          className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm
                     hover:shadow-lg hover:-translate-y-1 transition-all group"
          style={{ aspectRatio: '16/9' }}>
          <Component className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
          <p className="absolute bottom-3 left-3 text-white text-xs font-bold font-mono">{label[lang]}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { lang } = useLang();
  const [products,   setProducts]   = useState<any[]>([]);
  const [tutorials,  setTutorials]  = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selCat,     setSelCat]     = useState('Tous');
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);

  const [heroRef,  heroIn]  = useInView(0.1);
  const [whyRef,   whyIn]   = useInView(0.1);
  const [prodRef,  prodIn]  = useInView(0.05);
  const [tutRef,   tutIn]   = useInView(0.1);
  const [statsRef, statsIn] = useInView(0.2);
  const [aiRef,    aiIn]    = useInView(0.1);

  const c1 = useCounter(500, 1800, statsIn);
  const c2 = useCounter(250,  1600, statsIn);
  const c3 = useCounter(24,  1400, statsIn);

  useEffect(() => {
    setMounted(true);
    getCategories().then(setCategories);
    getTutorials(lang).then(d => setTutorials(d.slice(0, 3)));
  }, [lang]);

  useEffect(() => {
    setLoading(true);
    getProducts(lang, selCat === 'Tous' ? undefined : selCat)
      .then(d => { setProducts(d.slice(0, 8)); setLoading(false); });
  }, [lang, selCat]);

  const t = {
    fr: {
      heroBadge: '🇹🇩 N\'Djamena, Tchad',
      heroTitle1: 'Tout pour vos',
      heroTitle2: 'projets électroniques',
      heroSub: 'Arduino, ESP32, capteurs, relais, modules GSM et plus. Tutoriels gratuits + Assistant IA.',
      shopBtn: 'Explorer la boutique',
      tutBtn: 'Tutoriels gratuits',
      whyTitle: 'Pourquoi IP ElectroLab ?',
      catTitle: 'Catégories',
      catAll: 'Tous',
      prodTitle: 'Produits populaires',
      seeAll: 'Voir tout',
      tutTitle: 'Apprendre avec nos tutoriels',
      tutSub: 'Des guides pas-à-pas pour tous les niveaux',
      ctaTitle: 'Un projet ? Une question ?',
      ctaSub: 'Notre équipe vous aide à choisir les bons composants.',
      ctaBtn: 'Démarrer sur WhatsApp',
      aiTitle: 'Assistant IA 24h/24',
      aiSub: 'Posez vos questions sur Arduino, ESP32, câblage ou code. Notre IA vous répond instantanément.',
      aiBtn: 'Essayer l\'IA',
      read: 'Lire',
      stats: ['Composants', 'Tutoriels', 'Support'],
    },
    en: {
      heroBadge: '🇹🇩 N\'Djamena, Chad',
      heroTitle1: 'Everything for your',
      heroTitle2: 'electronics projects',
      heroSub: 'Arduino, ESP32, sensors, relays, GSM modules and more. Free tutorials + AI Assistant.',
      shopBtn: 'Explore shop',
      tutBtn: 'Free tutorials',
      whyTitle: 'Why IP ElectroLab?',
      catTitle: 'Categories',
      catAll: 'All',
      prodTitle: 'Popular products',
      seeAll: 'See all',
      tutTitle: 'Learn with our tutorials',
      tutSub: 'Step-by-step guides for all skill levels',
      ctaTitle: 'A project or a question?',
      ctaSub: 'Our team helps you pick the right components.',
      ctaBtn: 'Start on WhatsApp',
      aiTitle: 'AI Assistant 24/7',
      aiSub: 'Ask about Arduino, ESP32, wiring or code. Our AI answers instantly.',
      aiBtn: 'Try the AI',
      read: 'Read',
      stats: ['Components', 'Tutorials', 'Support'],
    },
    ar: {
      heroBadge: '🇹🇩 إنجامينا، تشاد',
      heroTitle1: 'كل ما تحتاجه',
      heroTitle2: 'لمشاريعك الإلكترونية',
      heroSub: 'Arduino وESP32 والمستشعرات والمرحلات ووحدات GSM والمزيد. دروس مجانية + مساعد ذكي.',
      shopBtn: 'استكشاف المتجر',
      tutBtn: 'دروس مجانية',
      whyTitle: 'لماذا IP ElectroLab؟',
      catTitle: 'الفئات',
      catAll: 'الكل',
      prodTitle: 'المنتجات الشائعة',
      seeAll: 'عرض الكل',
      tutTitle: 'تعلم مع دروسنا',
      tutSub: 'أدلة خطوة بخطوة لجميع المستويات',
      ctaTitle: 'مشروع أو سؤال؟',
      ctaSub: 'فريقنا يساعدك في اختيار المكونات المناسبة.',
      ctaBtn: 'ابدأ على واتساب',
      aiTitle: 'مساعد ذكي 24/7',
      aiSub: 'اسأل عن Arduino وESP32 والتوصيل أو الكود. مساعدنا يجيبك فوراً.',
      aiBtn: 'جرب الذكاء الاصطناعي',
      read: 'قراءة',
      stats: ['مكونات', 'دروس', 'دعم'],
    },
  }[lang];

  const features = [
    {
      icon: <Package size={24} className="text-blue-600" />,
      bg: 'bg-blue-50', border: 'border-blue-100',
      title: lang === 'fr' ? 'Large catalogue' : lang === 'en' ? 'Wide catalogue' : 'كتالوج واسع',
      desc: lang === 'fr' ? 'Arduino, ESP32, LCD, capteurs, relais, moteurs, GSM et plus.'
          : lang === 'en' ? 'Arduino, ESP32, LCD, sensors, relays, motors, GSM and more.'
          : 'Arduino وESP32 وLCD والمستشعرات والمرحلات والمحركات والمزيد.',
      delay: 0,
    },
    {
      icon: <BookOpen size={24} className="text-emerald-600" />,
      bg: 'bg-emerald-50', border: 'border-emerald-100',
      title: lang === 'fr' ? 'Tutoriels gratuits' : lang === 'en' ? 'Free tutorials' : 'دروس مجانية',
      desc: lang === 'fr' ? 'Guides complets avec code et schémas pour tous les niveaux.'
          : lang === 'en' ? 'Complete guides with code and diagrams for all levels.'
          : 'أدلة شاملة مع الكود والمخططات لجميع المستويات.',
      delay: 80,
    },
    {
      icon: <Bot size={24} className="text-violet-600" />,
      bg: 'bg-violet-50', border: 'border-violet-100',
      title: lang === 'fr' ? 'Assistant IA 24/7' : lang === 'en' ? 'AI Assistant 24/7' : 'مساعد ذكي 24/7',
      desc: lang === 'fr' ? 'Réponses techniques instantanées à toute heure.'
          : lang === 'en' ? 'Instant technical answers at any hour.'
          : 'إجابات تقنية فورية في أي وقت.',
      delay: 160,
    },
    {
      icon: <Zap size={24} className="text-amber-500" />,
      bg: 'bg-amber-50', border: 'border-amber-100',
      title: lang === 'fr' ? 'Livraison rapide' : lang === 'en' ? 'Fast delivery' : 'توصيل سريع',
      desc: lang === 'fr' ? 'Commandez via WhatsApp ou en ligne. Livraison dans N\'Djamena.'
          : lang === 'en' ? 'Order via WhatsApp or online. Delivery across N\'Djamena.'
          : 'اطلب عبر واتساب أو الإنترنت. توصيل في إنجامينا.',
      delay: 240,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.4); }
        }
        @keyframes shimmer-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .animate-fade-up    { animation: fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-slide-left { animation: slideLeft 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-slide-right{ animation: slideRight 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .float-card { animation: float-card 5s ease-in-out infinite; }
        .feature-card { transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(37,99,235,0.10); border-color: #bfdbfe !important; }
        .cat-btn { transition: all 0.2s; }
        .cat-btn:hover:not(.active) { background: #eff6ff; color: #1d4ed8; }
        .shimmer-line {
          position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: shimmer-bar 2.5s ease-in-out infinite;
          border-radius: inherit;
        }
      `}</style>

      <div className="bg-white overflow-x-hidden">

        {/* ══ HERO ══ */}
        <section ref={heroRef}
          className="relative pt-28 pb-16 md:pt-36 md:pb-24
                     bg-gradient-to-br from-white via-blue-50/60 to-blue-100/40 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full bg-blue-100/50 blur-3xl" />
            <div className="absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: 'radial-gradient(circle, #1d4ed8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={mounted ? 'animate-slide-left' : 'opacity-0'}>
                <div className="inline-flex items-center gap-2 bg-blue-600/8 border border-blue-200
                                rounded-full px-4 py-2 text-sm font-semibold text-blue-700 mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-500"
                    style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }} />
                  {t.heroBadge}
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.05] text-gray-900 mb-5 tracking-tight">
                  {t.heroTitle1}<br />
                  <span className="text-blue-600">{t.heroTitle2}</span>
                </h1>
                <p className="text-gray-500 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">{t.heroSub}</p>
                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <Link href="/boutique"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5
                               bg-blue-600 hover:bg-blue-700 text-white font-bold text-base
                               rounded-2xl shadow-lg shadow-blue-200 transition-all
                               hover:-translate-y-0.5 hover:shadow-blue-300">
                    <ShoppingBag size={18} /> {t.shopBtn}
                  </Link>
                  <Link href="/tutoriels"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5
                               bg-white border-2 border-blue-100 hover:border-blue-300
                               text-blue-700 font-bold text-base rounded-2xl transition-all hover:-translate-y-0.5">
                    <BookOpen size={18} /> {t.tutBtn}
                  </Link>
                </div>
                <div ref={statsRef}
                  className={`flex gap-8 pt-8 border-t border-blue-100 ${statsIn ? 'animate-fade-up' : 'opacity-0'}`}
                  style={{ animationDelay: '0.3s' }}>
                  {[{ n: c1 + '+', label: t.stats[0] }, { n: c2 + '+', label: t.stats[1] }, { n: c3 + '/7', label: t.stats[2] }].map((s, i) => (
                    <div key={i}>
                      <p className="text-2xl font-black text-blue-700">{s.n}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero animated canvas carousel */}
              <div className={`${mounted ? 'animate-slide-right' : 'opacity-0'} float-card`} style={{ height: 380 }}>
                <HeroCarousel lang={lang as 'fr' | 'en' | 'ar'} />
              </div>
            </div>
          </div>
        </section>

        {/* ══ WHY US ══ */}
        <section ref={whyRef} className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{t.whyTitle}</h2>
            <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i}
                className={`feature-card bg-white border rounded-3xl p-6 ${f.border} shadow-sm ${whyIn ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${f.delay}ms` }}>
                <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-4 border ${f.border}`}>{f.icon}</div>
                <h3 className="font-black text-gray-800 mb-2 text-[15px]">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ SHOWCASE STRIP ══ */}
        <section className="bg-blue-600 py-14 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <ShowcaseStrip lang={lang as 'fr' | 'en' | 'ar'} />
          </div>
        </section>

        {/* ══ CATEGORIES + PRODUCTS ══ */}
        <section ref={prodRef} className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-blue-600 font-semibold text-sm mb-1">{t.catTitle}</p>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t.prodTitle}</h2>
            </div>
            <Link href="/boutique"
              className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:text-blue-700 transition">
              {t.seeAll} <ChevronRight size={16} />
            </Link>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {['Tous', ...categories].map(cat => {
                const isActive = selCat === cat || (cat === 'Tous' && selCat === 'Tous');
                return (
                  <button key={cat} onClick={() => setSelCat(cat)}
                    className={`cat-btn flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all
                      ${isActive ? 'active bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {cat === 'Tous' ? <Package size={14} /> : <CategoryIcon name={cat} />}
                    {cat === 'Tous' ? t.catAll : cat}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="relative h-72 bg-gray-100 rounded-3xl overflow-hidden">
                  <div className="shimmer-line" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Package size={48} className="mx-auto mb-4 text-gray-200" />
              <p>{lang === 'fr' ? 'Aucun produit dans cette catégorie' : 'No products in this category'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p, i) => (
                <div key={p._id}
                  className={prodIn ? 'animate-fade-up' : 'opacity-0'}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ AI ASSISTANT BANNER ══ */}
        <section ref={aiRef} className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${aiIn ? 'animate-fade-up' : 'opacity-0'}`}>
              <div className="text-white">
                <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Bot size={28} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{t.aiTitle}</h2>
                <p className="text-blue-100 text-lg leading-relaxed mb-8">{t.aiSub}</p>
                <Link href="/assistant"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-blue-700 font-black text-base
                             rounded-2xl hover:bg-blue-50 transition shadow-xl hover:-translate-y-0.5">
                  <Bot size={18} /> {t.aiBtn} <ArrowRight size={16} />
                </Link>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-sm">
                {[
                  { role: 'user', text: lang === 'fr' ? 'Comment connecter un DHT22 à l\'Arduino ?' : lang === 'en' ? 'How do I connect a DHT22 to Arduino?' : 'كيف أوصل DHT22 بـ Arduino؟' },
                  { role: 'ai',   text: lang === 'fr' ? 'Branchez VCC sur 5V, GND sur GND, et DATA sur la pin D2. Ajoutez une résistance 10kΩ entre VCC et DATA.' : lang === 'en' ? 'Connect VCC to 5V, GND to GND, and DATA to pin D2. Add a 10kΩ pull-up resistor between VCC and DATA.' : 'وصّل VCC بـ 5V وGND بـ GND وDATA بـ D2. أضف مقاومة 10kΩ بين VCC وDATA.' },
                  { role: 'user', text: lang === 'fr' ? 'Quel est le code de base ?' : lang === 'en' ? 'What\'s the basic code?' : 'ما هو الكود الأساسي؟' },
                ].map((msg, i) => (
                  <div key={i} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                        <Bot size={14} className="text-white" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] leading-relaxed
                      ${msg.role === 'user' ? 'bg-white text-blue-800 font-medium rounded-tr-sm' : 'bg-white/15 text-white rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white/15 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                    {[0,1,2].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-white/60 rounded-full"
                        style={{ animation: `pulse-dot 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ TUTORIALS ══ */}
        <section ref={tutRef} className="bg-gray-50 py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-blue-600 font-semibold text-sm mb-1">Tutorials</p>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">{t.tutTitle}</h2>
                <p className="text-gray-400 mt-1 text-sm">{t.tutSub}</p>
              </div>
              <Link href="/tutoriels"
                className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:text-blue-700 transition whitespace-nowrap">
                {t.seeAll} <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tutorials.map((tut, i) => (
                <Link key={tut._id} href={`/tutoriels/${tut._id}`}
                  className={`bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm
                    hover:shadow-lg hover:-translate-y-1 transition-all group
                    ${tutIn ? 'animate-fade-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative h-48 bg-blue-50">
                    {tut.imageUrl ? (
                      <Image src={tut.imageUrl} alt={tut.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen size={40} className="text-blue-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${levelColor[tut.level] ?? 'bg-gray-100'}`}>
                      {levelLabel[tut.level]?.[lang] ?? tut.level}
                    </span>
                  </div>
                  <div className="p-5">
                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">{tut.category}</span>
                    <h3 className="font-black text-gray-800 mt-1.5 leading-snug line-clamp-2 group-hover:text-blue-700 transition text-[15px]">
                      {tut.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-2 line-clamp-2">{tut.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} /> {tut.duration} min
                      </span>
                      <span className="text-blue-600 text-sm font-black flex items-center gap-1">
                        {t.read} <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <TutorialStrip lang={lang as 'fr' | 'en' | 'ar'} />
          </div>
        </section>

        {/* ══ WHATSAPP CTA ══ */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="#22c55e" className="w-8 h-8">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L0 24l6.335-1.502A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.013-1.375l-.36-.214-3.732.884.939-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{t.ctaTitle}</h2>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">{t.ctaSub}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-black
                           text-base rounded-2xl shadow-xl shadow-green-100 transition hover:-translate-y-0.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L0 24l6.335-1.502A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.013-1.375l-.36-.214-3.732.884.939-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
                </svg>
                {t.ctaBtn}
              </a>
              <Link href="/boutique"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-blue-100 hover:border-blue-300
                           text-blue-700 font-bold rounded-2xl transition hover:-translate-y-0.5 text-base">
                <ShoppingBag size={18} /> {t.shopBtn}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
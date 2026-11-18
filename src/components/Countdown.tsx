'use client';
import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

/** "2j 04:12:09" until a date. */
export default function Countdown({ until, className = '' }: { until: string | Date; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  let s = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold tabular-nums ${className}`}>
      <Timer size={14} />
      {d > 0 && `${d}j `}{two(Math.floor(s / 3600))}:{two(Math.floor((s % 3600) / 60))}:{two(s % 60)}
    </span>
  );
}

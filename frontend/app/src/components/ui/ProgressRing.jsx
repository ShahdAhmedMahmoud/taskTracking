import { useEffect, useId, useState } from 'react';
import useCountUp from '../../hooks/useCountUp';

export default function ProgressRing({ pct = 0, size = 96, stroke = 10, tone = 'brand' }) {
  const gid = useId();
  const [on, setOn] = useState(false);
  const value = useCountUp(pct, 1100);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const offset = on ? c - (clamped / 100) * c : c;
  const light = tone === 'light';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${clamped}%`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5059A5" />
            <stop offset="100%" stopColor="#2A317A" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={light ? 'rgba(255,255,255,.22)' : '#E4E6F4'} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={light ? '#ffffff' : `url(#${gid})`}
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center text-lg font-extrabold tabular-nums ${light ? 'text-white' : 'text-brand-900'}`} style={{ fontSize: size * 0.24 }}>
        {value.toLocaleString('ar-EG')}%
      </span>
    </div>
  );
}
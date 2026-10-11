import { useEffect, useState } from 'react';

export default function GaugeChart({ segments, size = 280, stroke = 30, centerValue, centerLabel }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - stroke) / 2;
  const cy = r + stroke / 2;
  const h = cy + 4;
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`;
  const GAP = 1.5;
  let acc = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${h}`} className="w-full">
        <path d={d} fill="none" stroke="#f2f3fa" strokeWidth={stroke} />
        {total > 0 && segments.map((s) => {
          const len = (s.value / total) * 100;
          const dash = ready ? Math.max(len - GAP, 0) : 0;
          const el = (
            <path
              key={s.label} d={d} fill="none" stroke={s.color} strokeWidth={stroke} pathLength="100"
              strokeDasharray={`${dash} 100`} strokeDashoffset={-acc}
              style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)' }}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-5xl font-extrabold tabular-nums leading-none text-neutral-900">{centerValue}</p>
        {centerLabel && <p className="mt-1 text-sm font-semibold text-neutral-400">{centerLabel}</p>}
      </div>
    </div>
  );
}
import { useEffect, useId, useState } from 'react';

export default function AreaChart({ data, height = 240, unit = 'مشروع' }) {
  const gid = useId().replace(/:/g, '');
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const W = 100, H = 50, padT = 8, padB = 2;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  // RTL: أول نقطة على اليمين
  const pts = data.map((d, i) => ({
    x: n > 1 ? W - (i / (n - 1)) * W : W / 2,
    y: H - padB - (d.value / max) * (H - padT - padB),
  }));

  const line = pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const mx = (a[i - 1].x + p.x) / 2;
    return `${acc} C${mx},${a[i - 1].y} ${mx},${p.y} ${p.x},${p.y}`;
  }, '');
  const area = `${line} L${pts[n - 1].x},${H} L${pts[0].x},${H} Z`;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = Math.min(Math.max((rect.right - e.clientX) / rect.width, 0), 1);
    setHover(Math.round(rel * (n - 1)));
  };

  const hp = hover != null ? pts[hover] : null;

  return (
    <div>
      <div className="relative cursor-crosshair touch-pan-y" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible"
          style={{ clipPath: ready ? 'inset(-10% 0 0 0)' : 'inset(-10% 0 0 100%)', transition: 'clip-path 1.2s cubic-bezier(.22,1,.36,1)' }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1fa08c" stopOpacity=".35" />
              <stop offset="100%" stopColor="#1fa08c" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#e2e8f0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke="#118173" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {hp && (
          <>
            <span className="pointer-events-none absolute top-0 h-full w-px bg-brand-300/60" style={{ left: `${hp.x}%` }} />
            <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand-600 bg-white shadow" style={{ left: `${hp.x}%`, top: `${(hp.y / H) * 100}%` }} />
            <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-bold text-white shadow-lift" style={{ left: `${Math.min(Math.max(hp.x, 12), 88)}%`, top: `calc(${(hp.y / H) * 100}% - 14px)` }}>
              {data[hover].label}: {data[hover].value.toLocaleString('ar-EG')} {unit}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className={`flex-1 text-center text-sm font-bold ${d.current ? 'text-brand-700' : 'text-slate-400'}`}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
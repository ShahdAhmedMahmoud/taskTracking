import { useEffect, useState } from 'react';

const HATCH = 'repeating-linear-gradient(135deg, #b9c9c5 0 2px, transparent 2px 7px)';

export default function BarPills({ data, height = 230 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  const labelH = 32;
  const area = height - labelH;

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => {
        const empty = d.value === 0;
        const px = Math.round(area * (empty ? 0.32 : 0.28 + 0.72 * (d.value / max)));
        const isPeak = !empty && i === peak;
        const color = isPeak ? 'bg-brand-900' : d.today ? 'bg-brand-400' : 'bg-brand-600';
        return (
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end">
            <div className="relative w-full max-w-[3.5rem]" style={{ height: ready ? px : 0, transition: `height .8s cubic-bezier(.22,1,.36,1) ${i * 70}ms` }}>
              <span className={`absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-brand-800 shadow-soft ring-1 ring-brand-100 transition ${isPeak ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {d.value.toLocaleString('ar-EG')}
              </span>
              <div
                className={`h-full w-full rounded-full transition duration-300 group-hover:scale-x-105 ${empty ? 'border border-slate-200' : color}`}
                style={empty ? { backgroundImage: HATCH } : undefined}
              />
            </div>
            <span className={`mt-2 text-sm font-bold ${d.today ? 'text-brand-700' : 'text-slate-400'}`} style={{ height: labelH - 8 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
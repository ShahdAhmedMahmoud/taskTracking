import { useEffect, useState } from 'react';
import { n } from '../../utils/dashboardData';

export default function SegmentBar({ segments, hints = {} }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <div>
      <div className="flex h-14 gap-1.5 sm:h-16" onMouseLeave={() => setActive(null)}>
        {total === 0 && <div className="flex-1 rounded-2xl bg-slate-100" />}
        {segments.map((s, i) => (s.value > 0 && (
          <button
            key={s.key} type="button"
            onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
            onClick={() => setActive((a) => (a === i ? null : i))}
            aria-label={`${s.label}: ${s.value}`}
            className={`grid min-w-0 place-items-center rounded-2xl text-white transition-[flex-grow,opacity,filter,box-shadow] duration-700 ease-out
              ${active === i ? 'shadow-lift brightness-110' : active !== null ? 'opacity-40' : ''}`}
            style={{ background: s.color, flexGrow: ready ? s.value : 0, flexBasis: 0 }}
          >
            <span className="text-lg font-extrabold tabular-nums">{(s.value / total) >= 0.07 ? n(s.value) : ''}</span>
          </button>
        )))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {segments.map((s, i) => (
          <div
            key={s.key}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            className={`rounded-2xl border p-4 transition duration-300 ${active === i ? '-translate-y-1 border-transparent shadow-lift' : 'border-slate-100'} ${active !== null && active !== i ? 'opacity-60' : ''}`}
            style={active === i ? { boxShadow: `0 14px 30px -12px ${s.color}88` } : undefined}
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              <span className="text-sm font-bold text-slate-600">{s.label}</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{n(s.value)}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {total ? `${n(Math.round((s.value / total) * 100))}%` : '—'}{hints[s.key] ? ` · ${hints[s.key]}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
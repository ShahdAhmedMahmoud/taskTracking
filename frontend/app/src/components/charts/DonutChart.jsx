import { useEffect, useState } from 'react';
import { n } from '../../utils/dashboardData';

export default function DonutChart({ segments, size = 200, stroke = 26, centerValue, centerLabel }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - stroke - 8) / 2;
  const GAP = 1.2;
  const act = active != null ? segments[active] : null;
  let acc = 0;

  return (
    <div>
      <div className="relative mx-auto" style={{ width: size, height: size, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90 overflow-visible">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f2f3fa" strokeWidth={stroke} />
          {total > 0 && segments.map((s, i) => {
            const len = (s.value / total) * 100;
            const dash = ready ? Math.max(len - GAP, 0) : 0;
            const el = (
              <circle
                key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
                strokeWidth={active === i ? stroke + 8 : stroke} pathLength="100"
                strokeDasharray={`${dash} 100`} strokeDashoffset={-acc}
                opacity={active !== null && active !== i ? 0.3 : 1}
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1), stroke-width .25s, opacity .25s', cursor: 'pointer' }}
                onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                onClick={() => setActive((a) => (a === i ? null : i))}
              />
            );
            acc += len;
            return el;
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div key={active ?? 'all'} className="animate-rise">
            <p className="text-4xl font-extrabold tabular-nums leading-none text-neutral-900" style={act ? { color: act.color } : undefined}>
              {act ? n(act.value) : centerValue}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-neutral-400">
              {act ? `${act.label} · ${total ? n(Math.round((act.value / total) * 100)) : 0}%` : centerLabel}
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {segments.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-600 transition ${active === i ? 'bg-neutral-100' : ''}`}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
            {s.label}
            <b className="tabular-nums text-neutral-900">{n(s.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
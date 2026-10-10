import { useEffect, useState } from 'react';
import { n } from '../../utils/dashboardData';

const ROWS = [['won', 'فوز', '#10675d'], ['pending', 'معلق', '#fbbf24'], ['lost', 'خسارة', '#fb7185']];
const HATCH = 'repeating-linear-gradient(135deg, #cbd5e1 0 2px, transparent 2px 7px)';

export default function StackedColumns({ data, height = 280 }) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.total));
  const barMax = height - 78;

  return (
    <div>
      <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
        {[0.25, 0.5, 0.75].map((f) => (
          <span key={f} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${f * (height - 36)}px` }} />
        ))}

        <div className="relative flex h-full items-end justify-between gap-2 sm:gap-4">
          {data.map((d, i) => {
            const px = d.total ? Math.max(28, Math.round(barMax * (d.total / max))) : 8;
            const dim = active !== null && active !== i;
            return (
              <div
                key={i}
                className="relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                onMouseEnter={() => setActive(i)} onClick={() => setActive((a) => (a === i ? null : i))}
              >
                {active === i && (
                  <div className={`pointer-events-none absolute bottom-full z-20 mb-2 w-44 rounded-xl bg-slate-900 p-3 text-white shadow-lift animate-rise
                    ${i === 0 ? 'right-0' : i === data.length - 1 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
                    <p className="text-sm font-extrabold">{d.title}</p>
                    <p className="mb-2 text-xs text-white/60">{d.total ? `${n(d.total)} مشروع مسلّم` : 'لا تسليمات'}</p>
                    {ROWS.filter(([k]) => d[k] > 0).map(([k, label, color]) => (
                      <p key={k} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}
                        <b className="ms-auto tabular-nums">{n(d[k])}</b>
                      </p>
                    ))}
                  </div>
                )}

                {d.total > 0 && <span className={`mb-1.5 text-sm font-extrabold tabular-nums transition ${active === i ? 'scale-125 text-brand-800' : 'text-slate-500'}`}>{n(d.total)}</span>}

                <div
                  className={`flex w-full max-w-[3.5rem] flex-col gap-0.5 overflow-hidden rounded-2xl transition-all duration-300 ${dim ? 'opacity-40' : ''} ${active === i ? 'scale-x-110' : ''} ${d.total ? '' : 'border border-slate-200'}`}
                  style={{ height: ready ? px : 0, transition: `height .8s cubic-bezier(.22,1,.36,1) ${i * 70}ms, opacity .3s, transform .3s`, backgroundImage: d.total ? undefined : HATCH }}
                >
                  {d.total > 0 && [['lost', '#fb7185'], ['pending', '#fbbf24'], ['won', '#10675d']].map(([k, c]) => (
                    d[k] > 0 && <div key={k} style={{ flexGrow: d[k], flexBasis: 0, background: c }} />
                  ))}
                </div>

                <span className={`mt-2 h-6 text-sm font-bold ${active === i ? 'text-brand-700' : 'text-slate-400'}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {ROWS.map(([k, label, color]) => (
          <li key={k} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="h-3 w-3 rounded-full" style={{ background: color }} />{label}
          </li>
        ))}
      </ul>
    </div>
  );
}
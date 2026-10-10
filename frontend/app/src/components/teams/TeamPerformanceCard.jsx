import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressRing from '../ui/ProgressRing';
import { ArrowIcon, ChevronDownIcon } from '../ui/Icons';
import { teamLabel } from '../../utils/helpers';
import { STATES, stateOf, n } from '../../utils/dashboardData';

const MEDAL = [
  'from-amber-300 to-amber-500 text-amber-950',
  'from-slate-200 to-slate-400 text-slate-800',
  'from-orange-300 to-orange-500 text-orange-950',
];
const HATCH = 'repeating-linear-gradient(135deg, #cbd5e1 0 2px, transparent 2px 7px)';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '—');

export default function TeamPerformanceCard({ team, rank, pct, done, total, breakdown, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { running, delivered, won, lost, pending, decided, winPct } = breakdown;
console.log('breakdown:', breakdown);
console.log('delivered:', delivered, '| isArray:', Array.isArray(delivered), '| type:', typeof delivered);
  const count = delivered.length;

  return (
    <article
      className="card group/team relative flex flex-col p-5 animate-rise transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      {rank && (
        <span className={`absolute -top-3 start-5 grid h-8 min-w-8 place-items-center rounded-full bg-gradient-to-br px-2 text-sm font-extrabold shadow-md ${MEDAL[rank - 1]}`}>#{n(rank)}</span>
      )}

      <div className="flex items-start gap-4">
        <div className="shrink-0 transition duration-500 group-hover/team:scale-105">
          <ProgressRing pct={pct} size={88} stroke={9} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-extrabold">{teamLabel(team)}</h3>
          <p className="truncate text-sm text-slate-400">{team.manager} · {n(team.engineers.length)} مهندس</p>
          <p className="mt-1.5 text-xs font-semibold text-slate-400">إنجاز المهام: {n(done)} من {n(total)}</p>
        </div>
        <Link to={`/teams/${team.id}`} aria-label="تفاصيل الفريق" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 ring-1 ring-slate-200 transition duration-300 hover:bg-brand-600 hover:text-white hover:ring-brand-600 group-hover/team:-translate-x-1">
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ['جارية', n(running), 'text-sky-600'],
          ['سلّمت', n(count), 'text-brand-700'],
          ['نسبة الفوز', decided ? `${n(winPct)}%` : '—', 'text-emerald-600'],
        ].map(([label, v, c]) => (
          <div key={label} className="rounded-xl bg-slate-50 py-3 transition duration-300 hover:bg-brand-50">
            <p className={`text-2xl font-extrabold tabular-nums ${c}`}>{v}</p>
            <p className="text-xs font-semibold text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* شريط النتائج */}
      <div className="mt-5">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
          {count === 0
            ? <div className="flex-1" style={{ backgroundImage: HATCH }} />
            : [['won', won], ['pending', pending], ['lost', lost]].map(([k, v]) => (v > 0 && (
              <div key={k} className="transition-[flex-grow] duration-1000 ease-out" style={{ flexGrow: ready ? v : 0, flexBasis: 0, background: STATES[k].color }} />
            )))}
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {count === 0 ? 'لا توجد تسليمات في هذه الفترة' : `${n(won)} فوز · ${n(pending)} معلق · ${n(lost)} خسارة`}
        </p>
      </div>

      {/* المشاريع المسلّمة */}
      <button
        type="button" onClick={() => setOpen((o) => !o)} disabled={!count} aria-expanded={open}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        المشاريع المسلّمة ({n(count)})
        <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pe-1">
            {delivered.map(({ p, engineer }, i) => {
              const s = stateOf(p);
              return (
                <li key={p.id ?? i}>
                  <Link to={`/engineers/${engineer.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATES[s].color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{p.name || 'مشروع بدون اسم'}</p>
                      <p className="truncate text-xs text-slate-400">{engineer.name} · {fmtDate(p.deliveryDate)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${STATES[s].pill}`}>{STATES[s].label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </article>
  );
}
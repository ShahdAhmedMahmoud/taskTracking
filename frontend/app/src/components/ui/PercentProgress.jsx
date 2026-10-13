import { n } from '../../utils/dashboardData';

export default function PercentProgress({ value, detail, color = '#2A317A', compact = false }) {
  if (value == null || !Number.isFinite(Number(value))) return <span className="text-neutral-400">—</span>;
  const pct = Math.max(0, Math.min(100, Number(value)));
  return <div className={`mx-auto flex min-w-24 max-w-40 items-center gap-2 ${compact ? 'min-w-20' : ''}`}>
    <div className="h-2.5 min-w-8 flex-1 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label={`نسبة ${n(pct)} بالمئة`} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
    </div>
    <span className="shrink-0 text-xs font-extrabold tabular-nums text-neutral-700">{n(pct)}%</span>
    {detail && <span className="hidden shrink-0 whitespace-nowrap text-[10px] font-semibold text-neutral-400 sm:inline">{detail}</span>}
  </div>;
}

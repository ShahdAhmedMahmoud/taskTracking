import { daysLeft, fmtDate, toneChip } from '../utils/dates';
import ProgressBar from './ui/ProgressBar';

export default function ProjectRow({ rank, project, stats, sub, onClick }) {
  const di = daysLeft(project.deliveryDate);
  const outcome = project.finished
    ? project.outcome === 'won' ? ['🏆 فوز', 'brand'] : project.outcome === 'lost' ? ['✗ خسارة', 'red'] : ['☑ منتهي', 'slate']
    : null;
  return (
    <div onClick={onClick} className="card-hover animate-fade-up flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
      <div className="flex items-center gap-3 md:contents">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-xs font-extrabold text-neutral-500">{rank}</div>
        <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-brand-50 py-1.5 text-brand-700">
          <b className="text-lg leading-none">{project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString('ar-EG', { day: 'numeric' }) : '—'}</b>
          <span className="text-[10px] font-bold">{project.deliveryDate ? fmtDate(project.deliveryDate, { month: 'short', year: 'numeric' }) : 'بدون موعد'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-extrabold">{project.name || 'مشروع بدون اسم'}</h4>
          {sub && <div className="truncate text-xs text-neutral-500">{sub}</div>}
        </div>
      </div>
      <div className="md:w-56">
        <ProgressBar pct={stats.pct} />
        <div className="mt-1 text-xs font-bold text-neutral-500">{stats.done}/{stats.total} مهمة · {stats.pct}%</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {outcome && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneChip[outcome[1]]}`}>{outcome[0]}</span>}
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneChip[di.tone]}`}>{di.text}</span>
      </div>
    </div>
  );
}
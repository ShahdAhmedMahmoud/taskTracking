import { Link } from 'react-router-dom';
import useCountUp from '../../hooks/useCountUp';
import { ArrowIcon } from './Icons';

const TONES = {
  brand:   { tile: 'bg-brand-50 text-brand-600' },
  indigo:  { tile: 'bg-brand-50 text-brand-600' },
  sky:     { tile: 'bg-brand-50 text-brand-600' },
  amber:   { tile: 'bg-brand-50 text-brand-600' },
  emerald: { tile: 'bg-brand-50 text-brand-600' },
  rose:    { tile: 'bg-brand-50 text-brand-600' },
};

export default function StatCard({ icon, label, value, tone = 'brand', hint, delay = 0, featured = false, to, suffix = '' }) {
  const t = TONES[tone] || TONES.brand;
  const isNum = typeof value === 'number';
  const counted = useCountUp(isNum ? value : 0);
  const Wrapper = to ? Link : 'div';

  return (
    <Wrapper
      {...(to ? { to } : {})}
      className={`group relative block overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift animate-rise
        ${featured ? 'border border-brand-200/80 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 text-neutral-800 shadow-lift' : 'card'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {featured && <div className="pointer-events-none absolute -end-10 -top-10 h-36 w-36 rounded-full bg-brand-500/10 blur-2xl transition duration-500 group-hover:scale-125" />}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition duration-300 group-hover:scale-110 ${featured ? 'bg-brand-100 text-brand-700' : t.tile}`}>{icon}</span>
          <span className={`truncate text-base font-bold ${featured ? 'text-brand-900' : 'text-neutral-600'}`}>{label}</span>
        </div>
        {to && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 transition duration-300 group-hover:-translate-x-1 ${featured ? 'ring-brand-200 text-brand-700 group-hover:text-brand-900' : 'ring-neutral-200 text-neutral-500 group-hover:text-brand-600'}`}>
            <ArrowIcon className="h-4 w-4" />
          </span>
        )}
      </div>

      <p className={`relative mt-4 text-5xl font-extrabold tabular-nums leading-none tracking-tight ${featured ? 'text-brand-900' : ''}`}>
        {isNum ? counted.toLocaleString('ar-EG') : value}{isNum && suffix}
      </p>
      {hint && <p className={`relative mt-3 text-sm font-semibold ${featured ? 'text-brand-700' : 'text-neutral-400'}`}>{hint}</p>}
    </Wrapper>
  );
}
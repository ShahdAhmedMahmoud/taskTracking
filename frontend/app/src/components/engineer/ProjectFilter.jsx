import { STATES, n, stateOf } from '../../utils/dashboardData';

/** هل المشروع بيطابق الفلتر الحالي؟ */
export const matchFilter = (p, status, outcome) => {
  if (status === 'running') return !p.finished;
  if (status === 'delivered') return !!p.finished && (outcome === 'all' || stateOf(p) === outcome);
  return true;
};

const PRIMARY = [['all', 'الكل'], ['running', 'جارية'], ['delivered', 'تم التسليم']];
const OUTCOMES = [['all', 'كل المسلّم'], ['pending', 'معلق'], ['won', 'فوز'], ['lost', 'خسارة']];

/**
 * فلتر على مرحلتين:
 *  1) الكل / جارية / تم التسليم
 *  2) (بيظهر مع «تم التسليم» بس) الكل / معلق / فوز / خسارة
 */
export default function ProjectFilter({ projects, status, outcome, onChange, lab }) {
  const c = { all: projects.length, running: 0, delivered: 0, won: 0, lost: 0, pending: 0 };
  projects.forEach((p) => {
    if (!p.finished) { c.running += 1; return; }
    c.delivered += 1; c[stateOf(p)] += 1;
  });

  const idx = PRIMARY.findIndex(([k]) => k === status);
  const open = status === 'delivered';
  const current = status === 'all' ? c.all : status === 'running' ? c.running : outcome === 'all' ? c.delivered : c[outcome];

  return (
    <div className="mb-3 space-y-2.5">
      {/* ===== المرحلة الأولى: segmented بمؤشر بيتحرك ===== */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="فلتر حالة المشاريع" className="relative grid w-full grid-cols-3 rounded-2xl bg-neutral-100 p-1 sm:w-[26rem]">
          <span
            aria-hidden className="absolute inset-y-1 rounded-xl bg-white shadow-soft"
            style={{ width: 'calc((100% - 0.5rem) / 3)', insetInlineStart: `calc(0.25rem + ${idx} * (100% - 0.5rem) / 3)`, transition: 'inset-inline-start 400ms cubic-bezier(.4,0,.2,1)' }}
          />
          {PRIMARY.map(([k, l]) => {
            const on = status === k;
            return (
              <button
                key={k} type="button" role="tab" aria-selected={on} onClick={() => onChange(k, 'all')}
                className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition-colors duration-300 motion-reduce:transition-none ${on ? 'text-brand-800' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                {l}
                <span className={`rounded-full px-1.5 text-xs tabular-nums transition-colors duration-300 ${on ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-400'}`}>{n(c[k])}</span>
              </button>
            );
          })}
        </div>
        {current === 0 && <p className="text-sm font-semibold text-neutral-400">مفيش مشاريع بالفلتر ده</p>}
      </div>

      {/* ===== المرحلة الثانية: بتنزلق وتظهر مع «تم التسليم» ===== */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        aria-hidden={!open} inert={!open}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-50/70 p-2.5 ring-1 ring-brand-100">
            <span className="me-1 ps-1 text-sm font-bold text-brand-800">النتيجة</span>
            {OUTCOMES.map(([k, l]) => {
              const on = outcome === k;
              return (
                <button
                  key={k} type="button" aria-pressed={on} onClick={() => onChange('delivered', k)}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition duration-300 motion-reduce:transition-none ${on ? 'bg-brand-600 text-white shadow-soft ring-brand-600' : 'bg-white text-neutral-500 ring-neutral-200 hover:bg-brand-50 hover:text-brand-800'}`}
                >
                  {k !== 'all' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATES[k].color }} />}
                  {k === 'all' ? l : lab(k)}
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-neutral-100 text-neutral-400'}`}>{n(k === 'all' ? c.delivered : c[k])}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

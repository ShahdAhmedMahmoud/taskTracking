import { useUI } from '../../hooks/useUI';
import Panel from '../ui/Panel';
import { LayersIcon, PlusIcon, TickIcon, TrashIcon } from './EngineerIcons';
import { n } from '../../utils/dashboardData';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '');

/**
 * جولات التسليم: كل جولة = مرة تسليم للعميل (عرض أولي، رد استفسارات، عرض معدّل...)
 * شكل الجولة: { id, title, date, delivered, deliveredAt, note }
 */
export default function RoundsPanel({ project, edit, delay = 0, className = '' }) {
  const { confirm } = useUI();
  const rounds = project.rounds || [];
  const deliveredCount = rounds.filter((r) => r.delivered).length;
  const pct = rounds.length ? (deliveredCount / rounds.length) * 100 : 0;

  const patch = (id, fn) => edit((p) => { fn((p.rounds || []).find((r) => r.id === id)); });

  const add = () => edit((p) => {
    if (!p.rounds) p.rounds = [];
    p.rounds.push({ id: `r${Date.now().toString(36)}`, title: `الجولة ${n(p.rounds.length + 1)}`, date: '', delivered: false, deliveredAt: '', note: '' });
  });

  const toggle = (r) => patch(r.id, (x) => {
    x.delivered = !x.delivered;
    x.deliveredAt = x.delivered ? today() : '';
  });

  const remove = async (r) => {
    const ok = await confirm({ title: '🗑 حذف الجولة', message: `حذف «${r.title || 'الجولة'}» من المشروع؟`, confirmText: 'حذف الجولة' });
    if (ok) edit((p) => { p.rounds = (p.rounds || []).filter((x) => x.id !== r.id); });
  };

  return (
    <Panel
      className={className} delay={delay} title="جولات التسليم"
      subtitle={rounds.length ? `${n(deliveredCount)} من ${n(rounds.length)} جولة تم تسليمها` : 'سجّلي كل مرة بتسلّمي فيها للعميل'}
      action={(
        <button type="button" onClick={add} className="btn-primary inline-flex items-center gap-1.5">
          <PlusIcon className="h-4 w-4" />جولة
        </button>
      )}
    >
      {rounds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 px-4 py-9 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><LayersIcon className="h-6 w-6" /></span>
          <p className="font-bold">لسه مفيش جولات</p>
          <p className="max-w-sm text-sm leading-relaxed text-neutral-400">
            العطاء ممكن يتسلّم أكتر من مرة: عرض أولي، رد على استفسارات، عرض معدّل. ضيفي كل مرة كجولة، وعلّمي عليها «تم التسليم» لما تتسلّم.
          </p>
          <button type="button" onClick={add} className="btn-primary">إضافة أول جولة</button>
        </div>
      ) : (
        <>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          </div>

          <ol className="relative space-y-4 ps-10 before:absolute before:inset-y-4 before:start-[15px] before:w-0.5 before:rounded-full before:bg-neutral-100">
            {rounds.map((r, i) => (
              <li key={r.id} className="relative animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <button
                  type="button" onClick={() => toggle(r)} aria-pressed={!!r.delivered}
                  aria-label={r.delivered ? 'إلغاء تعليم الجولة كمسلّمة' : 'تعليم الجولة كمسلّمة'}
                  className={`absolute -start-10 top-3 grid h-8 w-8 place-items-center rounded-full ring-2 transition-all duration-500 motion-reduce:transition-none ${r.delivered ? 'scale-110 bg-brand-600 text-white ring-brand-200' : 'bg-white text-neutral-400 ring-neutral-200 hover:ring-brand-300'}`}
                >
                  {r.delivered ? <TickIcon className="h-4 w-4" /> : <span className="text-xs font-extrabold">{n(i + 1)}</span>}
                </button>

                <div className={`rounded-2xl border p-3.5 transition duration-300 ${r.delivered ? 'border-brand-200 bg-brand-50/50' : 'border-neutral-100 bg-white hover:border-brand-200'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      key={`${r.id}t`} className="input min-w-0 flex-1 basis-40 font-bold" defaultValue={r.title} aria-label="اسم الجولة"
                      onBlur={(e) => e.target.value !== r.title && patch(r.id, (x) => { x.title = e.target.value; })}
                    />
                    <input
                      type="date" className="input w-auto" value={r.date || ''} aria-label="تاريخ الجولة"
                      onChange={(e) => patch(r.id, (x) => { x.date = e.target.value; })}
                    />
                    <button
                      type="button" onClick={() => toggle(r)}
                      className={`rounded-xl px-3 py-2 text-sm font-bold ring-1 transition duration-300 ${r.delivered ? 'bg-brand-50 text-brand-700 ring-brand-300' : 'bg-white text-neutral-500 ring-neutral-200 hover:bg-neutral-50'}`}
                    >
                      {r.delivered ? '✓ تم التسليم' : 'تم التسليم؟'}
                    </button>
                    <button type="button" onClick={() => remove(r)} aria-label="حذف الجولة" className="grid h-9 w-9 place-items-center rounded-full text-neutral-300 transition hover:bg-brand-50 hover:text-brand-500">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    key={`${r.id}n`} className="input mt-2" defaultValue={r.note || ''} placeholder="ملحوظة على الجولة (اختياري)" aria-label="ملحوظة الجولة"
                    onBlur={(e) => e.target.value !== (r.note || '') && patch(r.id, (x) => { x.note = e.target.value; })}
                  />
                  {r.delivered && r.deliveredAt && <p className="mt-2 text-xs font-semibold text-brand-700">اتسلّمت يوم {fmt(r.deliveredAt)}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}
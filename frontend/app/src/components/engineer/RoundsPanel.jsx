import { useUI } from '../../hooks/useUI';
import Panel from '../ui/Panel';
import { LayersIcon, PlusIcon, TickIcon, TrashIcon } from './EngineerIcons';
import { n } from '../../utils/dashboardData';
import RoundTFiles from './RoundTFiles';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'لم يُحدد');

export default function RoundsPanel({ project, edit, user, delay = 0, className = '' }) {
  const { confirm } = useUI();
  const rounds = project.rounds?.length ? project.rounds : [{ id: 'round-1', title: 'الجولة 1', date: project.deliveryDate || '', delivered: false, deliveredAt: '', note: '' }];
  const active = [...rounds].reverse().find((r) => !r.delivered) || rounds[rounds.length - 1];
  const deliveredCount = rounds.filter((r) => r.delivered).length;
  const readyForNext = rounds[rounds.length - 1]?.delivered;
  const ensureRounds = (p) => { if (!p.rounds?.length) p.rounds = [{ ...rounds[0] }]; };
  const patch = (id, fn) => edit((p) => { ensureRounds(p); const round = p.rounds.find((r) => r.id === id); if (round) fn(round, p); });

  const add = () => {
    if (!readyForNext) return;
    edit((p) => {
      ensureRounds(p);
      const number = p.rounds.length + 1;
      p.rounds.push({ id: `r${Date.now().toString(36)}`, title: `الجولة ${number}`, date: '', delivered: false, deliveredAt: '', note: '' });
      p.deliveryDate = '';
      p.finished = false;
      p.outcome = null;
    });
  };

  const toggle = (r) => patch(r.id, (round, p) => {
    const delivered = !round.delivered;
    round.delivered = delivered;
    round.deliveredAt = delivered ? today() : '';
    p.finished = delivered;
    p.outcome = null;
  });

  const remove = async (r) => {
    if (r.delivered || r.id !== rounds[rounds.length - 1]?.id) return;
    const ok = await confirm({ title: 'حذف الجولة', message: `حذف «${r.title || 'الجولة'}»؟`, confirmText: 'حذف الجولة' });
    if (ok) edit((p) => { p.rounds = (p.rounds || []).filter((x) => x.id !== r.id); p.deliveryDate = p.rounds.at(-1)?.date || ''; });
  };

  return (
    <Panel className={className} delay={delay} title="جولات التسليم" subtitle={`${n(deliveredCount)} جولة اتسلّمت · ${n(rounds.length)} إجمالي الجولات`}
      action={<button type="button" onClick={add} disabled={!readyForNext} title={!readyForNext ? 'سلّمي الجولة الحالية أولًا' : 'فتح جولة تسليم جديدة'} className="btn-primary inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-45"><PlusIcon className="h-4 w-4" />جولة جديدة</button>}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-brand-50 to-white p-4 ring-1 ring-brand-100">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"><LayersIcon className="h-5 w-5" /></span><div><p className="text-xs font-semibold text-neutral-500">الجولة النشطة</p><p className="font-extrabold text-brand-900">{active?.title || `الجولة ${rounds.length}`}</p></div></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${active?.delivered ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-neutral-50 text-neutral-600 ring-neutral-200'}`}>{active?.delivered ? 'اكتمل التسليم' : 'بانتظار التسليم'}</span>
      </div>
      {!readyForNext && <p className="mb-4 text-xs leading-5 text-neutral-500">يمكن فتح جولة جديدة بعد تسجيل تسليم الجولة الحالية للعميل.</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {rounds.map((r, i) => {
          const isActive = r.id === active?.id;
          return <article key={r.id} className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5 ${r.delivered ? 'border-brand-200 bg-brand-50/40' : isActive ? 'border-brand-200 bg-white' : 'border-neutral-200 bg-neutral-50/50'}`}>
            <div className={`absolute inset-x-0 top-0 h-1.5 ${r.delivered || isActive ? 'bg-brand-600' : 'bg-neutral-200'}`} />
            <div className="flex items-start justify-between gap-2 pt-1">
              <div className="flex min-w-0 items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${r.delivered ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'}`}>{r.delivered ? <TickIcon className="h-4 w-4" /> : n(i + 1)}</span><div className="min-w-0"><input key={`${r.id}title`} className="w-full min-w-0 bg-transparent font-extrabold text-neutral-800 outline-none" defaultValue={r.title || `الجولة ${i + 1}`} aria-label="اسم الجولة" onBlur={(e) => e.target.value !== r.title && patch(r.id, (x) => { x.title = e.target.value; })} /><p className="text-xs text-neutral-500">{r.delivered ? `تاريخ التسليم: ${fmt(r.deliveredAt || r.date)}` : isActive ? 'جولة التسليم الحالية' : 'جولة قادمة'}</p></div></div>
              {!r.delivered && i === rounds.length - 1 && <button type="button" onClick={() => remove(r)} aria-label="حذف الجولة" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button>}
            </div>
            <label className="mt-4 block text-xs font-bold text-neutral-600">موعد التسليم المتوقع<input type="date" className="input mt-1.5" value={r.date || ''} onChange={(e) => patch(r.id, (x, p) => { x.date = e.target.value; if (isActive) p.deliveryDate = e.target.value; })} /></label>
            <input key={`${r.id}note`} className="input mt-2" defaultValue={r.note || ''} placeholder="ملاحظة عن تسليم الجولة (اختياري)" aria-label="ملاحظة الجولة" onBlur={(e) => e.target.value !== (r.note || '') && patch(r.id, (x) => { x.note = e.target.value; })} />
            <button type="button" onClick={() => toggle(r)} disabled={!r.delivered && !r.date} title={!r.delivered && !r.date ? 'حددي موعد التسليم أولًا' : ''} className={`mt-3 w-full rounded-xl px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45 ${r.delivered ? 'bg-brand-100 text-brand-800 hover:bg-brand-200' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>{r.delivered ? '✓ تم التسليم للعميل' : 'تسجيل تسليم الجولة'}</button>
            <RoundTFiles project={project} round={r} user={user} />
          </article>;
        })}
      </div>
    </Panel>
  );
}

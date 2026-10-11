import { useEffect, useState } from 'react';
import { useData } from '../../hooks/useData';
import { useUI } from '../../hooks/useUI';
import ProgressRing from '../ui/ProgressRing';
import Panel from '../ui/Panel';
import FormModal from '../ui/FormModal';
import TaskItem from '../TaskItem';
import FilesPanel from '../FilesPanel';
import RoundsPanel from './RoundsPanel';
import { PlusIcon, TrashIcon } from './EngineerIcons';
import { toneChip } from '../../utils/dates';
import { hasrStatusForProject } from '../../utils/helpers';
import { projectStats } from '../../utils/stats';
import { STATES, n, stateOf, daysLeft } from '../../utils/dashboardData';
import TaskListCard from './TaskListCard';
const FLOW = [
  ['running', 'جاري', 'قيد العمل حاليًا'],
  ['pending', 'تم التسليم', 'بانتظار نتيجة العميل'],
  ['won', 'فوز', 'العطاء رسا علينا'],
  ['lost', 'خسارة', 'العطاء راح لمنافس'],
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'لم يُحدد');
const whenText = (k) => (k === null ? '' : k < 0 ? `متأخر ${n(-k)} يوم` : k === 0 ? 'اليوم' : k === 1 ? 'غدًا' : `بعد ${n(k)} يوم`);
const whenTone = (k) => (k === null ? '' : k < 0 ? 'bg-brand-50 text-brand-600 ring-brand-200' : k <= 3 ? 'bg-brand-50 text-brand-600 ring-brand-200' : 'bg-neutral-50 text-neutral-500 ring-neutral-200');

const FILTERS = [
  ['all', 'الكل', () => true],
  ['todo', 'المتبقي', (x) => x.app && !x.state.status],
  ['done', 'المنجز', (x) => x.app && x.state.status],
  ['na', 'غير منطبق', (x) => !x.app],
];

export default function ProjectWorkspace({ project, edit, user, onArchive }) {
  const { teams, tasks, hasr, fieldLabel, outcomeLabel } = useData();
  const { confirm } = useUI();
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const s = projectStats(project, tasks);
  const hs = hasrStatusForProject(project.id, teams.find((t) => t.type === 'hasr'), hasr);
  const st = stateOf(project);
  const kDelivery = daysLeft(project.deliveryDate);
  const kInquiry = daysLeft(project.inquiryDate);

  const setState = (k) => edit((p) => {
    p.finished = k !== 'running';
    p.outcome = k === 'won' || k === 'lost' ? k : null;
  });
  const flowLabel = (k, l) => (k === 'won' || k === 'lost' ? outcomeLabel(k, l) : l);

  /* ---------- المهام (قياسية + مخصصة) ---------- */
  const items = [
    ...tasks.map((t) => ({ key: project.id + t.id, number: t.id, title: t.title, desc: t.desc, state: project.tasks[t.id], t })),
    ...project.customTasks.map((c, i) => ({ key: c.id, custom: true, number: tasks.length + i + 1, title: c.title, desc: c.desc, state: c, c })),
  ].map((x) => ({ ...x, app: !!x.state?.applicable }));
  const active = FILTERS.find(([k]) => k === filter);
  const shown = items.filter(active[2]);

  const deleteCustom = async (c) => {
    if (await confirm({ title: '🗑 حذف المهمة', message: `حذف "${c.title}" نهائيًا من المشروع؟`, confirmText: 'حذف المهمة' })) {
      edit((p) => { p.customTasks = p.customTasks.filter((x) => x.id !== c.id); });
    }
  };

  return (
    <div className="space-y-5">
      {/* حالة الحصر */}
      {hs && (
        <div className={`flex items-start gap-3 rounded-2xl p-4 ring-1 animate-rise ${toneChip[hs.tone]}`}>
          <div className="text-2xl">{hs.icon}</div>
          <div className="min-w-0">
            <div className="text-xs font-bold opacity-70">حالة الحصر · {project.name || 'هذا المشروع'}</div>
            <div className="font-extrabold">{hs.text}</div>
            {hs.notes && <div className="mt-1 text-sm opacity-80">📝 ملاحظة من قسم الحصر: {hs.notes}</div>}
          </div>
        </div>
      )}

      {/* ===== بيانات المشروع + المسار ===== */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="card p-4 animate-rise sm:p-5 lg:col-span-8" style={{ animationDelay: '40ms' }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">اسم المشروع</label>
              <input key={`${project.id}n`} className="input" defaultValue={project.name} placeholder="اكتبي اسم المشروع"
                onBlur={(e) => e.target.value !== project.name && edit((p) => { p.name = e.target.value; })} />
            </div>
            <div>
              <label className="label">تاريخ التسليم</label>
              <input type="date" className="input" value={project.deliveryDate || ''} onChange={(e) => edit((p) => { p.deliveryDate = e.target.value; })} />
            </div>
            <div>
              <label className="label">تاريخ الاستفسارات</label>
              <input type="date" className="input" value={project.inquiryDate || ''} onChange={(e) => edit((p) => { p.inquiryDate = e.target.value; })} />
            </div>
          </div>

          <div className="mt-5 border-t border-neutral-100 pt-4">
            <span className="label">وضع المشروع</span>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="وضع المشروع">
              {FLOW.map(([k, l, hint]) => {
                const on = st === k;
                return (
                  <button
                    key={k} type="button" role="radio" aria-checked={on} onClick={() => setState(k)}
                    className={`rounded-xl p-3 text-start ring-1 transition duration-300 motion-reduce:transition-none ${on ? `${STATES[k].pill} ring-2 -translate-y-0.5 shadow-soft` : 'bg-white text-neutral-500 ring-neutral-200 hover:-translate-y-0.5 hover:bg-neutral-50'}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-extrabold">
                      <span className="h-2.5 w-2.5 rounded-full transition-transform duration-300" style={{ background: STATES[k].color, transform: on ? 'scale(1.3)' : 'scale(1)' }} />
                      {flowLabel(k, l)}
                    </span>
                    <span className="mt-1 block text-xs font-semibold opacity-70">{hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" className="btn-danger inline-flex items-center gap-1.5" onClick={onArchive}>
              <TrashIcon className="h-4 w-4" />حذف / أرشفة المشروع
            </button>
          </div>
        </section>

        <aside className="grid content-start gap-5 lg:col-span-4">
          <div className="card flex items-center justify-center gap-5 p-5 animate-rise" style={{ animationDelay: '100ms' }}>
            <ProgressRing pct={s.pct} size={104} stroke={10} />
            <div className="text-sm">
              <b className="block text-2xl tabular-nums">{n(s.done)}/{n(s.total)}</b>
              <span className="text-neutral-500">مهمة منجزة</span>
              <span className="mt-0.5 block text-xs text-neutral-400">متبقي {n(s.remaining)}</span>
            </div>
          </div>

          <div className="card space-y-3 p-5 animate-rise" style={{ animationDelay: '160ms' }}>
            {[
              ['التسليم', project.deliveryDate, kDelivery, project.finished ? ['تم التسليم', 'bg-brand-50 text-brand-700 ring-brand-200'] : null],
              ['الاستفسارات', project.inquiryDate, kInquiry, kInquiry !== null && kInquiry < 0 ? ['انتهت', 'bg-neutral-50 text-neutral-400 ring-neutral-200'] : null],
            ].map(([label, date, k, override]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-400">{label}</p>
                  <p className="truncate text-sm font-extrabold">{fmtDate(date)}</p>
                </div>
                {(override || k !== null) && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${override ? override[1] : whenTone(k)}`}>{override ? override[0] : whenText(k)}</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ===== الملحوظات + الجولات ===== */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-5" delay={80} title="ملحوظات المشروع" subtitle="أي معلومة مهمة الفريق لازم يعرفها عن العطاء">
          <textarea
            key={`${project.id}note`} className="input min-h-[10rem] resize-y leading-relaxed" defaultValue={project.note || ''}
            placeholder="مثال: العميل طلب تمديد، أو في اشتراط خاص في الكراسة…" aria-label="ملحوظات المشروع"
            onBlur={(e) => e.target.value !== (project.note || '') && edit((p) => { p.note = e.target.value; })}
          />
          <p className="mt-2 text-xs text-neutral-400">بتتحفظ تلقائيًا أول ما تخرجي من الخانة، وبعدها اضغطي «حفظ الآن».</p>
        </Panel>
        <RoundsPanel className="lg:col-span-7" delay={120} project={project} edit={edit} />
      </div>

      {/* ===== الملفات ===== */}
      <div className="animate-rise" style={{ animationDelay: '60ms' }}><FilesPanel project={project} user={user} /></div>

      {/* ===== المهام ===== */}
      {/* <section className="card p-4 animate-rise sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">قائمة المهام</h2>
            <p className="text-sm text-neutral-400">{n(s.done)} منجزة من {n(s.total)} · إجمالي البنود {n(items.length)}</p>
          </div>
          <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={() => setModal('task')}>
            <PlusIcon className="h-4 w-4" />إضافة مهمة
          </button>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-gradient-to-l from-brand-300 to-brand-600 transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${ready ? s.pct : 0}%` }} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="فلتر المهام">
          {FILTERS.map(([k, l, fn]) => {
            const on = filter === k;
            return (
              <button
                key={k} type="button" aria-pressed={on} onClick={() => setFilter(k)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition duration-300 ${on ? 'bg-brand-600 text-white shadow-soft ring-brand-600' : 'bg-white text-neutral-500 ring-neutral-200 hover:bg-brand-50 hover:text-brand-800'}`}
              >
                {l}
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-neutral-100 text-neutral-400'}`}>{n(items.filter(fn).length)}</span>
              </button>
            );
          })}
        </div>
      </section> */}
      <TaskListCard project={project} edit={edit} />

      <div className="space-y-3">
        {shown.length === 0 && <p className="card py-10 text-center text-sm text-neutral-400">مفيش مهام في الفلتر ده</p>}
        {shown.map((x) => (x.custom ? (
          <TaskItem key={x.key} custom number={x.number} title={x.title} desc={x.desc} state={x.state}
            label={(id, fb) => fieldLabel('customTask', id, fb)}
            onChange={(f, v) => edit((p) => { p.customTasks.find((y) => y.id === x.c.id)[f] = v; })}
            onDelete={() => deleteCustom(x.c)} />
        ) : (
          <TaskItem key={x.key} number={x.number} title={x.title} desc={x.desc} state={x.state}
            label={(id, fb) => fieldLabel('task', id, fb)}
            onChange={(f, v) => edit((p) => { p.tasks[x.t.id][f] = v; })} />
        )))}
      </div>

      {modal === 'task' && (
        <FormModal title="📝 إضافة مهمة جديدة" submitText="إضافة المهمة" onClose={() => setModal(null)}
          fields={[{ name: 'title', label: 'عنوان المهمة', required: true }, { name: 'desc', label: 'وصف مختصر (اختياري)' }]}
          onSubmit={(v) => edit((p) => { p.customTasks.push({ id: `c${Date.now().toString(36)}`, title: v.title, desc: v.desc, status: false, review: false, applicable: true, dueDate: '', department: '', notes: '' }); })} />
      )}
    </div>
  );
}
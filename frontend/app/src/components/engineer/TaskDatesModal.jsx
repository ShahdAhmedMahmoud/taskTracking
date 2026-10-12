import { useState } from 'react';
import Modal from '../ui/Modal';
import { useData } from '../../hooks/useData';
import { taskId, taskName, isTemplateTask } from '../../utils/taskTemplates';
import { n } from '../../utils/dashboardData';

const DAY = 86400000;
const dur = (s, e) => (s && e ? Math.round((new Date(e) - new Date(s)) / DAY) + 1 : null);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const localNow = () => {
  const d = new Date();
  return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
};
const elapsedHours = (start, startTime, end, endTime) => {
  if (!start || !startTime || !end || !endTime) return null;
  const hours = (new Date(`${end}T${endTime}`) - new Date(`${start}T${startTime}`)) / 3600000;
  return Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 100) / 100 : null;
};

/** المهام المطلوبة في المشروع (قياسية متحددة + مهام القوالب) بنفس قاعدة كارت «قائمة المهام» */
export function requiredRows(project, tasks) {
  const std = tasks
    .filter((t) => project.tasks?.[taskId(t)]?.applicable)
    .map((t) => ({ key: `s:${taskId(t)}`, kind: 'std', id: taskId(t), name: taskName(t), st: project.tasks[taskId(t)] }));
  const custom = (Array.isArray(project.customTasks) ? project.customTasks : [])
    .filter((c) => isTemplateTask(c) && c.applicable !== false)
    .map((c) => ({ key: `c:${c.id}`, kind: 'custom', id: c.id, name: c.title, st: c }));
  return [...std, ...custom];
}
export const missingDates = (rows) => rows.filter((r) => !r.st.startDate || !r.st.startTime || !r.st.dueDate || !r.st.dueTime).length;

export default function TaskDatesModal({ project, edit, targetKeys = null, onClose }) {
  const { tasks } = useData();
  const rows = requiredRows(project, tasks).filter((row) => !targetKeys || targetKeys.includes(row.key));
  const [draft, setDraft] = useState(() => Object.fromEntries(rows.map((r) => {
    const now = localNow();
    return [r.key, { start: r.st.startDate || now.date, startTime: r.st.startTime || now.time, end: r.st.dueDate || '', time: r.st.dueTime || '' }];
  })));

  const set = (key, field, value) => setDraft((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));
  const pStart = project.startDate || '';
  const pEnd = project.deliveryDate || '';

  const fillAll = () => setDraft((d) => Object.fromEntries(rows.map((r) => [r.key, {
    ...d[r.key], start: d[r.key].start || pStart, end: d[r.key].end || pEnd,
  }])));

  const bad = (r) => { const d = draft[r.key]; return d.start && d.startTime && d.end && d.time && new Date(`${d.end}T${d.time}`) < new Date(`${d.start}T${d.startTime}`); };
  const complete = rows.length > 0 && rows.every((r) => draft[r.key].start && draft[r.key].startTime && draft[r.key].end && draft[r.key].time && !bad(r));

  const save = () => {
    edit((p) => {
      p.tasks = p.tasks || {};
      rows.forEach((r) => {
        const d = draft[r.key];
        if (r.kind === 'std') p.tasks[r.id] = { ...(p.tasks[r.id] || {}), startDate: d.start, startTime: d.startTime, dueDate: d.end, dueTime: d.time };
        else {
          const c = (p.customTasks || []).find((x) => x.id === r.id);
          if (c) { c.startDate = d.start; c.startTime = d.startTime; c.dueDate = d.end; c.dueTime = d.time; }
        }
      });
    });
    onClose();
  };

  return (
    <Modal
      title="مواعيد المهام" onClose={onClose}
      footer={(
        <div className="flex gap-3">
          <button type="button" className="btn-ghost" onClick={onClose}>لاحقًا</button>
          <button type="button" className="btn-primary flex-1" disabled={!complete} onClick={save}>حفظ المواعيد</button>
        </div>
      )}
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">اختاري المهام المطلوبة الأول، وبعدها حددي مواعيدها.</p>
      ) : (
        <>
          <p className="mb-3 text-sm leading-relaxed text-slate-500">
            بداية كل مهمة جديدة مضبوطة تلقائيًا على وقت إضافتها، وتقدري تعدلي التاريخ والوقت. مدة المهمة تُحسب من البداية حتى موعد الانتهاء.
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
            <span>المشروع: من {fmt(pStart)} إلى {fmt(pEnd)}</span>
            <button type="button" onClick={fillAll} disabled={!pStart && !pEnd} className="ms-auto rounded-lg bg-white px-3 py-1.5 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-40">
              تطبيق مدة المشروع على الفاضي
            </button>
          </div>

          <ul className="space-y-3">
            {rows.map((r) => {
              const d = draft[r.key];
              const hours = elapsedHours(d.start, d.startTime, d.end, d.time);
              const days = dur(d.start, d.end);
              const outside = (d.start && pStart && d.start < pStart) || (d.end && pEnd && d.end > pEnd);
              return (
                <li key={r.key} className={`rounded-2xl border p-3.5 transition ${bad(r) ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-extrabold">{r.name}</p>
                    {days !== null && !bad(r) && <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-200">{n(days)} {days === 1 ? 'يوم' : 'أيام'}</span>}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="block">
                      <span className="label">تاريخ البداية</span>
                      <input type="date" className="input" value={d.start} max={d.end || undefined} onChange={(e) => set(r.key, 'start', e.target.value)} />
                    </label>
                    <label className="block"><span className="label">وقت البداية</span><input type="time" className="input" value={d.startTime} onChange={(e) => set(r.key, 'startTime', e.target.value)} /></label>
                    <label className="block">
                      <span className="label">تاريخ النهاية</span>
                      <input type="date" className="input" value={d.end} min={d.start || undefined} onChange={(e) => set(r.key, 'end', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="label">وقت الانتهاء</span>
                      <input type="time" className="input" value={d.time} onChange={(e) => set(r.key, 'time', e.target.value)} />
                    </label>
                  </div>
                  {bad(r) && <p className="mt-2 text-xs font-bold text-rose-600">موعد الانتهاء لازم يكون بعد وقت البداية.</p>}
                  {!bad(r) && hours !== null && <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200">المدة المحسوبة: {n(hours)} ساعة</p>}
                  {!bad(r) && outside && <p className="mt-2 text-xs font-bold text-amber-600">المهمة خارج مدة المشروع.</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}

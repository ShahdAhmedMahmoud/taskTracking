import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { n } from '../../utils/dashboardData';
import { taskId } from '../../utils/taskTemplates';
import TaskTemplatePicker from './TaskTemplatePicker';

/**
 * كارت "قائمة المهام" داخل المشروع.
 * - بيعرض عدد المهام المفعّلة (applicable) من إجمالي المهام القياسية.
 * - الضغط عليه بيفتح قوائم القوالب → اختيار المهام → تطبيق.
 * - project / edit: نفس اللي بيتبعتوا لـ ProjectWorkspace (edit بيعدّل المشروع ويعمل حفظ تلقائي).
 */
export default function TaskListCard({ project, edit }) {
  const { tasks } = useData();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);

  const total = tasks.length;
  const active = tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).length;
  const pct = total ? Math.round((active / total) * 100) : 0;
  const canManage = session?.role === 'dept'; // مدير القسم بس هو اللي يعدّل/ينشئ القوالب

  const apply = ({ ids, resp, templateId, templateName }) => {
    edit((p) => {
      p.tasks = p.tasks || {};
      tasks.forEach((t) => {
        const id = taskId(t);
        const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
        if (resp[id]) next.responsible = resp[id];
        p.tasks[id] = next;
      });
      if (templateId) { p.templateId = templateId; p.templateName = templateName || ''; }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-3xl bg-white p-5 text-start shadow-sm ring-1 ring-brand-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300"
      >
        <span aria-hidden className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl transition group-hover:bg-brand-200/70" />
        <span className="relative flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M3.5 6l1.2 1.2L6.8 5M3.5 12l1.2 1.2L6.8 11M3.5 18l1.2 1.2L6.8 17" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-extrabold text-slate-800">قائمة المهام</span>
            <span className="block truncate text-xs font-semibold text-slate-400">
              {project.templateName ? `القالب: ${project.templateName}` : 'اختاري القالب والمهام المطلوبة للمشروع'}
            </span>
          </span>
          <span className="text-end">
            <span className="block text-2xl font-extrabold tabular-nums text-brand-700">{n(active)}<span className="text-sm font-bold text-slate-400"> / {n(total)}</span></span>
            <span className="block text-xs font-semibold text-slate-400">مهمة مفعّلة</span>
          </span>
        </span>
        <span className="relative mt-4 block h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </span>
        <span className="relative mt-3 flex items-center justify-between text-xs font-bold text-brand-600">
          <span>فتح القوالب واختيار المهام</span>
          <svg viewBox="0 0 20 20" className="h-4 w-4 rotate-180 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
        </span>
      </button>

      {open && <TaskTemplatePicker project={project} canManage={canManage} onApply={apply} onClose={() => setOpen(false)} />}
    </>
  );
}
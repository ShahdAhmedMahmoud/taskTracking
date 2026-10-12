


// import { useState } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { useData } from '../../hooks/useData';
// import RadialGauge from '../charts/RadialGauge';
// import { n } from '../../utils/dashboardData';
// import { taskId, taskName, isTemplateTask, joinDepts } from '../../utils/taskTemplates';
// import TaskTemplatePicker from './TaskTemplatePicker';

// /**
//  * كارت "قائمة المهام" جوه المشروع — بيحل محل عرض الـ 40 مهمة كلها.
//  * الضغط عليه بيفتح القوالب → اختيار المهام (وإنشاء مهمة جديدة) → تطبيق على المشروع.
//  * النسبة = المهام المنجزة ÷ المهام المطلوبة (اللي اتحددت من "اختيار المهام").
//  * project / edit: نفس اللي بيتبعتوا لـ ProjectWorkspace (edit بيعدّل المشروع ويعمل حفظ تلقائي).
//  */
// export default function TaskListCard({ project, edit }) {
//   const { tasks } = useData();
//   const { session } = useAuth();
//   const [open, setOpen] = useState(false);

//   const custom = (Array.isArray(project.customTasks) ? project.customTasks : []).filter(isTemplateTask);
//   const stdState = (t) => project.tasks?.[taskId(t)];
//   const activeStd = tasks.filter((t) => stdState(t)?.applicable);

//   /* ---------- الأرقام ---------- */
//   const required = activeStd.length + custom.length;                       // المهام المطلوبة
//   const done = activeStd.filter((t) => stdState(t)?.status).length         // المنجز منها
//     + custom.filter((c) => c.status).length;
//   const total = tasks.length + custom.length;                              // إجمالي القايمة
//   const pct = required ? Math.round((done / required) * 100) : 0;          // الإنجاز = المنجز ÷ المطلوب

//   const preview = [
//     ...activeStd.map((t) => ({ name: taskName(t), done: !!stdState(t)?.status })),
//     ...custom.map((c) => ({ name: c.title, done: !!c.status })),
//   ].slice(0, 4);
//   const canManage = session?.role === 'dept'; // مدير القسم بس هو اللي يعدّل/ينشئ القوالب

//   const apply = ({ ids, resp, extras, templateId, templateName }) => {
//     edit((p) => {
//       p.tasks = p.tasks || {};
//       tasks.forEach((t) => {
//         const id = taskId(t);
//         const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
//         if (Array.isArray(resp[id])) next.department = joinDepts(resp[id]); // القسم المسؤول (نص بفواصل)
//         p.tasks[id] = next;
//       });
//       // المهام الجديدة (من النافذة) = مهام مضافة يدويًا، id بيبدأ بـ x_. حالتها القديمة (منجزة/ملاحظات…) بتتحفظ
//       const old = Array.isArray(p.customTasks) ? p.customTasks : [];
//       const prev = new Map(old.filter(isTemplateTask).map((c) => [c.id, c]));
//       p.customTasks = [
//         ...old.filter((c) => !isTemplateTask(c)),
//         ...extras.map((e) => ({
//           desc: '', status: false, review: false, applicable: true, dueDate: '', notes: '',
//           ...(prev.get(e.id) || {}),
//           id: e.id, title: e.name, department: joinDepts(e.departments),
//         })),
//       ];
//       if (templateId) { p.templateId = templateId; p.templateName = templateName || ''; }
//     });
//   };

//   return (
//     <>
//       <button
//         type="button"
//         onClick={() => setOpen(true)}
//         className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-brand-50/60 to-brand-100/50 p-5 text-start shadow-sm ring-1 ring-brand-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300 sm:p-6"
//       >
//         <span aria-hidden className="pointer-events-none absolute -end-12 -top-12 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl transition group-hover:bg-brand-300/60" />
//         <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[.035]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

//         <span className="relative flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-6">
//           <RadialGauge value={pct} size={92} stroke={9} color="#414A9B" trackColor="#E4E6F5" label="" />

//           <span className="min-w-0 flex-1 basis-48">
//             <span className="flex flex-wrap items-center gap-2">
//               <span className="text-lg font-extrabold text-brand-900">قائمة المهام</span>
//               {project.templateName && <span className="max-w-full truncate rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">{project.templateName}</span>}
//             </span>

//             <span className="mt-1 block text-sm font-semibold text-slate-500">
//               {required ? (
//                 <>
//                   <span className="text-xl font-extrabold tabular-nums text-brand-700">{n(done)}</span> من {n(required)} مهمة منجزة
//                 </>
//               ) : 'لم تُحدَّد مهام مطلوبة بعد'}
//             </span>
//             {required > 0 && (
//               <span className="mt-0.5 block text-xs font-semibold text-slate-400">{n(required)} مهمة مطلوبة من {n(total)}</span>
//             )}

//             {preview.length > 0 ? (
//               <span className="mt-2.5 flex flex-wrap gap-1.5">
//                 {preview.map((p, i) => (
//                   <span
//                     key={`${p.name}-${i}`}
//                     className={`max-w-[12rem] truncate rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold ring-1 ring-slate-200 ${p.done ? 'text-slate-400 line-through' : 'text-slate-600'}`}
//                   >
//                     {p.name}
//                   </span>
//                 ))}
//                 {required > preview.length && <span className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-extrabold text-brand-700">+{n(required - preview.length)}</span>}
//               </span>
//             ) : (
//               <span className="mt-2 block text-xs font-semibold text-slate-400">لسه ما اخترتيش مهام للمشروع ده</span>
//             )}
//           </span>

//           <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition group-hover:bg-brand-700 sm:w-auto">
//             اختيار المهام
//             <svg viewBox="0 0 24 24" className="h-4 w-4 rotate-180 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
//           </span>
//         </span>
//       </button>

//       {open && <TaskTemplatePicker project={project} canManage={canManage} onApply={apply} onClose={() => setOpen(false)} />}
//     </>
//   );
// }


import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import RadialGauge from '../charts/RadialGauge';
import { n } from '../../utils/dashboardData';
import { taskId, taskName, isTemplateTask, joinDepts } from '../../utils/taskTemplates';
import TaskTemplatePicker from './TaskTemplatePicker';
import TaskDatesModal, { requiredRows, missingDates } from './TaskDatesModal';

/**
 * كارت "قائمة المهام" جوه المشروع.
 * الضغط عليه بيفتح القوالب → اختيار المهام → تطبيق → (جديد) نافذة تحديد تاريخ بداية ونهاية لكل مهمة.
 * النسبة = المهام المنجزة ÷ المهام المطلوبة.
 */
export default function TaskListCard({ project, edit }) {
  const { tasks } = useData();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [datesTargetKeys, setDatesTargetKeys] = useState(null);

  const custom = (Array.isArray(project.customTasks) ? project.customTasks : []).filter(isTemplateTask);
  const stdState = (t) => project.tasks?.[taskId(t)];
  const activeStd = tasks.filter((t) => stdState(t)?.applicable);

  /* ---------- الأرقام ---------- */
  const required = activeStd.length + custom.length;
  const done = activeStd.filter((t) => stdState(t)?.status).length + custom.filter((c) => c.status).length;
  const total = tasks.length + custom.length;
  const pct = required ? Math.round((done / required) * 100) : 0;
  const missing = missingDates(requiredRows(project, tasks)); // مهام مطلوبة من غير مواعيد

  const preview = [
    ...activeStd.map((t) => ({ name: taskName(t), done: !!stdState(t)?.status })),
    ...custom.map((c) => ({ name: c.title, done: !!c.status })),
  ].slice(0, 4);
  const canManage = session?.role === 'dept';

  const apply = ({ ids, resp, extras, templateId, templateName }) => {
    const existingKeys = new Set(requiredRows(project, tasks).map((row) => row.key));
    const extraIds = new Set(extras.map((item) => item.id));
    const newlySelected = [...ids]
      .map((id) => extraIds.has(id) ? `c:${id}` : `s:${id}`)
      .filter((key) => !existingKeys.has(key));
    edit((p) => {
      p.tasks = p.tasks || {};
      tasks.forEach((t) => {
        const id = taskId(t);
        const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
        if (Array.isArray(resp[id])) next.department = joinDepts(resp[id]);
        p.tasks[id] = next;
      });
      const old = Array.isArray(p.customTasks) ? p.customTasks : [];
      const prev = new Map(old.filter(isTemplateTask).map((c) => [c.id, c]));
      p.customTasks = [
        ...old.filter((c) => !isTemplateTask(c)),
        ...extras.map((e) => ({
          desc: '', status: false, review: false, applicable: true, dueDate: '', startDate: '', notes: '',
          ...(prev.get(e.id) || {}),
          id: e.id, title: e.name, department: joinDepts(e.departments),
        })),
      ];
      if (templateId) { p.templateId = templateId; p.templateName = templateName || ''; }
    });
    setOpen(false);
    if (newlySelected.length) {
      setDatesTargetKeys(newlySelected);
      setDatesOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-brand-50/60 to-brand-100/50 p-5 text-start shadow-sm ring-1 ring-brand-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300 sm:p-6"
      >
        <span aria-hidden className="pointer-events-none absolute -end-12 -top-12 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl transition group-hover:bg-brand-300/60" />
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[.035]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <span className="relative flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-6">
          <RadialGauge value={pct} size={92} stroke={9} color="#414A9B" trackColor="#E4E6F5" label="" />

          <span className="min-w-0 flex-1 basis-48">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-extrabold text-brand-900">قائمة المهام</span>
              {project.templateName && <span className="max-w-full truncate rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">{project.templateName}</span>}
            </span>

            <span className="mt-1 block text-sm font-semibold text-slate-500">
              {required ? (
                <>
                  <span className="text-xl font-extrabold tabular-nums text-brand-700">{n(done)}</span> من {n(required)} مهمة منجزة
                </>
              ) : 'لم تُحدَّد مهام مطلوبة بعد'}
            </span>
            {required > 0 && (
              <span className="mt-0.5 block text-xs font-semibold text-slate-400">{n(required)} مهمة مطلوبة من {n(total)}</span>
            )}

            {preview.length > 0 ? (
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                {preview.map((p, i) => (
                  <span
                    key={`${p.name}-${i}`}
                    className={`max-w-[12rem] truncate rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold ring-1 ring-slate-200 ${p.done ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                  >
                    {p.name}
                  </span>
                ))}
                {required > preview.length && <span className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-extrabold text-brand-700">+{n(required - preview.length)}</span>}
              </span>
            ) : (
              <span className="mt-2 block text-xs font-semibold text-slate-400">لسه ما اخترتيش مهام للمشروع ده</span>
            )}
          </span>

          <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition group-hover:bg-brand-700 sm:w-auto">
            اختيار المهام
            <svg viewBox="0 0 24 24" className="h-4 w-4 rotate-180 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </span>
        </span>
      </button>

      {/* مواعيد المهام */}
      {required > 0 && (
        <button
          type="button" onClick={() => { setDatesTargetKeys(null); setDatesOpen(true); }}
          className={`mt-2 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold ring-1 transition duration-300 ${missing ? 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100' : 'bg-white text-slate-600 ring-slate-200 hover:bg-brand-50 hover:text-brand-800'}`}
        >
          <span>{missing ? `${n(missing)} مهمة من غير تاريخ بداية/نهاية، اضغطي لتحديدها` : 'مواعيد المهام (بداية ونهاية)'}</span>
          <span className="shrink-0 text-xs font-extrabold">{missing ? 'مطلوب' : 'عرض وتعديل'}</span>
        </button>
      )}

      {open && <TaskTemplatePicker project={project} canManage={canManage} onApply={apply} onClose={() => setOpen(false)} />}
      {datesOpen && <TaskDatesModal key={datesTargetKeys?.join('|') || 'all-task-dates'} project={project} edit={edit} targetKeys={datesTargetKeys} onClose={() => setDatesOpen(false)} />}
    </>
  );
}

// // import { useState } from 'react';
// // import { useAuth } from '../../hooks/useAuth';
// // import { useData } from '../../hooks/useData';
// // import { n } from '../../utils/dashboardData';
// // import { taskId } from '../../utils/taskTemplates';
// // import TaskTemplatePicker from './TaskTemplatePicker';

// // /**
// //  * كارت "قائمة المهام" داخل المشروع.
// //  * - بيعرض عدد المهام المفعّلة (applicable) من إجمالي المهام القياسية.
// //  * - الضغط عليه بيفتح قوائم القوالب → اختيار المهام → تطبيق.
// //  * - project / edit: نفس اللي بيتبعتوا لـ ProjectWorkspace (edit بيعدّل المشروع ويعمل حفظ تلقائي).
// //  */
// // export default function TaskListCard({ project, edit }) {
// //   const { tasks } = useData();
// //   const { session } = useAuth();
// //   const [open, setOpen] = useState(false);

// //   const total = tasks.length;
// //   const active = tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).length;
// //   const pct = total ? Math.round((active / total) * 100) : 0;
// //   const canManage = session?.role === 'dept'; // مدير القسم بس هو اللي يعدّل/ينشئ القوالب

// //   const apply = ({ ids, resp, templateId, templateName }) => {
// //     edit((p) => {
// //       p.tasks = p.tasks || {};
// //       tasks.forEach((t) => {
// //         const id = taskId(t);
// //         const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
// //         if (resp[id]) next.responsible = resp[id];
// //         p.tasks[id] = next;
// //       });
// //       if (templateId) { p.templateId = templateId; p.templateName = templateName || ''; }
// //     });
// //   };

// //   return (
// //     <>
// //       <button
// //         type="button"
// //         onClick={() => setOpen(true)}
// //         className="group relative w-full overflow-hidden rounded-3xl bg-white p-5 text-start shadow-sm ring-1 ring-brand-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300"
// //       >
// //         <span aria-hidden className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl transition group-hover:bg-brand-200/70" />
// //         <span className="relative flex items-center gap-4">
// //           <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-soft">
// //             <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M3.5 6l1.2 1.2L6.8 5M3.5 12l1.2 1.2L6.8 11M3.5 18l1.2 1.2L6.8 17" /></svg>
// //           </span>
// //           <span className="min-w-0 flex-1">
// //             <span className="block text-base font-extrabold text-slate-800">قائمة المهام</span>
// //             <span className="block truncate text-xs font-semibold text-slate-400">
// //               {project.templateName ? `القالب: ${project.templateName}` : 'اختاري القالب والمهام المطلوبة للمشروع'}
// //             </span>
// //           </span>
// //           <span className="text-end">
// //             <span className="block text-2xl font-extrabold tabular-nums text-brand-700">{n(active)}<span className="text-sm font-bold text-slate-400"> / {n(total)}</span></span>
// //             <span className="block text-xs font-semibold text-slate-400">مهمة مفعّلة</span>
// //           </span>
// //         </span>
// //         <span className="relative mt-4 block h-1.5 overflow-hidden rounded-full bg-slate-100">
// //           <span className="block h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
// //         </span>
// //         <span className="relative mt-3 flex items-center justify-between text-xs font-bold text-brand-600">
// //           <span>فتح القوالب واختيار المهام</span>
// //           <svg viewBox="0 0 20 20" className="h-4 w-4 rotate-180 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
// //         </span>
// //       </button>

// //       {open && <TaskTemplatePicker project={project} canManage={canManage} onApply={apply} onClose={() => setOpen(false)} />}
// //     </>
// //   );
// // }

// import { useState } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import { useData } from '../../hooks/useData';
// import RadialGauge from '../charts/RadialGauge';
// import { n } from '../../utils/dashboardData';
// import { taskId, taskName } from '../../utils/taskTemplates';
// import TaskTemplatePicker from './TaskTemplatePicker';

// /**
//  * كارت "قائمة المهام" جوه المشروع — بيحل محل عرض الـ 40 مهمة كلها.
//  * الضغط عليه بيفتح القوالب → اختيار المهام (وإنشاء مهمة جديدة) → تطبيق على المشروع.
//  * project / edit: نفس اللي بيتبعتوا لـ ProjectWorkspace (edit بيعدّل المشروع ويعمل حفظ تلقائي).
//  */
// export default function TaskListCard({ project, edit }) {
//   const { tasks } = useData();
//   const { session } = useAuth();
//   const [open, setOpen] = useState(false);

//   const custom = (Array.isArray(project.customTasks) ? project.customTasks : []).filter((c) => c.templateTask);
//   const activeStd = tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable);
//   const active = activeStd.length + custom.length;
//   const total = tasks.length + custom.length;
//   const pct = total ? Math.round((active / total) * 100) : 0;
//   const preview = [...activeStd.map(taskName), ...custom.map((c) => c.name)].slice(0, 4);
//   const canManage = session?.role === 'dept'; // مدير القسم بس هو اللي يعدّل/ينشئ القوالب

//   const apply = ({ ids, resp, extras, templateId, templateName }) => {
//     edit((p) => {
//       p.tasks = p.tasks || {};
//       tasks.forEach((t) => {
//         const id = taskId(t);
//         const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
//         if (resp[id]) next.responsible = resp[id];
//         p.tasks[id] = next;
//       });
//       // المهام الجديدة (من النافذة) بتتخزن كمهام مضافة يدويًا مع علامة templateTask، وحالتها القديمة بتتحفظ
//       const old = Array.isArray(p.customTasks) ? p.customTasks : [];
//       const prev = new Map(old.filter((c) => c.templateTask).map((c) => [c.id, c]));
//       p.customTasks = [
//         ...old.filter((c) => !c.templateTask),
//         ...extras.map((e) => ({ status: false, ...(prev.get(e.id) || {}), id: e.id, name: e.name, templateTask: true, responsible: e.departments })),
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
//           <RadialGauge value={pct} size={92} stroke={9} color="#4A56B5" trackColor="#E4E7F7" label="" />

//           <span className="min-w-0 flex-1 basis-48">
//             <span className="flex flex-wrap items-center gap-2">
//               <span className="text-lg font-extrabold text-brand-900">قائمة المهام</span>
//               {project.templateName && <span className="max-w-full truncate rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">{project.templateName}</span>}
//             </span>
//             <span className="mt-1 block text-sm font-semibold text-slate-500">
//               <span className="text-xl font-extrabold tabular-nums text-brand-700">{n(active)}</span> مهمة مطلوبة من {n(total)}
//             </span>
//             {preview.length > 0 ? (
//               <span className="mt-2.5 flex flex-wrap gap-1.5">
//                 {preview.map((p, i) => <span key={`${p}-${i}`} className="max-w-[12rem] truncate rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{p}</span>)}
//                 {active > preview.length && <span className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-extrabold text-brand-700">+{n(active - preview.length)}</span>}
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

/**
 * كارت "قائمة المهام" جوه المشروع — بيحل محل عرض الـ 40 مهمة كلها.
 * الضغط عليه بيفتح القوالب → اختيار المهام (وإنشاء مهمة جديدة) → تطبيق على المشروع.
 * project / edit: نفس اللي بيتبعتوا لـ ProjectWorkspace (edit بيعدّل المشروع ويعمل حفظ تلقائي).
 */
export default function TaskListCard({ project, edit }) {
  const { tasks } = useData();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);

  const custom = (Array.isArray(project.customTasks) ? project.customTasks : []).filter(isTemplateTask);
  const activeStd = tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable);
  const active = activeStd.length + custom.length;
  const total = tasks.length + custom.length;
  const pct = total ? Math.round((active / total) * 100) : 0;
  const preview = [...activeStd.map(taskName), ...custom.map((c) => c.title)].slice(0, 4);
  const canManage = session?.role === 'dept'; // مدير القسم بس هو اللي يعدّل/ينشئ القوالب

  const apply = ({ ids, resp, extras, templateId, templateName }) => {
    edit((p) => {
      p.tasks = p.tasks || {};
      tasks.forEach((t) => {
        const id = taskId(t);
        const next = { ...(p.tasks[id] || {}), applicable: ids.has(id) };
        if (Array.isArray(resp[id])) next.department = joinDepts(resp[id]); // القسم المسؤول (نص بفواصل)
        p.tasks[id] = next;
      });
      // المهام الجديدة (من النافذة) = مهام مضافة يدويًا، id بيبدأ بـ x_. حالتها القديمة (منجزة/ملاحظات…) بتتحفظ
      const old = Array.isArray(p.customTasks) ? p.customTasks : [];
      const prev = new Map(old.filter(isTemplateTask).map((c) => [c.id, c]));
      p.customTasks = [
        ...old.filter((c) => !isTemplateTask(c)),
        ...extras.map((e) => ({
          desc: '', status: false, review: false, applicable: true, dueDate: '', notes: '',
          ...(prev.get(e.id) || {}),
          id: e.id, title: e.name, department: joinDepts(e.departments),
        })),
      ];
      if (templateId) { p.templateId = templateId; p.templateName = templateName || ''; }
    });
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
          <RadialGauge value={pct} size={92} stroke={9} color="#4A56B5" trackColor="#E4E7F7" label="" />

          <span className="min-w-0 flex-1 basis-48">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-extrabold text-brand-900">قائمة المهام</span>
              {project.templateName && <span className="max-w-full truncate rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">{project.templateName}</span>}
            </span>
            <span className="mt-1 block text-sm font-semibold text-slate-500">
              <span className="text-xl font-extrabold tabular-nums text-brand-700">{n(active)}</span> مهمة مطلوبة من {n(total)}
            </span>
            {preview.length > 0 ? (
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                {preview.map((p, i) => <span key={`${p}-${i}`} className="max-w-[12rem] truncate rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{p}</span>)}
                {active > preview.length && <span className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-extrabold text-brand-700">+{n(active - preview.length)}</span>}
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

      {open && <TaskTemplatePicker project={project} canManage={canManage} onApply={apply} onClose={() => setOpen(false)} />}
    </>
  );
}
// // import { useEffect, useMemo, useState } from 'react';
// // import { createPortal } from 'react-dom';
// // import { useData } from '../../hooks/useData';
// // import { useUI } from '../../hooks/useUI';
// // import { useTaskTemplates } from '../../hooks/useTaskTemplates';
// // import MultiSelectSearch from '../ui/MultiSelectSearch';
// // import { n } from '../../utils/dashboardData';
// // import {
// //   taskId, taskName, taskDepts, resolveIds, collectDepartments, newTemplateId,
// //   sameSet, cleanResp, normAr, DEFAULT_TEMPLATE,
// // } from '../../utils/taskTemplates';

// // const CURRENT = '__current';

// // const Chip = ({ children, tone = 'brand' }) => (
// //   <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tone === 'brand' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'bg-slate-100 text-slate-500'}`}>{children}</span>
// // );

// // const Check = ({ on }) => (
// //   <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
// //     {on && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>}
// //   </span>
// // );

// // /**
// //  * نافذة اختيار قالب المهام:
// //  *  1) قايمة القوالب (مفلترة بالقسم) → 2) المهام القياسية بـ checkbox مع بحث + فلتر القسم المسؤول
// //  *  → "تطبيق على المشروع" بيرجّع { ids, resp, templateId, templateName } لـ onApply.
// //  */
// // export default function TaskTemplatePicker({ project, onApply, onClose, canManage }) {
// //   const { tasks } = useData();
// //   const { confirm } = useUI();
// //   const { templates, loading, persisted, saveTemplate, deleteTemplate } = useTaskTemplates();

// //   const [step, setStep] = useState('templates');
// //   const [active, setActive] = useState(null);
// //   const [sel, setSel] = useState(() => new Set());
// //   const [resp, setResp] = useState({});
// //   const [q, setQ] = useState('');
// //   const [deptFilter, setDeptFilter] = useState([]);
// //   const [tplFilter, setTplFilter] = useState([]);
// //   const [editing, setEditing] = useState(null);
// //   const [saveAs, setSaveAs] = useState(null);
// //   const [busy, setBusy] = useState(false);

// //   useEffect(() => {
// //     const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
// //     window.addEventListener('keydown', onKey);
// //     const prev = document.body.style.overflow;
// //     document.body.style.overflow = 'hidden';
// //     return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
// //   }, [onClose]);

// //   const allDepts = useMemo(
// //     () => collectDepartments(tasks, templates, Object.values(resp).flat()),
// //     [tasks, templates, resp],
// //   );

// //   const currentIds = useMemo(
// //     () => tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).map(taskId),
// //     [tasks, project],
// //   );
// //   const currentResp = useMemo(() => {
// //     const out = {};
// //     tasks.forEach((t) => { const r = project.tasks?.[taskId(t)]?.responsible; if (Array.isArray(r)) out[taskId(t)] = r; });
// //     return out;
// //   }, [tasks, project]);

// //   const open = (tpl) => {
// //     setActive(tpl);
// //     setSel(new Set(resolveIds(tpl, tasks)));
// //     setResp({ ...(tpl.responsible || {}) });
// //     setQ(''); setDeptFilter([]); setEditing(null); setSaveAs(null);
// //     setStep('tasks');
// //   };
// //   const openCurrent = () => open({ id: CURRENT, name: 'المهام الحالية للمشروع', departments: [], taskIds: currentIds, responsible: currentResp });

// //   const visibleTpls = templates.filter((tpl) => !tplFilter.length || (tpl.departments || []).some((d) => tplFilter.includes(d)));

// //   const term = normAr(q);
// //   const visible = tasks.filter((t) => {
// //     const depts = taskDepts(t, resp[taskId(t)]);
// //     const okText = !term || normAr(taskName(t)).includes(term) || depts.some((d) => normAr(d).includes(term));
// //     const okDept = !deptFilter.length || depts.some((d) => deptFilter.includes(d));
// //     return okText && okDept;
// //   });

// //   const toggle = (id) => setSel((prev) => { const nx = new Set(prev); if (nx.has(id)) nx.delete(id); else nx.add(id); return nx; });
// //   const setShown = (on) => setSel((prev) => {
// //     const nx = new Set(prev);
// //     visible.forEach((t) => (on ? nx.add(taskId(t)) : nx.delete(taskId(t))));
// //     return nx;
// //   });
// //   const resetToTemplate = () => { if (active) { setSel(new Set(resolveIds(active, tasks))); setResp({ ...(active.responsible || {}) }); } };

// //   const isTemplate = active && active.id !== CURRENT;
// //   const changed = isTemplate && (
// //     !sameSet(sel, new Set(resolveIds(active, tasks)))
// //     || JSON.stringify(cleanResp(resp)) !== JSON.stringify(cleanResp(active.responsible || {}))
// //   );

// //   const apply = () => {
// //     onApply({
// //       ids: sel,
// //       resp: cleanResp(resp),
// //       templateId: isTemplate ? active.id : project.templateId,
// //       templateName: isTemplate ? active.name : project.templateName,
// //     });
// //     onClose();
// //   };

// //   const updateTemplate = async () => {
// //     setBusy(true);
// //     const next = { ...active, taskIds: [...sel], responsible: cleanResp(resp) };
// //     const ok = await saveTemplate(next);
// //     setBusy(false);
// //     if (ok) setActive(next);
// //   };

// //   const createTemplate = async () => {
// //     const name = (saveAs.name || '').trim();
// //     if (!name) return;
// //     setBusy(true);
// //     const tpl = { id: newTemplateId(), name, departments: saveAs.departments, taskIds: [...sel], responsible: cleanResp(resp) };
// //     const ok = await saveTemplate(tpl);
// //     setBusy(false);
// //     if (ok) { setActive(tpl); setSaveAs(null); }
// //   };

// //   const removeTemplate = async (tpl) => {
// //     const ok = await confirm({ title: '🗑️ حذف القالب', message: `هيتحذف القالب «${tpl.name}». المشاريع اللي اتطبّق عليها مش هتتأثر.`, confirmText: 'حذف القالب' });
// //     if (ok) await deleteTemplate(tpl.id);
// //   };

// //   return createPortal(
// //     <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
// //       <div role="dialog" aria-modal="true" aria-label="قائمة المهام" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift animate-rise sm:rounded-3xl">
// //         {/* ===== Header ===== */}
// //         <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
// //           {step === 'tasks' && (
// //             <button type="button" onClick={() => setStep('templates')} aria-label="رجوع للقوالب" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700">
// //               <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
// //             </button>
// //           )}
// //           <div className="min-w-0 flex-1">
// //             <h2 className="truncate text-lg font-extrabold text-slate-800">{step === 'templates' ? 'قائمة المهام — اختاري القالب' : active?.name}</h2>
// //             <p className="text-xs font-semibold text-slate-400">
// //               {step === 'templates' ? 'القوالب مقسّمة حسب القسم' : `${n(sel.size)} من ${n(tasks.length)} مهمة مختارة للمشروع`}
// //             </p>
// //           </div>
// //           <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
// //             <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
// //           </button>
// //         </div>

// //         {/* ===== Body ===== */}
// //         <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
// //           {step === 'templates' && (
// //             <>
// //               {!persisted && (
// //                 <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700 ring-1 ring-amber-200">
// //                   حفظ القوالب لسه مش مفعّل (الـ endpoint <span dir="ltr">/api/templates</span> مش موجود). تقدري تستخدمي القالب الأساسي وتطبّقيه على المشروع، لكن القوالب الجديدة مش هتتحفظ.
// //                 </p>
// //               )}
// //               <MultiSelectSearch label="القسم" value={tplFilter} onChange={setTplFilter} options={allDepts} placeholder="فلترة القوالب بالقسم…" />

// //               <ul className="mt-4 grid gap-3 sm:grid-cols-2">
// //                 <li>
// //                   <button type="button" onClick={openCurrent} className="h-full w-full rounded-2xl border-2 border-dashed border-brand-200 p-4 text-start transition hover:-translate-y-0.5 hover:bg-brand-50/50">
// //                     <p className="text-sm font-extrabold text-brand-700">تعديل المهام الحالية</p>
// //                     <p className="mt-1 text-xs font-semibold text-slate-400">{n(currentIds.length)} مهمة مفعّلة في المشروع دلوقتي</p>
// //                   </button>
// //                 </li>
// //                 {loading && <li className="grid place-items-center rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-400">جاري تحميل القوالب…</li>}
// //                 {visibleTpls.map((tpl) => {
// //                   const count = resolveIds(tpl, tasks).length;
// //                   const applied = project.templateId === tpl.id;
// //                   return (
// //                     <li key={tpl.id} className="relative">
// //                       <button type="button" onClick={() => open(tpl)} className={`h-full w-full rounded-2xl p-4 text-start ring-1 transition hover:-translate-y-0.5 hover:shadow-soft ${applied ? 'bg-brand-50/60 ring-brand-300' : 'bg-white ring-slate-200 hover:ring-brand-200'}`}>
// //                         <p className="flex items-center gap-2 pe-7 text-sm font-extrabold text-slate-800">
// //                           <span className="truncate">{tpl.name}</span>
// //                           {applied && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">مطبّق</span>}
// //                         </p>
// //                         <p className="mt-1 text-xs font-semibold text-slate-400">{n(count)} مهمة</p>
// //                         <span className="mt-2.5 flex flex-wrap gap-1">
// //                           {(tpl.departments || []).length ? tpl.departments.map((d) => <Chip key={d}>{d}</Chip>) : <Chip tone="muted">كل الأقسام</Chip>}
// //                         </span>
// //                       </button>
// //                       {canManage && !tpl.builtIn && tpl.id !== DEFAULT_TEMPLATE.id && (
// //                         <button type="button" onClick={() => removeTemplate(tpl)} aria-label={`حذف ${tpl.name}`} className="absolute end-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600">
// //                           <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" /></svg>
// //                         </button>
// //                       )}
// //                     </li>
// //                   );
// //                 })}
// //               </ul>
// //               {!loading && visibleTpls.length === 0 && <p className="py-6 text-center text-sm text-slate-400">مفيش قوالب للقسم ده</p>}
// //             </>
// //           )}

// //           {step === 'tasks' && (
// //             <>
// //               <div className="grid gap-3 sm:grid-cols-2">
// //                 <div>
// //                   <label htmlFor="tpl-search" className="mb-1.5 block text-xs font-bold text-slate-500">بحث في المهام</label>
// //                   <input id="tpl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم المهمة أو القسم…" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
// //                 </div>
// //                 <MultiSelectSearch label="القسم المسؤول" value={deptFilter} onChange={setDeptFilter} options={allDepts} placeholder="فلترة بالقسم المسؤول…" />
// //               </div>

// //               <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
// //                 <span className="text-slate-400">{n(visible.length)} معروضة</span>
// //                 <button type="button" onClick={() => setShown(true)} className="rounded-lg px-2.5 py-1.5 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">تحديد المعروض</button>
// //                 <button type="button" onClick={() => setShown(false)} className="rounded-lg px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء المعروض</button>
// //                 <button type="button" onClick={resetToTemplate} className="rounded-lg px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">استرجاع اختيار القالب</button>
// //               </div>

// //               <ul className="mt-3 space-y-2">
// //                 {visible.map((t) => {
// //                   const id = taskId(t);
// //                   const on = sel.has(id);
// //                   const depts = taskDepts(t, resp[id]);
// //                   return (
// //                     <li key={id} className={`rounded-2xl ring-1 transition-colors ${on ? 'bg-brand-50/50 ring-brand-200' : 'bg-white ring-slate-100'}`}>
// //                       <div className="flex items-start gap-3 p-3">
// //                         <button type="button" role="checkbox" aria-checked={on} aria-label={taskName(t)} onClick={() => toggle(id)} className="mt-0.5"><Check on={on} /></button>
// //                         <span className="min-w-0 flex-1 cursor-pointer" onClick={() => toggle(id)}>
// //                           <span className="block text-sm font-bold text-slate-800">{taskName(t)}</span>
// //                           <span className="mt-1.5 flex flex-wrap gap-1">
// //                             {depts.length ? depts.map((d) => <Chip key={d}>{d}</Chip>) : <span className="text-[11px] font-semibold text-slate-300">بدون قسم مسؤول</span>}
// //                           </span>
// //                         </span>
// //                         <button type="button" aria-label="تعديل القسم المسؤول" aria-expanded={editing === id} onClick={() => setEditing(editing === id ? null : id)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${editing === id ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-brand-700'}`}>
// //                           <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" /></svg>
// //                         </button>
// //                       </div>
// //                       {editing === id && (
// //                         <div className="border-t border-brand-100 px-3 pb-3 pt-2.5">
// //                           <MultiSelectSearch
// //                             label="القسم المسؤول"
// //                             value={depts}
// //                             options={allDepts}
// //                             allowCreate
// //                             placeholder="ابحثي أو أضيفي قسم…"
// //                             onChange={(v) => setResp((r) => ({ ...r, [id]: v }))}
// //                           />
// //                         </div>
// //                       )}
// //                     </li>
// //                   );
// //                 })}
// //                 {visible.length === 0 && <li className="py-8 text-center text-sm text-slate-400">مفيش مهام مطابقة للبحث</li>}
// //               </ul>

// //               {saveAs && (
// //                 <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
// //                   <p className="mb-3 text-sm font-extrabold text-slate-700">حفظ كقالب جديد ({n(sel.size)} مهمة)</p>
// //                   <div className="grid gap-3 sm:grid-cols-2">
// //                     <div>
// //                       <label htmlFor="tpl-name" className="mb-1.5 block text-xs font-bold text-slate-500">اسم القالب</label>
// //                       <input id="tpl-name" value={saveAs.name} onChange={(e) => setSaveAs({ ...saveAs, name: e.target.value })} placeholder="مثال: قالب العقارات" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
// //                     </div>
// //                     <MultiSelectSearch label="القسم" value={saveAs.departments} onChange={(v) => setSaveAs({ ...saveAs, departments: v })} options={allDepts} allowCreate placeholder="اختاري القسم/الأقسام…" />
// //                   </div>
// //                   <div className="mt-3 flex gap-2">
// //                     <button type="button" disabled={busy || !saveAs.name.trim()} onClick={createTemplate} className="btn-primary disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ القالب'}</button>
// //                     <button type="button" onClick={() => setSaveAs(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-white">إلغاء</button>
// //                   </div>
// //                 </div>
// //               )}
// //             </>
// //           )}
// //         </div>

// //         {/* ===== Footer ===== */}
// //         {step === 'tasks' && (
// //           <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-5 py-3.5">
// //             <button type="button" onClick={apply} className="btn-primary">تطبيق على المشروع ({n(sel.size)})</button>
// //             {canManage && changed && (
// //               <button type="button" disabled={busy} onClick={updateTemplate} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ التعديل على القالب'}</button>
// //             )}
// //             {canManage && !saveAs && (
// //               <button type="button" onClick={() => setSaveAs({ name: '', departments: active?.departments || [] })} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">حفظ كقالب جديد</button>
// //             )}
// //             <span className="ms-auto text-xs font-semibold text-slate-400">{n(tasks.length - sel.size)} مهمة مش مطلوبة</span>
// //           </div>
// //         )}
// //       </div>
// //     </div>,
// //     document.body,
// //   );
// // }

// import { useEffect, useMemo, useState } from 'react';
// import { createPortal } from 'react-dom';
// import { useData } from '../../hooks/useData';
// import { useUI } from '../../hooks/useUI';
// import { useTaskTemplates } from '../../hooks/useTaskTemplates';
// import MultiSelectSearch from '../ui/MultiSelectSearch';
// import RadialGauge from '../charts/RadialGauge';
// import { n } from '../../utils/dashboardData';
// import {
//   taskId, taskName, taskDepts, resolveIds, collectDepartments, newTemplateId, newExtraId,
//   splitResp, snapshotOf, normAr, DEFAULT_TEMPLATE,
// } from '../../utils/taskTemplates';

// const CURRENT = '__current';
// const NEW = '__new';
// const ACCENTS = ['#6F7DD0', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

// const Svg = ({ d, className = 'h-4 w-4', sw = 1.8 }) => (
//   <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
// );
// const I = {
//   back: 'M9 5l7 7-7 7',
//   close: 'M6 6l12 12M18 6L6 18',
//   search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
//   edit: 'M16.5 3.5l4 4L8 20H4v-4z',
//   trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
//   plus: 'M12 5v14M5 12h14',
//   list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
//   layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
// };

// const Chip = ({ children, tone = 'brand' }) => (
//   <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tone === 'brand' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'bg-slate-100 text-slate-500'}`}>{children}</span>
// );

// const Check = ({ on }) => (
//   <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
//     {on && <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>}
//   </span>
// );

// /**
//  * نافذة "قائمة المهام":
//  *  1) قوالب مقسّمة بالقسم → 2) المهام القياسية بـ checkbox (بحث + فلتر قسم + إنشاء مهمة جديدة)
//  *  → "تطبيق على المشروع" بيرجّع { ids, resp, extras, templateId, templateName } لـ onApply.
//  * موبايل: Bottom sheet بملء الشاشة تقريبًا | ديسكتوب: نافذة واسعة في النص.
//  */
// export default function TaskTemplatePicker({ project, onApply, onClose, canManage }) {
//   const { tasks } = useData();
//   const { confirm } = useUI();
//   const { templates, loading, persisted, saveTemplate, deleteTemplate } = useTaskTemplates();

//   const [step, setStep] = useState('templates');
//   const [active, setActive] = useState(null);
//   const [sel, setSel] = useState(() => new Set());
//   const [resp, setResp] = useState({});
//   const [extra, setExtra] = useState([]);
//   const [base, setBase] = useState('');
//   const [q, setQ] = useState('');
//   const [deptFilter, setDeptFilter] = useState([]);
//   const [tplFilter, setTplFilter] = useState([]);
//   const [tf, setTf] = useState('all');
//   const [editing, setEditing] = useState(null);
//   const [draft, setDraft] = useState(null);
//   const [saveAs, setSaveAs] = useState(null);
//   const [busy, setBusy] = useState(false);

//   useEffect(() => {
//     const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
//     window.addEventListener('keydown', onKey);
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = 'hidden';
//     return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
//   }, [onClose]);

//   /* ---------- بيانات ---------- */
//   const items = useMemo(() => [
//     ...tasks.map((t) => ({ id: taskId(t), name: taskName(t), raw: t, isExtra: false })),
//     ...extra.map((e) => ({ id: e.id, name: e.name, raw: {}, isExtra: true })),
//   ], [tasks, extra]);

//   const allDepts = useMemo(() => collectDepartments(tasks, templates, Object.values(resp).flat()), [tasks, templates, resp]);
//   const depsOf = (it) => taskDepts(it.raw, resp[it.id]);

//   const currentIds = useMemo(() => tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).map(taskId), [tasks, project]);
//   const currentExtras = useMemo(() => (Array.isArray(project.customTasks) ? project.customTasks : []).filter((c) => c.templateTask).map((c) => ({ id: c.id, name: c.name, departments: c.responsible || [] })), [project]);
//   const currentResp = useMemo(() => {
//     const out = {};
//     tasks.forEach((t) => { const r = project.tasks?.[taskId(t)]?.responsible; if (Array.isArray(r)) out[taskId(t)] = r; });
//     return out;
//   }, [tasks, project]);

//   /* ---------- فتح قالب ---------- */
//   const load = (tpl, ex, ids) => {
//     const nextResp = { ...(tpl.responsible || {}) };
//     ex.forEach((e) => { nextResp[e.id] = e.departments || []; });
//     const nextExtra = ex.map((e) => ({ id: e.id, name: e.name }));
//     const nextSel = new Set([...ids, ...ex.map((e) => e.id)]);
//     setActive(tpl); setSel(nextSel); setResp(nextResp); setExtra(nextExtra);
//     setBase(snapshotOf(nextSel, nextResp, nextExtra));
//     setQ(''); setDeptFilter([]); setTf('all'); setEditing(null); setDraft(null); setSaveAs(null);
//     setStep('tasks');
//   };
//   const openTemplate = (tpl) => load(tpl, tpl.extraTasks || [], resolveIds(tpl, tasks));
//   const openCurrent = () => load({ id: CURRENT, name: 'المهام الحالية للمشروع', departments: [], responsible: currentResp }, currentExtras, currentIds);
//   const openNew = () => { load({ id: NEW, name: 'قالب جديد', departments: [], responsible: {} }, [], []); setSaveAs({ name: '', departments: [] }); };

//   const isTemplate = active && active.id !== CURRENT && active.id !== NEW;
//   const changed = isTemplate && snapshotOf(sel, resp, extra) !== base;

//   /* ---------- فلترة ---------- */
//   const term = normAr(q);
//   const visible = items.filter((it) => {
//     const d = depsOf(it);
//     const okText = !term || normAr(it.name).includes(term) || d.some((x) => normAr(x).includes(term));
//     const okDept = !deptFilter.length || d.some((x) => deptFilter.includes(x));
//     const on = sel.has(it.id);
//     return okText && okDept && (tf === 'all' || (tf === 'on' ? on : !on));
//   });
//   const visTpls = templates.filter((t) => !tplFilter.length || (t.departments || []).some((d) => tplFilter.includes(d)));

//   /* ---------- أفعال المهام ---------- */
//   const toggle = (id) => setSel((p) => { const x = new Set(p); if (x.has(id)) x.delete(id); else x.add(id); return x; });
//   const setShown = (on) => setSel((p) => { const x = new Set(p); visible.forEach((it) => (on ? x.add(it.id) : x.delete(it.id))); return x; });
//   const reset = () => {
//     if (!active) return;
//     if (active.id === CURRENT) load(active, currentExtras, currentIds);
//     else load(active, active.extraTasks || [], resolveIds(active, tasks));
//   };

//   const dupe = draft && items.some((it) => normAr(it.name) === normAr(draft.name));
//   const addTask = () => {
//     const name = draft.name.trim();
//     if (!name || dupe) return;
//     const id = newExtraId();
//     setExtra((e) => [...e, { id, name }]);
//     setResp((r) => ({ ...r, [id]: draft.departments }));
//     setSel((s) => new Set(s).add(id));
//     setDraft(null); setQ(''); setDeptFilter([]); setTf('all');
//   };
//   const removeExtra = (id) => {
//     setExtra((e) => e.filter((x) => x.id !== id));
//     setSel((s) => { const x = new Set(s); x.delete(id); return x; });
//     setResp((r) => { const x = { ...r }; delete x[id]; return x; });
//     setEditing(null);
//   };
//   const renameExtra = (id, name) => setExtra((e) => e.map((x) => (x.id === id ? { ...x, name } : x)));

//   /* ---------- تطبيق / حفظ ---------- */
//   const parts = () => splitResp(resp, extra);
//   const apply = () => {
//     const { std, extras } = parts();
//     onApply({
//       ids: sel,
//       resp: std,
//       extras: extras.filter((e) => sel.has(e.id) && e.name.trim()),
//       templateId: isTemplate ? active.id : project.templateId,
//       templateName: isTemplate ? active.name : project.templateName,
//     });
//     onClose();
//   };

//   const stdIds = () => [...sel].filter((id) => !extra.some((e) => e.id === id));
//   const updateTemplate = async () => {
//     setBusy(true);
//     const { std, extras } = parts();
//     const next = { ...active, taskIds: stdIds(), responsible: std, extraTasks: extras };
//     const ok = await saveTemplate(next);
//     setBusy(false);
//     if (ok) { setActive(next); setBase(snapshotOf(sel, resp, extra)); }
//   };
//   const createTemplate = async () => {
//     const name = (saveAs.name || '').trim();
//     if (!name) return;
//     setBusy(true);
//     const { std, extras } = parts();
//     const tpl = { id: newTemplateId(), name, departments: saveAs.departments, taskIds: stdIds(), responsible: std, extraTasks: extras };
//     const ok = await saveTemplate(tpl);
//     setBusy(false);
//     if (ok) { setActive(tpl); setBase(snapshotOf(sel, resp, extra)); setSaveAs(null); }
//   };
//   const removeTemplate = async (tpl) => {
//     const ok = await confirm({ title: '🗑️ حذف القالب', message: `هيتحذف القالب «${tpl.name}». المشاريع اللي اتطبّق عليها مش هتتأثر.`, confirmText: 'حذف القالب' });
//     if (ok) await deleteTemplate(tpl.id);
//   };

//   const pct = items.length ? Math.round((sel.size / items.length) * 100) : 0;
//   const extrasOn = extra.filter((e) => sel.has(e.id)).length;

//   return createPortal(
//     <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" aria-hidden />
//       <div dir="rtl" role="dialog" aria-modal="true" aria-label="قائمة المهام" className="relative flex h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-lift animate-rise sm:h-[88vh] sm:max-h-[54rem] sm:rounded-3xl">
//         {/* ===== Header ===== */}
//         <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-5 pb-5 pt-3 text-white sm:px-7 sm:pt-6">
//           <span aria-hidden className="pointer-events-none absolute -start-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
//           <span aria-hidden className="pointer-events-none absolute -bottom-20 end-6 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
//           <span aria-hidden className="relative mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />
//           <div className="relative flex items-center gap-3">
//             {step === 'tasks' && (
//               <button type="button" onClick={() => setStep('templates')} aria-label="رجوع للقوالب" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25">
//                 <Svg d={I.back} className="h-4 w-4" sw={2.2} />
//               </button>
//             )}
//             <div className="min-w-0 flex-1">
//               <p className="text-xs font-bold text-white/70">{step === 'templates' ? 'الخطوة ١ من ٢' : 'الخطوة ٢ من ٢'}</p>
//               <h2 className="truncate text-lg font-extrabold sm:text-2xl">{step === 'templates' ? 'قائمة المهام — اختاري القالب' : active?.name}</h2>
//               <p className="mt-0.5 truncate text-xs font-semibold text-white/75">
//                 {step === 'templates' ? 'كل قالب مخصص لقسم، وتقدري تعدّلي المهام بعد ما تفتحيه' : `${n(sel.size)} من ${n(items.length)} مهمة مختارة${extrasOn ? ` · ${n(extrasOn)} مضافة` : ''}`}
//               </p>
//             </div>
//             {step === 'tasks' && <RadialGauge value={pct} size={60} stroke={7} color="#fff" trackColor="rgba(255,255,255,.25)" textClass="text-white" label="" />}
//             <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25">
//               <Svg d={I.close} className="h-4 w-4" sw={2.2} />
//             </button>
//           </div>
//         </header>

//         {/* ===== Body ===== */}
//         <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-7 sm:py-5">
//           {step === 'templates' && (
//             <>
//               {!persisted && (
//                 <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700 ring-1 ring-amber-200">
//                   حفظ القوالب لسه مش مفعّل (الـ endpoint <span dir="ltr">/api/templates</span> مش موجود). تقدري تستخدمي القالب الأساسي وتطبّقيه على المشروع، لكن القوالب الجديدة مش هتتحفظ.
//                 </p>
//               )}
//               <MultiSelectSearch label="فلترة بالقسم" value={tplFilter} onChange={setTplFilter} options={allDepts} placeholder="كل الأقسام…" />

//               <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                 {visTpls.map((tpl, i) => {
//                   const accent = ACCENTS[i % ACCENTS.length];
//                   const count = resolveIds(tpl, tasks).length + (tpl.extraTasks || []).length;
//                   const applied = project.templateId === tpl.id;
//                   return (
//                     <li key={tpl.id} className="relative">
//                       <button type="button" onClick={() => openTemplate(tpl)} className={`group relative h-full w-full overflow-hidden rounded-2xl bg-white p-4 text-start ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-lift ${applied ? 'ring-2 ring-brand-400' : 'ring-slate-200 hover:ring-brand-300'}`}>
//                         <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
//                         <span className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-soft" style={{ background: accent }}><Svg d={I.list} className="h-5 w-5" /></span>
//                         <p className="mt-3 flex items-center gap-2 pe-6 text-sm font-extrabold text-slate-800">
//                           <span className="truncate">{tpl.name}</span>
//                           {applied && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">مطبّق</span>}
//                         </p>
//                         <p className="mt-1 text-xs font-semibold text-slate-400">{n(count)} مهمة</p>
//                         <span className="mt-3 flex flex-wrap gap-1">
//                           {(tpl.departments || []).length ? tpl.departments.map((d) => <Chip key={d}>{d}</Chip>) : <Chip tone="muted">كل الأقسام</Chip>}
//                         </span>
//                         <span className="mt-3 flex items-center gap-1 text-xs font-extrabold text-brand-600">فتح القالب <Svg d={I.back} className="h-3.5 w-3.5 rotate-180 transition group-hover:-translate-x-1" sw={2.2} /></span>
//                       </button>
//                       {canManage && tpl.id !== DEFAULT_TEMPLATE.id && !tpl.builtIn && (
//                         <button type="button" onClick={() => removeTemplate(tpl)} aria-label={`حذف ${tpl.name}`} className="absolute end-2.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"><Svg d={I.trash} className="h-3.5 w-3.5" /></button>
//                       )}
//                     </li>
//                   );
//                 })}

//                 {project.tasks && (
//                   <li>
//                     <button type="button" onClick={openCurrent} className="grid h-full min-h-[10rem] w-full place-content-center justify-items-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-4 text-center transition hover:-translate-y-1 hover:bg-brand-50/60">
//                       <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Svg d={I.edit} /></span>
//                       <span className="text-sm font-extrabold text-brand-700">تعديل المهام الحالية</span>
//                       <span className="text-xs font-semibold text-slate-400">{n(currentIds.length + currentExtras.length)} مهمة مفعّلة دلوقتي</span>
//                     </button>
//                   </li>
//                 )}
//                 {canManage && (
//                   <li>
//                     <button type="button" onClick={openNew} className="grid h-full min-h-[10rem] w-full place-content-center justify-items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-4 text-center transition hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50/60">
//                       <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><Svg d={I.plus} /></span>
//                       <span className="text-sm font-extrabold text-slate-700">قالب جديد</span>
//                       <span className="text-xs font-semibold text-slate-400">لقسم آخر في الشركة</span>
//                     </button>
//                   </li>
//                 )}
//                 {loading && <li className="grid min-h-[10rem] animate-pulse place-items-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">جاري تحميل القوالب…</li>}
//               </ul>
//               {!loading && visTpls.length === 0 && <p className="py-8 text-center text-sm text-slate-400">مفيش قوالب للقسم ده</p>}
//             </>
//           )}

//           {step === 'tasks' && (
//             <>
//               {/* أدوات */}
//               <div className="grid gap-3 sm:grid-cols-2">
//                 <div>
//                   <label htmlFor="tpl-search" className="mb-1.5 block text-xs font-bold text-slate-500">بحث في المهام</label>
//                   <div className="relative">
//                     <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-300"><Svg d={I.search} /></span>
//                     <input id="tpl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم المهمة أو القسم…" className="h-[2.75rem] w-full rounded-xl bg-white pe-3 ps-9 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
//                   </div>
//                 </div>
//                 <MultiSelectSearch label="القسم المسؤول" value={deptFilter} onChange={setDeptFilter} options={allDepts} placeholder="فلترة بالقسم المسؤول…" />
//               </div>

//               <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
//                 <div className="flex gap-1.5" role="group" aria-label="عرض">
//                   {[['all', 'الكل', items.length], ['on', 'مختارة', sel.size], ['off', 'غير مختارة', items.length - sel.size]].map(([k, l, c]) => (
//                     <button key={k} type="button" aria-pressed={tf === k} onClick={() => setTf(k)} className={`rounded-full px-3 py-1.5 ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-500 ring-slate-200 hover:ring-brand-300'}`}>{l} <span className="tabular-nums opacity-70">{n(c)}</span></button>
//                   ))}
//                 </div>
//                 <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />
//                 <button type="button" onClick={() => setShown(true)} className="rounded-lg bg-white px-2.5 py-1.5 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">تحديد المعروض</button>
//                 <button type="button" onClick={() => setShown(false)} className="rounded-lg bg-white px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء المعروض</button>
//                 {active?.id !== NEW && <button type="button" onClick={reset} className="rounded-lg bg-white px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">استرجاع الاختيار الأصلي</button>}
//               </div>

//               {/* إنشاء مهمة جديدة */}
//               {draft ? (
//                 <div className="mt-4 rounded-2xl bg-white p-4 ring-2 ring-brand-300 animate-rise">
//                   <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-brand-800"><Svg d={I.plus} className="h-4 w-4" sw={2.2} />مهمة جديدة</p>
//                   <div className="grid gap-3 sm:grid-cols-2">
//                     <div>
//                       <label htmlFor="new-task" className="mb-1.5 block text-xs font-bold text-slate-500">اسم المهمة</label>
//                       <input id="new-task" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }} placeholder="مثال: مراجعة مخططات الموقع" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
//                       {dupe && <p className="mt-1 text-xs font-semibold text-rose-600">فيه مهمة بنفس الاسم دي</p>}
//                     </div>
//                     <MultiSelectSearch label="القسم المسؤول" value={draft.departments} onChange={(v) => setDraft({ ...draft, departments: v })} options={allDepts} allowCreate placeholder="ابحثي أو أضيفي قسم…" />
//                   </div>
//                   <div className="mt-3 flex gap-2">
//                     <button type="button" disabled={!draft.name.trim() || dupe} onClick={addTask} className="btn-primary disabled:opacity-50">إضافة وتحديدها</button>
//                     <button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">إلغاء</button>
//                   </div>
//                 </div>
//               ) : (
//                 <button type="button" onClick={() => setDraft({ name: '', departments: [] })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-white/70 px-4 py-3 text-sm font-extrabold text-brand-700 transition hover:bg-brand-50">
//                   <Svg d={I.plus} sw={2.2} />إنشاء مهمة جديدة مش موجودة في القايمة
//                 </button>
//               )}

//               {/* المهام */}
//               <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
//                 {visible.map((it) => {
//                   const on = sel.has(it.id);
//                   const d = depsOf(it);
//                   const open = editing === it.id;
//                   return (
//                     <li key={it.id} className={`rounded-2xl bg-white ring-1 transition-colors ${open ? 'md:col-span-2' : ''} ${on ? 'ring-brand-300' : 'ring-slate-200'} ${on ? 'shadow-sm' : ''}`}>
//                       <div className="flex items-start gap-3 p-3">
//                         <button type="button" role="checkbox" aria-checked={on} aria-label={it.name} onClick={() => toggle(it.id)} className="mt-0.5"><Check on={on} /></button>
//                         <span className="min-w-0 flex-1 cursor-pointer" onClick={() => toggle(it.id)}>
//                           <span className="flex items-center gap-2">
//                             <span className="text-sm font-bold leading-snug text-slate-800">{it.name}</span>
//                             {it.isExtra && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">جديدة</span>}
//                           </span>
//                           <span className="mt-1.5 flex flex-wrap gap-1">
//                             {d.length ? d.map((x) => <Chip key={x}>{x}</Chip>) : <span className="text-[11px] font-semibold text-slate-300">بدون قسم مسؤول</span>}
//                           </span>
//                         </span>
//                         <button type="button" aria-label="تعديل المهمة" aria-expanded={open} onClick={() => setEditing(open ? null : it.id)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${open ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-brand-700'}`}><Svg d={I.edit} /></button>
//                       </div>
//                       {open && (
//                         <div className="grid gap-3 border-t border-brand-100 px-3 pb-3 pt-3 sm:grid-cols-2">
//                           {it.isExtra && (
//                             <div>
//                               <label htmlFor={`nm-${it.id}`} className="mb-1.5 block text-xs font-bold text-slate-500">اسم المهمة</label>
//                               <input id={`nm-${it.id}`} value={it.name} onChange={(e) => renameExtra(it.id, e.target.value)} className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
//                             </div>
//                           )}
//                           <MultiSelectSearch label="القسم المسؤول" value={d} options={allDepts} allowCreate placeholder="ابحثي أو أضيفي قسم…" onChange={(v) => setResp((r) => ({ ...r, [it.id]: v }))} />
//                           {it.isExtra && <button type="button" onClick={() => removeExtra(it.id)} className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl px-3 py-2.5 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 sm:justify-self-start"><Svg d={I.trash} className="h-3.5 w-3.5" />حذف المهمة</button>}
//                         </div>
//                       )}
//                     </li>
//                   );
//                 })}
//               </ul>
//               {visible.length === 0 && <p className="py-10 text-center text-sm text-slate-400">مفيش مهام مطابقة</p>}

//               {saveAs && (
//                 <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
//                   <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700"><Svg d={I.layers} />حفظ كقالب جديد ({n(sel.size)} مهمة)</p>
//                   <div className="grid gap-3 sm:grid-cols-2">
//                     <div>
//                       <label htmlFor="tpl-name" className="mb-1.5 block text-xs font-bold text-slate-500">اسم القالب</label>
//                       <input id="tpl-name" value={saveAs.name} onChange={(e) => setSaveAs({ ...saveAs, name: e.target.value })} placeholder="مثال: قالب العقارات" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
//                     </div>
//                     <MultiSelectSearch label="القسم" value={saveAs.departments} onChange={(v) => setSaveAs({ ...saveAs, departments: v })} options={allDepts} allowCreate placeholder="اختاري القسم/الأقسام…" />
//                   </div>
//                   <div className="mt-3 flex gap-2">
//                     <button type="button" disabled={busy || !saveAs.name.trim()} onClick={createTemplate} className="btn-primary disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ القالب'}</button>
//                     <button type="button" onClick={() => setSaveAs(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-white">إلغاء</button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* ===== Footer ===== */}
//         {step === 'tasks' && (
//           <footer className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-7">
//             <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
//               <p className="text-xs font-bold text-slate-400 sm:me-auto">{n(sel.size)} مختارة · {n(items.length - sel.size)} مش مطلوبة</p>
//               <div className="flex flex-wrap gap-2">
//                 {canManage && changed && <button type="button" disabled={busy} onClick={updateTemplate} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ التعديل على القالب'}</button>}
//                 {canManage && !saveAs && <button type="button" onClick={() => setSaveAs({ name: '', departments: active?.departments || [] })} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">حفظ كقالب جديد</button>}
//                 <button type="button" onClick={apply} disabled={!sel.size} className="btn-primary flex-1 disabled:opacity-50 sm:flex-none">تطبيق على المشروع ({n(sel.size)})</button>
//               </div>
//             </div>
//           </footer>
//         )}
//       </div>
//     </div>,
//     document.body,
//   );
// }


import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../hooks/useData';
import { useUI } from '../../hooks/useUI';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import MultiSelectSearch from '../ui/MultiSelectSearch';
import RadialGauge from '../charts/RadialGauge';
import { n } from '../../utils/dashboardData';
import {
  taskId, taskName, taskDepts, resolveIds, collectDepartments, newTemplateId, newExtraId,
  splitResp, snapshotOf, normAr, splitDepts, isTemplateTask, DEFAULT_TEMPLATE,
} from '../../utils/taskTemplates';

const CURRENT = '__current';
const NEW = '__new';
const ACCENTS = ['#6F7DD0', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

const Svg = ({ d, className = 'h-4 w-4', sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const I = {
  back: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  edit: 'M16.5 3.5l4 4L8 20H4v-4z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  plus: 'M12 5v14M5 12h14',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
};

const Chip = ({ children, tone = 'brand' }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tone === 'brand' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'bg-slate-100 text-slate-500'}`}>{children}</span>
);

const Check = ({ on }) => (
  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
    {on && <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>}
  </span>
);

/**
 * نافذة "قائمة المهام":
 *  1) قوالب مقسّمة بالقسم → 2) المهام القياسية بـ checkbox (بحث + فلتر قسم + إنشاء مهمة جديدة)
 *  → "تطبيق على المشروع" بيرجّع { ids, resp, extras, templateId, templateName } لـ onApply.
 * موبايل: Bottom sheet بملء الشاشة تقريبًا | ديسكتوب: نافذة واسعة في النص.
 */
export default function TaskTemplatePicker({ project, onApply, onClose, canManage }) {
  const { tasks } = useData();
  const { confirm } = useUI();
  const { templates, loading, persisted, saveTemplate, deleteTemplate } = useTaskTemplates();

  const [step, setStep] = useState('templates');
  const [active, setActive] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [resp, setResp] = useState({});
  const [extra, setExtra] = useState([]);
  const [base, setBase] = useState('');
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState([]);
  const [tplFilter, setTplFilter] = useState([]);
  const [tf, setTf] = useState('all');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saveAs, setSaveAs] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  /* ---------- بيانات ---------- */
  const items = useMemo(() => [
    ...tasks.map((t) => ({ id: taskId(t), name: taskName(t), raw: t, isExtra: false })),
    ...extra.map((e) => ({ id: e.id, name: e.name, raw: {}, isExtra: true })),
  ], [tasks, extra]);

  const allDepts = useMemo(() => collectDepartments(tasks, templates, Object.values(resp).flat()), [tasks, templates, resp]);
  const depsOf = (it) => taskDepts(it.raw, resp[it.id]);

  const currentIds = useMemo(() => tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).map(taskId), [tasks, project]);
  const currentExtras = useMemo(() => (Array.isArray(project.customTasks) ? project.customTasks : []).filter(isTemplateTask).map((c) => ({ id: c.id, name: c.title, departments: splitDepts(c.department) })), [project]);
  const currentResp = useMemo(() => {
    // القسم المسؤول المحفوظ على كل مهمة في المشروع (حقل department كنص بفواصل)
    const out = {};
    tasks.forEach((t) => { const d = splitDepts(project.tasks?.[taskId(t)]?.department); if (d.length) out[taskId(t)] = d; });
    return out;
  }, [tasks, project]);

  /* ---------- فتح قالب ---------- */
  const load = (tpl, ex, ids) => {
    const nextResp = { ...(tpl.responsible || {}) };
    ex.forEach((e) => { nextResp[e.id] = e.departments || []; });
    const nextExtra = ex.map((e) => ({ id: e.id, name: e.name }));
    const nextSel = new Set([...ids, ...ex.map((e) => e.id)]);
    setActive(tpl); setSel(nextSel); setResp(nextResp); setExtra(nextExtra);
    setBase(snapshotOf(nextSel, nextResp, nextExtra));
    setQ(''); setDeptFilter([]); setTf('all'); setEditing(null); setDraft(null); setSaveAs(null);
    setStep('tasks');
  };
  const openTemplate = (tpl) => load(tpl, tpl.extraTasks || [], tpl.id === DEFAULT_TEMPLATE.id ? currentIds : resolveIds(tpl, tasks));
  const openCurrent = () => load({ id: CURRENT, name: 'المهام الحالية للمشروع', departments: [], responsible: currentResp }, currentExtras, currentIds);
  const openNew = () => { load({ id: NEW, name: 'قالب جديد', departments: [], responsible: {} }, [], []); setSaveAs({ name: '', departments: [] }); };

  const isTemplate = active && active.id !== CURRENT && active.id !== NEW;
  const changed = isTemplate && snapshotOf(sel, resp, extra) !== base;

  /* ---------- فلترة ---------- */
  const term = normAr(q);
  const visible = items.filter((it) => {
    const d = depsOf(it);
    const okText = !term || normAr(it.name).includes(term) || d.some((x) => normAr(x).includes(term));
    const okDept = !deptFilter.length || d.some((x) => deptFilter.includes(x));
    const on = sel.has(it.id);
    return okText && okDept && (tf === 'all' || (tf === 'on' ? on : !on));
  });
  const visTpls = templates.filter((t) => t.id === DEFAULT_TEMPLATE.id && (!tplFilter.length || (t.departments || []).some((d) => tplFilter.includes(d))));

  /* ---------- أفعال المهام ---------- */
  const toggle = (id) => setSel((p) => { const x = new Set(p); if (x.has(id)) x.delete(id); else x.add(id); return x; });
  const setShown = (on) => setSel((p) => { const x = new Set(p); visible.forEach((it) => (on ? x.add(it.id) : x.delete(it.id))); return x; });
  const reset = () => {
    if (!active) return;
    if (active.id === CURRENT) load(active, currentExtras, currentIds);
    else load(active, active.extraTasks || [], resolveIds(active, tasks));
  };

  const dupe = draft && items.some((it) => normAr(it.name) === normAr(draft.name));
  const addTask = () => {
    const name = draft.name.trim();
    if (!name || dupe) return;
    const id = newExtraId();
    setExtra((e) => [...e, { id, name }]);
    setResp((r) => ({ ...r, [id]: draft.departments }));
    setSel((s) => new Set(s).add(id));
    setDraft(null); setQ(''); setDeptFilter([]); setTf('all');
  };
  const removeExtra = (id) => {
    setExtra((e) => e.filter((x) => x.id !== id));
    setSel((s) => { const x = new Set(s); x.delete(id); return x; });
    setResp((r) => { const x = { ...r }; delete x[id]; return x; });
    setEditing(null);
  };
  const renameExtra = (id, name) => setExtra((e) => e.map((x) => (x.id === id ? { ...x, name } : x)));

  /* ---------- تطبيق / حفظ ---------- */
  const parts = () => splitResp(resp, extra);
  const apply = () => {
    const { std, extras } = parts();
    onApply({
      ids: sel,
      resp: std,
      extras: extras.filter((e) => sel.has(e.id) && e.name.trim()),
      templateId: isTemplate ? active.id : project.templateId,
      templateName: isTemplate ? active.name : project.templateName,
    });
    onClose();
  };

  const stdIds = () => [...sel].filter((id) => !extra.some((e) => e.id === id));
  const updateTemplate = async () => {
    setBusy(true);
    const { std, extras } = parts();
    const next = { ...active, taskIds: stdIds(), responsible: std, extraTasks: extras };
    const ok = await saveTemplate(next);
    setBusy(false);
    if (ok) { setActive(next); setBase(snapshotOf(sel, resp, extra)); }
  };
  const createTemplate = async () => {
    const name = (saveAs.name || '').trim();
    if (!name) return;
    setBusy(true);
    const { std, extras } = parts();
    const tpl = { id: newTemplateId(), name, departments: saveAs.departments, taskIds: stdIds(), responsible: std, extraTasks: extras };
    const ok = await saveTemplate(tpl);
    setBusy(false);
    if (ok) { setActive(tpl); setBase(snapshotOf(sel, resp, extra)); setSaveAs(null); }
  };
  const removeTemplate = async (tpl) => {
    const ok = await confirm({ title: '🗑️ حذف القالب', message: `هيتحذف القالب «${tpl.name}». المشاريع اللي اتطبّق عليها مش هتتأثر.`, confirmText: 'حذف القالب' });
    if (ok) await deleteTemplate(tpl.id);
  };

  const pct = items.length ? Math.round((sel.size / items.length) * 100) : 0;
  const extrasOn = extra.filter((e) => sel.has(e.id)).length;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" aria-hidden />
      <div dir="rtl" role="dialog" aria-modal="true" aria-label="قائمة المهام" className="relative flex h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-lift animate-rise sm:h-[88vh] sm:max-h-[54rem] sm:rounded-3xl">
        {/* ===== Header ===== */}
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-5 pb-5 pt-3 text-white sm:px-7 sm:pt-6">
          <span aria-hidden className="pointer-events-none absolute -start-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-20 end-6 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
          <span aria-hidden className="relative mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />
          <div className="relative flex items-center gap-3">
            {step === 'tasks' && (
              <button type="button" onClick={() => setStep('templates')} aria-label="رجوع للقوالب" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25">
                <Svg d={I.back} className="h-4 w-4" sw={2.2} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white/70">{step === 'templates' ? 'الخطوة ١ من ٢' : 'الخطوة ٢ من ٢'}</p>
              <h2 className="truncate text-lg font-extrabold sm:text-2xl">{step === 'templates' ? 'قائمة المهام — اختاري القالب' : active?.name}</h2>
              <p className="mt-0.5 truncate text-xs font-semibold text-white/75">
                {step === 'templates' ? 'كل قالب مخصص لقسم، وتقدري تعدّلي المهام بعد ما تفتحيه' : `${n(sel.size)} من ${n(items.length)} مهمة مختارة${extrasOn ? ` · ${n(extrasOn)} مضافة` : ''}`}
              </p>
            </div>
            {step === 'tasks' && <RadialGauge value={pct} size={60} stroke={7} color="#fff" trackColor="rgba(255,255,255,.25)" textClass="text-white" label="" />}
            <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 transition hover:bg-white/25">
              <Svg d={I.close} className="h-4 w-4" sw={2.2} />
            </button>
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-7 sm:py-5">
          {step === 'templates' && (
            <>
              {!persisted && (
                <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700 ring-1 ring-amber-200">
                  حفظ القوالب لسه مش مفعّل (الـ endpoint <span dir="ltr">/api/templates</span> مش موجود). تقدري تستخدمي القالب الأساسي وتطبّقيه على المشروع، لكن القوالب الجديدة مش هتتحفظ.
                </p>
              )}
              <MultiSelectSearch label="فلترة بالقسم" value={tplFilter} onChange={setTplFilter} options={allDepts} placeholder="كل الأقسام…" />

              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visTpls.map((tpl, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  const count = resolveIds(tpl, tasks).length + (tpl.extraTasks || []).length;
                  const applied = project.templateId === tpl.id;
                  return (
                    <li key={tpl.id} className="relative">
                      <button type="button" onClick={() => openTemplate(tpl)} className={`group relative h-full w-full overflow-hidden rounded-2xl bg-white p-4 text-start ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-lift ${applied ? 'ring-2 ring-brand-400' : 'ring-slate-200 hover:ring-brand-300'}`}>
                        <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
                        <span className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-soft" style={{ background: accent }}><Svg d={I.list} className="h-5 w-5" /></span>
                        <p className="mt-3 flex items-center gap-2 pe-6 text-sm font-extrabold text-slate-800">
                          <span className="truncate">{tpl.name}</span>
                          {applied && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">مطبّق</span>}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{n(count)} مهمة</p>
                        <span className="mt-3 flex flex-wrap gap-1">
                          {(tpl.departments || []).length ? tpl.departments.map((d) => <Chip key={d}>{d}</Chip>) : <Chip tone="muted">كل الأقسام</Chip>}
                        </span>
                        <span className="mt-3 flex items-center gap-1 text-xs font-extrabold text-brand-600">فتح القالب <Svg d={I.back} className="h-3.5 w-3.5 rotate-180 transition group-hover:-translate-x-1" sw={2.2} /></span>
                      </button>
                      {canManage && tpl.id !== DEFAULT_TEMPLATE.id && !tpl.builtIn && (
                        <button type="button" onClick={() => removeTemplate(tpl)} aria-label={`حذف ${tpl.name}`} className="absolute end-2.5 top-3.5 grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"><Svg d={I.trash} className="h-3.5 w-3.5" /></button>
                      )}
                    </li>
                  );
                })}
{/* 
                {project.tasks && (
                  <li>
                    <button type="button" onClick={openCurrent} className="grid h-full min-h-[10rem] w-full place-content-center justify-items-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-4 text-center transition hover:-translate-y-1 hover:bg-brand-50/60">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Svg d={I.edit} /></span>
                      <span className="text-sm font-extrabold text-brand-700">تعديل المهام الحالية</span>
                      <span className="text-xs font-semibold text-slate-400">{n(currentIds.length + currentExtras.length)} مهمة مفعّلة دلوقتي</span>
                    </button>
                  </li>
                )} */}
                {canManage && (
                  <li>
                    <button type="button" onClick={openNew} className="grid h-full min-h-[10rem] w-full place-content-center justify-items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-4 text-center transition hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50/60">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><Svg d={I.plus} /></span>
                      <span className="text-sm font-extrabold text-slate-700">قالب جديد</span>
                      <span className="text-xs font-semibold text-slate-400">لقسم آخر في الشركة</span>
                    </button>
                  </li>
                )}
                {loading && <li className="grid min-h-[10rem] animate-pulse place-items-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">جاري تحميل القوالب…</li>}
              </ul>
              {!loading && visTpls.length === 0 && <p className="py-8 text-center text-sm text-slate-400">مفيش قوالب للقسم ده</p>}
            </>
          )}

          {step === 'tasks' && (
            <>
              {/* أدوات */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="tpl-search" className="mb-1.5 block text-xs font-bold text-slate-500">بحث في المهام</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-300"><Svg d={I.search} /></span>
                    <input id="tpl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم المهمة أو القسم…" className="h-[2.75rem] w-full rounded-xl bg-white pe-3 ps-9 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
                  </div>
                </div>
                <MultiSelectSearch label="القسم المسؤول" value={deptFilter} onChange={setDeptFilter} options={allDepts} placeholder="فلترة بالقسم المسؤول…" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                <div className="flex gap-1.5" role="group" aria-label="عرض">
                  {[['all', 'الكل', items.length], ['on', 'مختارة', sel.size], ['off', 'غير مختارة', items.length - sel.size]].map(([k, l, c]) => (
                    <button key={k} type="button" aria-pressed={tf === k} onClick={() => setTf(k)} className={`rounded-full px-3 py-1.5 ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-500 ring-slate-200 hover:ring-brand-300'}`}>{l} <span className="tabular-nums opacity-70">{n(c)}</span></button>
                  ))}
                </div>
                <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />
                <button type="button" onClick={() => setShown(true)} className="rounded-lg bg-white px-2.5 py-1.5 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">تحديد المعروض</button>
                <button type="button" onClick={() => setShown(false)} className="rounded-lg bg-white px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء المعروض</button>
                {active?.id !== NEW && <button type="button" onClick={reset} className="rounded-lg bg-white px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">استرجاع الاختيار الأصلي</button>}
              </div>

              {/* إنشاء مهمة جديدة */}
              {draft ? (
                <div className="mt-4 rounded-2xl bg-white p-4 ring-2 ring-brand-300 animate-rise">
                  <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-brand-800"><Svg d={I.plus} className="h-4 w-4" sw={2.2} />مهمة جديدة</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="new-task" className="mb-1.5 block text-xs font-bold text-slate-500">اسم المهمة</label>
                      <input id="new-task" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }} placeholder="مثال: مراجعة مخططات الموقع" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
                      {dupe && <p className="mt-1 text-xs font-semibold text-rose-600">فيه مهمة بنفس الاسم دي</p>}
                    </div>
                    <MultiSelectSearch label="القسم المسؤول" value={draft.departments} onChange={(v) => setDraft({ ...draft, departments: v })} options={allDepts} allowCreate placeholder="ابحثي أو أضيفي قسم…" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={!draft.name.trim() || dupe} onClick={addTask} className="btn-primary disabled:opacity-50">إضافة وتحديدها</button>
                    <button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">إلغاء</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setDraft({ name: '', departments: [] })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-white/70 px-4 py-3 text-sm font-extrabold text-brand-700 transition hover:bg-brand-50">
                  <Svg d={I.plus} sw={2.2} />إنشاء مهمة جديدة مش موجودة في القايمة
                </button>
              )}

              {/* المهام */}
              <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
                {visible.map((it) => {
                  const on = sel.has(it.id);
                  const d = depsOf(it);
                  const open = editing === it.id;
                  return (
                    <li key={it.id} className={`rounded-2xl bg-white ring-1 transition-colors ${open ? 'md:col-span-2' : ''} ${on ? 'ring-brand-300' : 'ring-slate-200'} ${on ? 'shadow-sm' : ''}`}>
                      <div className="flex items-start gap-3 p-3">
                        <button type="button" role="checkbox" aria-checked={on} aria-label={it.name} onClick={() => toggle(it.id)} className="mt-0.5"><Check on={on} /></button>
                        <span className="min-w-0 flex-1 cursor-pointer" onClick={() => toggle(it.id)}>
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-bold leading-snug text-slate-800">{it.name}</span>
                            {it.isExtra && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">جديدة</span>}
                          </span>
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {d.length ? d.map((x) => <Chip key={x}>{x}</Chip>) : <span className="text-[11px] font-semibold text-slate-300">بدون قسم مسؤول</span>}
                          </span>
                        </span>
                        <button type="button" aria-label="تعديل المهمة" aria-expanded={open} onClick={() => setEditing(open ? null : it.id)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${open ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-brand-700'}`}><Svg d={I.edit} /></button>
                      </div>
                      {open && (
                        <div className="grid gap-3 border-t border-brand-100 px-3 pb-3 pt-3 sm:grid-cols-2">
                          {it.isExtra && (
                            <div>
                              <label htmlFor={`nm-${it.id}`} className="mb-1.5 block text-xs font-bold text-slate-500">اسم المهمة</label>
                              <input id={`nm-${it.id}`} value={it.name} onChange={(e) => renameExtra(it.id, e.target.value)} className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
                            </div>
                          )}
                          <MultiSelectSearch label="القسم المسؤول" value={d} options={allDepts} allowCreate placeholder="ابحثي أو أضيفي قسم…" onChange={(v) => setResp((r) => ({ ...r, [it.id]: v }))} />
                          {it.isExtra && <button type="button" onClick={() => removeExtra(it.id)} className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl px-3 py-2.5 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 sm:justify-self-start"><Svg d={I.trash} className="h-3.5 w-3.5" />حذف المهمة</button>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {visible.length === 0 && <p className="py-10 text-center text-sm text-slate-400">مفيش مهام مطابقة</p>}

              {saveAs && (
                <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700"><Svg d={I.layers} />حفظ كقالب جديد ({n(sel.size)} مهمة)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="tpl-name" className="mb-1.5 block text-xs font-bold text-slate-500">اسم القالب</label>
                      <input id="tpl-name" value={saveAs.name} onChange={(e) => setSaveAs({ ...saveAs, name: e.target.value })} placeholder="مثال: قالب العقارات" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
                    </div>
                    <MultiSelectSearch label="القسم" value={saveAs.departments} onChange={(v) => setSaveAs({ ...saveAs, departments: v })} options={allDepts} allowCreate placeholder="اختاري القسم/الأقسام…" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busy || !saveAs.name.trim()} onClick={createTemplate} className="btn-primary disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ القالب'}</button>
                    <button type="button" onClick={() => setSaveAs(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-white">إلغاء</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== Footer ===== */}
        {step === 'tasks' && (
          <footer className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-xs font-bold text-slate-400 sm:me-auto">{n(sel.size)} مختارة · {n(items.length - sel.size)} مش مطلوبة</p>
              <div className="flex flex-wrap gap-2">
                {canManage && changed && <button type="button" disabled={busy} onClick={updateTemplate} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ التعديل على القالب'}</button>}
                {canManage && !saveAs && <button type="button" onClick={() => setSaveAs({ name: '', departments: active?.departments || [] })} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">حفظ كقالب جديد</button>}
                <button type="button" onClick={apply} disabled={!sel.size} className="btn-primary flex-1 disabled:opacity-50 sm:flex-none">تطبيق على المشروع ({n(sel.size)})</button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

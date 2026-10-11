// // import { useEffect, useMemo, useState } from 'react';
// // import Icon from '../ui/EngineerIcons';
// // import { STATES, n, stateOf } from '../../utils/dashboardData';
// // import { parseDepts } from '../../utils/departments';

// // /* نفس منطق projectStats القديم: بنحسب المهام اللي applicable بس */
// // export function snapshotStats(snap, tasks) {
// //   let done = 0;
// //   let total = 0;
// //   tasks.forEach((t) => { const s = snap?.tasks?.[t.id]; if (s?.applicable) { total += 1; if (s.status) done += 1; } });
// //   (snap?.customTasks || []).forEach((c) => { if (c.applicable) { total += 1; if (c.status) done += 1; } });
// //   return { done, total, remaining: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
// // }

// // const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
// // const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// // function Ring({ pct }) {
// //   const r = 34;
// //   const c = 2 * Math.PI * r;
// //   const [shown, setShown] = useState(0);
// //   useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t); }, [pct]);
// //   return (
// //     <div className="relative h-24 w-24 shrink-0">
// //       <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
// //         <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-brand-100" />
// //         <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-brand-600 transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} />
// //       </svg>
// //       <span className="absolute inset-0 grid place-items-center text-lg font-extrabold tabular-nums text-brand-900">{n(pct)}%</span>
// //     </div>
// //   );
// // }

// // function Field({ label, children }) {
// //   return (
// //     <div className="rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-neutral-100">
// //       <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
// //       <div className="mt-0.5 text-sm font-bold text-neutral-800">{children}</div>
// //     </div>
// //   );
// // }

// // export default function ArchiveDrawer({ row, detail, info, tasks, busy, onClose, onRestore, onDelete }) {
// //   const [entered, setEntered] = useState(false);
// //   const [tab, setTab] = useState('overview');
// //   const [tf, setTf] = useState('all');

// //   const snap = detail?.snapshot || row.snapshot || null;
// //   const hasr = detail?.hasr || null;
// //   const files = detail?.files || null;
// //   const stats = useMemo(() => snapshotStats(snap, tasks), [snap, tasks]);
// //   const stKey = snap ? stateOf(snap) : null;
// //   const st = (stKey && STATES[stKey]) || null;

// //   useEffect(() => {
// //     const raf = requestAnimationFrame(() => setEntered(true));
// //     const onKey = (e) => { if (e.key === 'Escape') onClose(); };
// //     document.addEventListener('keydown', onKey);
// //     const prev = document.body.style.overflow;
// //     document.body.style.overflow = 'hidden';
// //     return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
// //   }, [onClose]);

// //   const rows = useMemo(() => {
// //     const std = tasks.map((t) => ({ key: t.id, title: t.title, custom: false, s: snap?.tasks?.[t.id] }));
// //     const cus = (snap?.customTasks || []).map((c) => ({ key: c.id, title: c.title, custom: true, s: c }));
// //     return [...std, ...cus].filter((x) => x.s).filter((x) => {
// //       if (tf === 'done') return x.s.applicable && x.s.status;
// //       if (tf === 'todo') return x.s.applicable && !x.s.status;
// //       if (tf === 'off') return !x.s.applicable;
// //       return true;
// //     });
// //   }, [snap, tasks, tf]);

// //   return (
// //     <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`تفاصيل ${row.projectName}`}>
// //       <div onClick={onClose} className={`absolute inset-0 bg-[#3C3C3B]/50 backdrop-blur-[2px] transition-opacity duration-300 ${entered ? 'opacity-100' : 'opacity-0'}`} />

// //       <aside dir="rtl" className={`absolute inset-y-0 left-0 flex w-full max-w-xl flex-col bg-white shadow-lift transition-transform duration-300 ease-out motion-reduce:transition-none ${entered ? 'translate-x-0' : '-translate-x-full'}`}>
// //         {/* رأس */}
// //         <header className="flex items-start gap-3 border-b border-neutral-100 p-5">
// //           <div className="min-w-0 flex-1">
// //             <p className="text-xs font-bold text-neutral-400">مشروع مؤرشف</p>
// //             <h2 className="mt-0.5 text-xl font-extrabold leading-snug text-brand-900">{row.projectName || 'مشروع بدون اسم'}</h2>
// //             {st && <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1" style={{ color: st.color, borderColor: st.color }}><span className="h-2 w-2 rounded-full" style={{ background: st.color }} />{st.label}</span>}
// //           </div>
// //           <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100"><Icon name="x" className="h-5 w-5" /></button>
// //         </header>

// //         {/* تبويبات */}
// //         <div className="flex gap-1 border-b border-neutral-100 px-5 pt-2" role="tablist">
// //           {[['overview', 'نظرة عامة'], ['tasks', `المهام (${n(rows.length)})`]].map(([k, l]) => (
// //             <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative px-4 py-2.5 text-sm font-bold transition ${tab === k ? 'text-brand-700' : 'text-neutral-400 hover:text-neutral-600'}`}>
// //               {l}
// //               <span className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 transition-opacity ${tab === k ? 'opacity-100' : 'opacity-0'}`} />
// //             </button>
// //           ))}
// //         </div>

// //         <div className="min-h-0 flex-1 overflow-y-auto p-5">
// //           {tab === 'overview' && (
// //             <div className="space-y-5">
// //               {/* تبع مين */}
// //               <section className="rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
// //                 <p className="mb-3 text-xs font-bold text-brand-700">تبع أنهي فريق ومهندس</p>
// //                 <div className="flex items-center gap-3">
// //                   <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-extrabold text-white">{(info.engineerName || '؟').trim().charAt(0)}</span>
// //                   <div className="min-w-0">
// //                     <p className="truncate text-base font-extrabold text-neutral-900">{info.engineerName}</p>
// //                     <p className="truncate text-sm text-neutral-500">{info.teamName}{info.manager ? ` · مدير الفريق: ${info.manager}` : ''}</p>
// //                   </div>
// //                 </div>
// //                 {!info.engineerExists && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200">المهندس غير موجود حاليًا في الفرق — عند الاسترجاع هتختاري مهندس بديل.</p>}
// //               </section>

// //               {/* التقدم */}
// //               {snap ? (
// //                 <section className="flex items-center gap-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
// //                   <Ring pct={stats.pct} />
// //                   <div className="grid flex-1 grid-cols-3 gap-2 text-center">
// //                     {[['منجزة', stats.done], ['متبقية', stats.remaining], ['الإجمالي', stats.total]].map(([l, v]) => (
// //                       <div key={l} className="rounded-xl bg-neutral-50 py-2 ring-1 ring-neutral-100"><p className="text-xl font-extrabold tabular-nums text-brand-900">{n(v)}</p><p className="text-[11px] font-semibold text-neutral-400">{l}</p></div>
// //                     ))}
// //                   </div>
// //                 </section>
// //               ) : (
// //                 <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 ring-1 ring-neutral-200">لا توجد نسخة تفصيلية (Snapshot) محفوظة لهذا السجل. تفاصيل المهام هتظهر لما الـ Backend يحفظها وقت الأرشفة.</p>
// //               )}

// //               <div className="grid grid-cols-2 gap-2">
// //                 <Field label="تاريخ الأرشفة">{fmtDateTime(row.archivedAt)}</Field>
// //                 <Field label="تمت الأرشفة بواسطة">{row.archivedBy || '—'}</Field>
// //                 <Field label="تاريخ التسليم">{fmtDate(snap?.deliveryDate)}</Field>
// //                 <Field label="تاريخ الاستفسارات">{fmtDate(snap?.inquiryDate)}</Field>
// //               </div>

// //               {hasr && (
// //                 <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
// //                   <p className="mb-2 text-sm font-extrabold text-brand-900">حالة الحصر وقت الأرشفة</p>
// //                   <p className="text-sm text-neutral-600">{hasr.hasWork === false ? 'لا يوجد عمل حصر' : hasr.hasWork == null ? 'لم يُحدد' : hasr.hasrDone ? 'تم الحصر' : 'جاري الحصر'}{hasr.hasrDueDate ? ` · ميعاد: ${fmtDate(hasr.hasrDueDate)}` : ''}</p>
// //                   {hasr.hasrNotes && <p className="mt-1 text-sm text-neutral-500">{hasr.hasrNotes}</p>}
// //                 </section>
// //               )}

// //               {files && (files.attachments?.length > 0 || files.tFiles?.length > 0) && (
// //                 <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
// //                   <p className="mb-2 text-sm font-extrabold text-brand-900">الملفات</p>
// //                   <ul className="space-y-1.5">
// //                     {(files.attachments || []).map((f) => (
// //                       <li key={f.id}><a href={f.downloadUrl} download className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-brand-50"><Icon name="file" className="h-4 w-4 text-brand-600" /><span className="truncate">{f.attachmentName || f.originalFileName}</span></a></li>
// //                     ))}
// //                     {(files.tFiles || []).map((f) => <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-700"><Icon name="folder" className="h-4 w-4 text-brand-600" /><span className="truncate">{f.name} · {n(f.rounds?.length || 0)} جولة</span></li>)}
// //                   </ul>
// //                 </section>
// //               )}
// //               {!files && row.filesCount > 0 && <p className="text-xs text-neutral-400">{n(row.filesCount)} ملفات مرتبطة بالمشروع (هتظهر بالتفصيل لما endpoint التفاصيل يجهز).</p>}
// //             </div>
// //           )}

// //           {tab === 'tasks' && (
// //             <div className="space-y-3">
// //               <div className="flex flex-wrap gap-2">
// //                 {[['all', 'الكل'], ['done', 'منجزة'], ['todo', 'متبقية'], ['off', 'غير أساسية']].map(([k, l]) => (
// //                   <button key={k} type="button" onClick={() => setTf(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{l}</button>
// //                 ))}
// //               </div>
// //               {!snap && <p className="py-10 text-center text-sm text-neutral-400">لا توجد تفاصيل مهام محفوظة.</p>}
// //               <ul className="space-y-2">
// //                 {rows.map((r) => (
// //                   <li key={`${r.custom ? 'c' : 's'}${r.key}`} className={`rounded-xl p-3 ring-1 ${r.s.applicable ? 'bg-white ring-neutral-200' : 'bg-neutral-50 ring-neutral-100'}`}>
// //                     <div className="flex items-start gap-2.5">
// //                       <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${r.s.status ? 'bg-brand-600 text-white' : 'border-2 border-neutral-300'}`}>{r.s.status && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
// //                       <div className="min-w-0 flex-1">
// //                         <p className={`text-sm font-bold ${r.s.applicable ? 'text-neutral-900' : 'text-neutral-400'}`}>{r.title}{r.custom && <span className="ms-2 text-[10px] font-bold text-brand-600">مضافة</span>}{!r.s.applicable && <span className="ms-2 text-[10px] font-bold text-neutral-400">غير أساسية</span>}</p>
// //                         <div className="mt-1.5 flex flex-wrap gap-1.5">
// //                           {r.s.review && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">روجعت</span>}
// //                           {parseDepts(r.s.department).map((d) => <span key={d} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{d}</span>)}
// //                           {r.s.dueDate && <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{fmtDate(r.s.dueDate)}</span>}
// //                         </div>
// //                         {r.s.notes && <p className="mt-1.5 text-xs text-neutral-500">{r.s.notes}</p>}
// //                       </div>
// //                     </div>
// //                   </li>
// //                 ))}
// //               </ul>
// //               {snap && !rows.length && <p className="py-10 text-center text-sm text-neutral-400">لا توجد مهام في هذا التصنيف.</p>}
// //             </div>
// //           )}
// //         </div>

// //         {/* إجراءات */}
// //         <footer className="flex flex-wrap gap-2 border-t border-neutral-100 bg-white p-4">
// //           <button type="button" disabled={busy} onClick={onRestore} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"><Icon name="restore" className="h-4 w-4" />استرجاع كمشروع جاري</button>
// //           <button type="button" disabled={busy} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"><Icon name="trash" className="h-4 w-4" />حذف نهائي</button>
// //         </footer>
// //       </aside>
// //     </div>
// //   );
// // }


// import { useEffect, useMemo, useState } from 'react';
// import Avatar from '../ui/Avatar';
// import Icon from '../ui/EngineerIcons';
// import RadialGauge from '../charts/RadialGauge';
// import { n } from '../../utils/dashboardData';
// import { timeAgo } from '../../utils/dates';
// import { STATUS, statusOf, snapshotStats, safeDecode, fmtDate, fmtDateTime } from '../../utils/archiveUtils';

// export { snapshotStats }; // الصفحة كانت بتستورده من هنا

// const taskLabel = (t) => t.name ?? t.title ?? t.label ?? t.text ?? `مهمة ${t.id}`;

// function Fact({ label, children }) {
//   return (
//     <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
//       <p className="text-[11px] font-bold text-slate-400">{label}</p>
//       <div className="mt-1 min-w-0 text-sm font-extrabold text-slate-800">{children}</div>
//     </div>
//   );
// }

// const Tick = ({ done }) => (
//   <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-500 text-white' : 'bg-white text-transparent ring-2 ring-slate-200'}`}>
//     <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>
//   </span>
// );

// /**
//  * تفاصيل مشروع مؤرشف (Side sheet).
//  * row: صف الأرشيف | detail: لقطة محمّلة بعدين (null = بتحمّل، false = فشل) | info: بيانات المهندس/الفريق
//  */
// export default function ArchiveDrawer({ row, detail, info, tasks, busy, labelOf, onClose, onRestore, onDelete }) {
//   const [tab, setTab] = useState('overview');
//   const [tf, setTf] = useState('all');

//   useEffect(() => {
//     const k = (e) => { if (e.key === 'Escape') onClose(); };
//     document.addEventListener('keydown', k);
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = 'hidden';
//     return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
//   }, [onClose]);

//   const snap = row.snapshot || detail?.snapshot || (detail && detail.tasks ? detail : null);
//   const st = statusOf(row, snap);
//   const S = STATUS[st];
//   const status = labelOf ? labelOf(st) : S.label;

//   const stats = snap ? snapshotStats(snap)
//     : row.summary ? { pct: Math.round(row.summary.progressPct || 0), done: row.summary.tasksDone || 0, total: row.summary.tasksTotal || 0 }
//       : null;

//   const { taskRows, customRows, rounds } = useMemo(() => {
//     if (!snap) return { taskRows: [], customRows: [], rounds: [] };
//     const order = new Map(tasks.map((t, i) => [String(t.id), i]));
//     const names = new Map(tasks.map((t) => [String(t.id), taskLabel(t)]));
//     const taskRows = Object.entries(snap.tasks || {})
//       .filter(([, v]) => v && v.applicable)
//       .map(([id, v]) => ({ id, name: names.get(String(id)) || `مهمة ${id}`, done: !!v.status, due: v.dueDate, notes: v.notes }))
//       .sort((a, b) => (order.get(a.id) ?? 1e6) - (order.get(b.id) ?? 1e6));
//     const customRows = (Array.isArray(snap.customTasks) ? snap.customTasks : [])
//       .map((c, i) => ({ id: c.id ?? `c${i}`, name: c.name ?? c.title ?? c.text ?? 'مهمة مضافة', done: !!c.status, due: c.dueDate, notes: c.notes }));
//     return { taskRows, customRows, rounds: Array.isArray(snap.rounds) ? snap.rounds : [] };
//   }, [snap, tasks]);

//   const keep = (r) => (tf === 'all' ? true : tf === 'done' ? r.done : !r.done);
//   const loading = !snap && !row.summary && detail !== false;
//   const tabs = [['overview', 'نظرة عامة'], ['tasks', `المهام (${n(taskRows.length + customRows.length)})`], ...(rounds.length ? [['rounds', `الجولات (${n(rounds.length)})`]] : [])];
//   const by = safeDecode(row.archivedBy);
//   const name = safeDecode(row.projectName) || 'مشروع بدون اسم';

//   const TaskList = ({ rows, empty }) => (rows.filter(keep).length ? (
//     <ul className="space-y-2">
//       {rows.filter(keep).map((r) => (
//         <li key={r.id} className={`flex items-start gap-3 rounded-2xl p-3 ring-1 ${r.done ? 'bg-emerald-50/40 ring-emerald-100' : 'bg-white ring-slate-100'}`}>
//           <Tick done={r.done} />
//           <div className="min-w-0 flex-1">
//             <p className={`text-sm font-bold ${r.done ? 'text-slate-700' : 'text-slate-800'}`}>{r.name}</p>
//             {r.notes && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{r.notes}</p>}
//           </div>
//           {r.due && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-500">{fmtDate(r.due)}</span>}
//         </li>
//       ))}
//     </ul>
//   ) : <p className="py-6 text-center text-sm text-slate-400">{empty}</p>);

//   return (
//     <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`تفاصيل ${name}`}>
//       <div onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
//       <aside dir="rtl" className="absolute inset-y-0 start-0 flex w-full max-w-xl flex-col bg-white shadow-lift animate-rise">
//         {/* ===== Header ===== */}
//         <header className="relative overflow-hidden border-b border-slate-100 px-5 pb-5 pt-4">
//           <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: S.color }} />
//           <div className="flex items-start justify-between gap-3">
//             <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${S.pill}`}>
//               <span className={`h-1.5 w-1.5 rounded-full ${S.dot}`} />{status}
//             </span>
//             <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700">
//               <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
//             </button>
//           </div>
//           <h2 className="mt-3 text-xl font-extrabold leading-snug text-slate-900">{name}</h2>
//           <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-500">
//             <Avatar engineer={{ name: info.engineerName }} size={24} />
//             <span className="truncate">{info.engineerName} · {info.teamName}</span>
//           </p>
//           <p className="mt-2 text-xs font-semibold text-slate-400">اتأرشف {timeAgo(row.archivedAt)}{by && ` · بواسطة ${by}`}</p>
//         </header>

//         {/* ===== Tabs ===== */}
//         <nav className="flex gap-1 border-b border-slate-100 px-4 pt-2" role="tablist">
//           {tabs.map(([k, l]) => (
//             <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm font-extrabold transition ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{l}</button>
//           ))}
//         </nav>

//         {/* ===== Body ===== */}
//         <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
//           {loading && (
//             <div className="space-y-3" aria-busy="true">
//               {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
//               <p className="pt-2 text-center text-xs font-semibold text-slate-400">جاري تحميل لقطة المشروع…</p>
//             </div>
//           )}

//           {!loading && tab === 'overview' && (
//             <div className="space-y-5">
//               {stats && (
//                 <div className={`flex items-center gap-5 rounded-3xl p-4 ${S.soft}`}>
//                   <RadialGauge value={stats.pct} size={104} stroke={10} color={S.color} trackColor="#ffffff" textClass="text-slate-800" />
//                   <div className="min-w-0 flex-1">
//                     <p className="text-sm font-extrabold text-slate-800">نسبة إنجاز المهام</p>
//                     <p className="mt-1 text-xs font-semibold text-slate-500">{n(stats.done)} منجزة من {n(stats.total)} مهمة مطلوبة</p>
//                     <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
//                       {[['مطلوبة', stats.total], ['منجزة', stats.done], ['متبقية', Math.max(0, stats.total - stats.done)]].map(([l, v]) => (
//                         <div key={l} className="rounded-xl bg-white/80 py-1.5"><p className="text-base font-extrabold tabular-nums text-slate-800">{n(v)}</p><p className="text-[10px] font-bold text-slate-400">{l}</p></div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="grid grid-cols-2 gap-2.5">
//                 <Fact label="المهندس">{info.engineerName}</Fact>
//                 <Fact label="الفريق"><span className="block truncate">{info.teamName}</span>{info.manager && <span className="block truncate text-[11px] font-semibold text-slate-400">مدير: {info.manager}</span>}</Fact>
//                 <Fact label="تاريخ التسليم">{fmtDate(snap?.deliveryDate ?? row.summary?.deliveryDate)}</Fact>
//                 <Fact label="تاريخ الاستفسارات">{fmtDate(snap?.inquiryDate)}</Fact>
//                 <Fact label="وقت الأرشفة">{fmtDateTime(row.archivedAt)}</Fact>
//                 <Fact label="تمت بواسطة">{by || '—'}</Fact>
//               </div>

//               {snap?.note && (
//                 <div className="rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-100">
//                   <p className="text-xs font-extrabold text-amber-700">ملحوظة على المشروع</p>
//                   <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{snap.note}</p>
//                 </div>
//               )}
//               {!snap && detail === false && <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">مفيش لقطة تفصيلية متاحة للمشروع ده.</p>}
//             </div>
//           )}

//           {!loading && tab === 'tasks' && (
//             <div>
//               <div className="mb-4 flex gap-1.5" role="group" aria-label="فلتر المهام">
//                 {[['all', 'الكل'], ['done', 'منجزة'], ['todo', 'متبقية']].map(([k, l]) => (
//                   <button key={k} type="button" aria-pressed={tf === k} onClick={() => setTf(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-500 ring-slate-200 hover:ring-brand-300'}`}>{l}</button>
//                 ))}
//               </div>
//               <TaskList rows={taskRows} empty="مفيش مهام قياسية مطلوبة" />
//               {customRows.length > 0 && (
//                 <>
//                   <h3 className="mb-2 mt-6 text-xs font-extrabold text-slate-400">مهام مضافة يدويًا</h3>
//                   <TaskList rows={customRows} empty="—" />
//                 </>
//               )}
//             </div>
//           )}

//           {!loading && tab === 'rounds' && (
//             <ul className="space-y-2">
//               {rounds.map((r, i) => (
//                 <li key={r.id ?? i} className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-slate-100">
//                   <Tick done={!!r.delivered} />
//                   <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{r.title || `جولة ${n(i + 1)}`}</p>
//                   <span className="shrink-0 text-xs font-bold tabular-nums text-slate-400">{fmtDate(r.date)}</span>
//                   <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${r.delivered ? STATUS.won.pill : STATUS.pending.pill}`}>{r.delivered ? 'اتسلّمت' : 'لسه'}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         {/* ===== Footer ===== */}
//         <footer className="flex gap-2 border-t border-slate-100 bg-white px-5 py-4">
//           <button type="button" disabled={busy} onClick={onRestore} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60">
//             <Icon name="restore" className="h-4 w-4" />استرجاع كمشروع جاري
//           </button>
//           <button type="button" disabled={busy} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60">
//             <Icon name="trash" className="h-4 w-4" />حذف نهائي
//           </button>
//         </footer>
//       </aside>
//     </div>
//   );
// }

import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';
import Icon from '../ui/EngineerIcons';
import RadialGauge from '../charts/RadialGauge';
import { n } from '../../utils/dashboardData';
import { timeAgo } from '../../utils/dates';
import { STATUS, statusOf, snapshotStats, safeDecode, fmtDate, fmtDateTime } from '../../utils/archiveUtils';

export { snapshotStats }; // الصفحة كانت بتستورده من هنا

const taskLabel = (t) => t.name ?? t.title ?? t.label ?? t.text ?? `مهمة ${t.id}`;
const norm = (s) => String(s ?? '').toLowerCase().replace(/[ً-ٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

const PATHS = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  team: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19a6 6 0 0 1 12 0M16 11a2.5 2.5 0 1 0 0-5M17 14.5A5 5 0 0 1 21 19',
  cal: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  by: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  note: 'M5 4h14v12l-4 4H5zM15 20v-4h4',
};
const Ico = ({ name, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
);

function Row({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200"><Ico name={icon} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400">{label}</p>
        <div className="truncate text-sm font-extrabold text-slate-800">{children}</div>
      </div>
    </div>
  );
}

const Tick = ({ done }) => (
  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${done ? 'bg-emerald-500 text-white' : 'bg-white text-transparent ring-2 ring-slate-200'}`}>
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>
  </span>
);

function TaskRow({ r }) {
  return (
    <li className={`flex items-start gap-3 rounded-2xl p-3 ring-1 transition-colors ${r.done ? 'bg-emerald-50/50 ring-emerald-100' : 'bg-white ring-slate-100 hover:ring-slate-200'}`}>
      <Tick done={r.done} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-slate-800">{r.name}</p>
        {r.notes && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{r.notes}</p>}
      </div>
      {r.due && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-500">{fmtDate(r.due)}</span>}
    </li>
  );
}

/**
 * تفاصيل مشروع مؤرشف.
 * موبايل: Bottom sheet بملء الشاشة تقريبًا (الصفحة كلها بتتمرّر).
 * ديسكتوب: نافذة واسعة بعمودين — ملخص ثابت على جنب + المهام/الجولات بتتمرّر لوحدها.
 * row: صف الأرشيف | detail: لقطة محمّلة بعدين (null = بتحمّل، false = فشل) | info: المهندس/الفريق
 */
export default function ArchiveDrawer({ row, detail, info, tasks, busy, labelOf, onClose, onRestore, onDelete }) {
  const [tab, setTab] = useState('tasks');
  const [tf, setTf] = useState('all');
  const [q, setQ] = useState('');
  const closeBtn = useRef(null);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);

  const snap = row.snapshot || detail?.snapshot || (detail && detail.tasks ? detail : null);
  const st = statusOf(row, snap);
  const S = STATUS[st];
  const status = labelOf ? labelOf(st) : S.label;
  const by = safeDecode(row.archivedBy);
  const name = safeDecode(row.projectName) || 'مشروع بدون اسم';

  const stats = snap ? snapshotStats(snap)
    : row.summary ? { pct: Math.round(row.summary.progressPct || 0), done: row.summary.tasksDone || 0, total: row.summary.tasksTotal || 0 }
      : null;

  const { taskRows, customRows, rounds } = useMemo(() => {
    if (!snap) return { taskRows: [], customRows: [], rounds: [] };
    const order = new Map(tasks.map((t, i) => [String(t.id), i]));
    const names = new Map(tasks.map((t) => [String(t.id), taskLabel(t)]));
    const taskRows = Object.entries(snap.tasks || {})
      .filter(([, v]) => v && v.applicable)
      .map(([id, v]) => ({ id, name: names.get(String(id)) || `مهمة ${id}`, done: !!v.status, due: v.dueDate, notes: v.notes }))
      .sort((a, b) => (order.get(a.id) ?? 1e6) - (order.get(b.id) ?? 1e6));
    const customRows = (Array.isArray(snap.customTasks) ? snap.customTasks : [])
      .map((c, i) => ({ id: c.id ?? `c${i}`, name: c.name ?? c.title ?? c.text ?? 'مهمة مضافة', done: !!c.status, due: c.dueDate, notes: c.notes }));
    return { taskRows, customRows, rounds: Array.isArray(snap.rounds) ? snap.rounds : [] };
  }, [snap, tasks]);

  const allRows = [...taskRows, ...customRows];
  const doneN = allRows.filter((r) => r.done).length;
  const term = norm(q.trim());
  const keep = (r) => (tf === 'all' || (tf === 'done' ? r.done : !r.done)) && (!term || norm(r.name).includes(term));
  const shownStd = taskRows.filter(keep);
  const shownCustom = customRows.filter(keep);

  const loading = !snap && !row.summary && detail !== false;
  const roundsDone = rounds.filter((r) => r.delivered).length;
  const tabs = [['tasks', `المهام`, allRows.length], ...(rounds.length ? [['rounds', 'الجولات', rounds.length]] : [])];
  const filters = [['all', 'الكل', allRows.length], ['done', 'منجزة', doneN], ['todo', 'متبقية', allRows.length - doneN]];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`تفاصيل ${name}`}>
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" />

      <section dir="rtl" className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-lift animate-rise sm:h-[86vh] sm:max-h-[52rem] sm:rounded-3xl">
        {/* ===== Header ===== */}
        <header className="relative shrink-0 overflow-hidden px-5 pb-5 pt-3 sm:px-7 sm:pt-6" style={{ background: `linear-gradient(135deg, ${S.color}26 0%, ${S.color}0D 55%, transparent 100%)` }}>
          <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: S.color }} />
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-300/70 sm:hidden" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${S.pill}`}><span className={`h-1.5 w-1.5 rounded-full ${S.dot}`} />{status}</span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">مؤرشف · {timeAgo(row.archivedAt)}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Avatar engineer={{ name: info.engineerName }} size={26} />
                <span className="truncate">{info.engineerName}</span><span className="text-slate-300">·</span><span className="truncate">{info.teamName}</span>
              </p>
            </div>
            <button ref={closeBtn} type="button" onClick={onClose} aria-label="إغلاق" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/80 text-slate-400 ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-700">
              <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
            </button>
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 lg:overflow-hidden">
          <div className="lg:grid lg:h-full lg:grid-cols-[20rem_minmax(0,1fr)]">
            {/* ---- ملخص ---- */}
            <aside className="bg-slate-50/80 p-5 sm:p-6 lg:h-full lg:overflow-y-auto lg:border-e lg:border-slate-100">
              {stats ? (
                <div className="flex items-center gap-4 lg:flex-col lg:gap-5">
                  <RadialGauge value={stats.pct} size={132} stroke={12} color={S.color} trackColor="#E2E8F0" textClass="text-slate-900" label="إنجاز المهام" />
                  <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-center lg:w-full lg:flex-none">
                    {[['مطلوبة', stats.total, 'text-slate-800'], ['منجزة', stats.done, 'text-emerald-600'], ['متبقية', Math.max(0, stats.total - stats.done), 'text-amber-600']].map(([l, v, c]) => (
                      <div key={l} className="rounded-2xl bg-white py-2.5 ring-1 ring-slate-100"><p className={`text-lg font-extrabold tabular-nums ${c}`}>{n(v)}</p><p className="text-[10px] font-bold text-slate-400">{l}</p></div>
                    ))}
                  </div>
                </div>
              ) : loading ? <div className="mx-auto h-32 w-32 animate-pulse rounded-full bg-slate-200" aria-hidden /> : null}

              <div className="mt-5 grid grid-cols-1 divide-y divide-slate-200/70 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1">
                <Row icon="user" label="المهندس">{info.engineerName}</Row>
                <Row icon="team" label="الفريق">{info.teamName}{info.manager && <span className="font-semibold text-slate-400"> · {info.manager}</span>}</Row>
                <Row icon="cal" label="تاريخ التسليم">{fmtDate(snap?.deliveryDate ?? row.summary?.deliveryDate)}</Row>
                <Row icon="help" label="تاريخ الاستفسارات">{fmtDate(snap?.inquiryDate)}</Row>
                <Row icon="clock" label="وقت الأرشفة">{fmtDateTime(row.archivedAt)}</Row>
                <Row icon="by" label="تمت الأرشفة بواسطة">{by || '—'}</Row>
              </div>

              {snap?.note && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700"><Ico name="note" className="h-3.5 w-3.5" />ملحوظة على المشروع</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{snap.note}</p>
                </div>
              )}
            </aside>

            {/* ---- المهام / الجولات ---- */}
            <main className="min-w-0 p-5 sm:p-6 lg:h-full lg:overflow-y-auto">
              {loading && (
                <div className="space-y-3" aria-busy="true">
                  {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
                  <p className="pt-1 text-center text-xs font-semibold text-slate-400">جاري تحميل لقطة المشروع…</p>
                </div>
              )}
              {!loading && !snap && (
                <div className="grid h-full min-h-[12rem] place-items-center text-center">
                  <div><p className="text-3xl" aria-hidden>🗂️</p><p className="mt-2 text-sm font-bold text-slate-500">مفيش لقطة تفصيلية متاحة للمشروع ده</p><p className="mt-1 text-xs text-slate-400">الملخص الأساسي ظاهر على الجنب.</p></div>
                </div>
              )}

              {!loading && snap && (
                <>
                  {tabs.length > 1 && (
                    <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-1" role="tablist">
                      {tabs.map(([k, l, c]) => (
                        <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${tab === k ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {l} <span className="text-xs tabular-nums opacity-60">{n(c)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {tab === 'tasks' && (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[11rem] flex-1">
                          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-300"><Ico name="search" /></span>
                          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي في المهام…" aria-label="بحث في المهام" className="w-full rounded-xl bg-white py-2.5 pe-3 ps-9 text-sm font-semibold outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
                        </div>
                        <div className="flex gap-1.5" role="group" aria-label="فلتر المهام">
                          {filters.map(([k, l, c]) => (
                            <button key={k} type="button" aria-pressed={tf === k} onClick={() => setTf(k)} className={`rounded-full px-3 py-2 text-xs font-bold ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-500 ring-slate-200 hover:ring-brand-300'}`}>
                              {l} <span className="tabular-nums opacity-70">{n(c)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {allRows.length > 0 && (
                        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${(doneN / allRows.length) * 100}%` }} />
                        </div>
                      )}

                      {shownStd.length > 0 && <ul className="space-y-2">{shownStd.map((r) => <TaskRow key={r.id} r={r} />)}</ul>}
                      {shownCustom.length > 0 && (
                        <>
                          <h3 className="mb-2 mt-6 flex items-center gap-2 text-xs font-extrabold text-slate-400">مهام مضافة يدويًا <span className="h-px flex-1 bg-slate-100" /></h3>
                          <ul className="space-y-2">{shownCustom.map((r) => <TaskRow key={r.id} r={r} />)}</ul>
                        </>
                      )}
                      {!shownStd.length && !shownCustom.length && <p className="py-10 text-center text-sm text-slate-400">{allRows.length ? 'مفيش مهام مطابقة' : 'مفيش مهام مطلوبة في المشروع ده'}</p>}
                    </>
                  )}

                  {tab === 'rounds' && (
                    <>
                      <p className="mb-3 text-sm font-bold text-slate-500">{n(roundsDone)} من {n(rounds.length)} جولة اتسلّمت</p>
                      <ol className="relative space-y-3 before:absolute before:inset-y-2 before:start-[0.8rem] before:w-px before:bg-slate-200">
                        {rounds.map((r, i) => (
                          <li key={r.id ?? i} className="relative flex items-center gap-3 ps-0">
                            <span className="relative z-10"><Tick done={!!r.delivered} /></span>
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl p-3 ring-1 ring-slate-100">
                              <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{r.title || `جولة ${n(i + 1)}`}</p>
                              <span className="text-xs font-bold tabular-nums text-slate-400">{fmtDate(r.date)}</span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${r.delivered ? STATUS.won.pill : STATUS.pending.pill}`}>{r.delivered ? 'اتسلّمت' : 'لسه'}</span>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* ===== Actions ===== */}
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button type="button" disabled={busy} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60">
            <Icon name="trash" className="h-4 w-4" />حذف نهائي
          </button>
          <button type="button" disabled={busy} onClick={onRestore} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60">
            <Icon name="restore" className="h-4 w-4" />استرجاع كمشروع جاري
          </button>
        </footer>
      </section>
    </div>
  );
}
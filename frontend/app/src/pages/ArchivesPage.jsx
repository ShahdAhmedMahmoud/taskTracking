// // import { useEffect, useMemo, useState } from 'react';
// // import { Link } from 'react-router-dom';
// // import { useData } from '../hooks/useData';
// // import { getArchives } from '../services/adminService';
// // import PageHeader from '../components/ui/PageHeader';
// // import Avatar from '../components/ui/Avatar';
// // import { teamLabel } from '../utils/helpers';
// // import { n } from '../utils/dashboardData';

// // const Svg = ({ className = 'h-5 w-5', children }) => (
// //   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>
// // );
// // const ArchiveIcon = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" /></Svg>;
// // const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;

// // const monthKey = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'none');
// // const monthLabel = (d) => (d ? d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }) : 'بدون تاريخ');
// // const fmt = (d) => (d ? d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// // export default function ArchivesPage() {
// //   const { teams } = useData();
// //   const [rows, setRows] = useState(null);
// //   const [error, setError] = useState('');
// //   const [q, setQ] = useState('');
// //   const [eng, setEng] = useState('all');
// //   const [order, setOrder] = useState('new');

// //   const load = () => {
// //     setError(''); setRows(null);
// //     getArchives()
// //       .then((r) => setRows(Array.isArray(r) ? r : r?.items || []))
// //       .catch((e) => setError(e.message));
// //   };
// //   useEffect(() => { load(); }, []);

// //   const engMap = useMemo(() => {
// //     const m = {};
// //     teams.forEach((t) => t.engineers.forEach((e) => { m[e.id] = { e, t }; }));
// //     return m;
// //   }, [teams]);

// //   const items = useMemo(() => (rows || []).map((r, i) => ({
// //     key: r.id ?? `${r.engineerId}-${r.projectId ?? i}`,
// //     name: r.projectName || 'مشروع بدون اسم',
// //     engId: r.engineerId,
// //     engName: r.engineerName || engMap[r.engineerId]?.e.name || r.engineerId || '—',
// //     at: r.archivedAt && !Number.isNaN(new Date(r.archivedAt).getTime()) ? new Date(r.archivedAt) : null,
// //     by: r.archivedBy || '',
// //   })), [rows, engMap]);

// //   const engineers = useMemo(() => {
// //     const m = new Map();
// //     items.forEach((x) => m.set(x.engId, x.engName));
// //     return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar'));
// //   }, [items]);

// //   const term = q.trim().toLowerCase();
// //   const list = useMemo(() => items
// //     .filter((x) => (eng === 'all' || x.engId === eng) && (!term || [x.name, x.engName, x.by].some((s) => (s || '').toLowerCase().includes(term))))
// //     .sort((a, b) => (order === 'new' ? 1 : -1) * ((b.at?.getTime() || 0) - (a.at?.getTime() || 0))), [items, eng, term, order]);

// //   const groups = useMemo(() => {
// //     const g = [];
// //     list.forEach((x) => {
// //       const k = monthKey(x.at);
// //       const last = g[g.length - 1];
// //       if (last && last.k === k) last.items.push(x); else g.push({ k, label: monthLabel(x.at), items: [x] });
// //     });
// //     return g;
// //   }, [list]);

// //   const thisMonth = items.filter((x) => x.at && monthKey(x.at) === monthKey(new Date())).length;
// //   const latest = items.reduce((a, x) => (x.at && (!a || x.at > a) ? x.at : a), null);
// //   const dirty = q || eng !== 'all';

// //   const kpis = [
// //     ['إجمالي المؤرشف', items.length, 'text-brand-700'],
// //     ['الشهر ده', thisMonth, 'text-sky-600'],
// //     ['مهندسين متأثرين', engineers.length, 'text-slate-700'],
// //   ];

// //   return (
// //     <>
// //       <PageHeader back title="الأرشيف" subtitle="المشاريع اللي اتحذفت أو اتأرشفت، محفوظة بلقطة كاملة وقت الأرشفة" />

// //       {/* ===== مؤشرات ===== */}
// //       <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
// //         {kpis.map(([l, v, c], i) => (
// //           <div key={l} className="card p-4 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
// //             <p className={`text-3xl font-extrabold tabular-nums ${c}`}>{rows ? n(v) : '—'}</p>
// //             <p className="mt-0.5 text-sm font-semibold text-slate-400">{l}</p>
// //           </div>
// //         ))}
// //         <div className="card p-4 animate-rise" style={{ animationDelay: '180ms' }}>
// //           <p className="truncate text-base font-extrabold text-slate-700">{latest ? latest.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '—'}</p>
// //           <p className="mt-1 text-sm font-semibold text-slate-400">آخر أرشفة</p>
// //         </div>
// //       </div>

// //       {/* ===== أدوات ===== */}
// //       <div className="card mt-5 flex flex-wrap items-center gap-3 p-3.5">
// //         <label className="relative min-w-0 flex-1 basis-56">
// //           <span className="sr-only">بحث في الأرشيف</span>
// //           <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
// //           <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المشروع أو المهندس"
// //             className="w-full rounded-xl bg-slate-50 py-2.5 pe-4 ps-11 text-sm font-semibold outline-none ring-1 ring-slate-200 transition placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-brand-400" />
// //         </label>
// //         {[
// //           ['المهندس', eng, setEng, [['all', 'كل المهندسين'], ...engineers]],
// //           ['ترتيب', order, setOrder, [['new', 'الأحدث أولًا'], ['old', 'الأقدم أولًا']]],
// //         ].map(([label, value, set, opts]) => (
// //           <label key={label} className="flex items-center gap-2 text-sm font-bold text-slate-400">
// //             {label}
// //             <select value={value} onChange={(e) => set(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400">
// //               {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
// //             </select>
// //           </label>
// //         ))}
// //         {dirty && <button type="button" onClick={() => { setQ(''); setEng('all'); }} className="rounded-xl px-3 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">مسح الفلاتر</button>}
// //       </div>

// //       {/* ===== المحتوى ===== */}
// //       <div className="mt-5">
// //         {error ? (
// //           <div className="card flex flex-col items-center gap-3 py-12 text-center animate-rise">
// //             <p className="font-extrabold">تعذّر تحميل الأرشيف</p>
// //             <p className="max-w-sm text-sm text-slate-400">{error}</p>
// //             <button type="button" className="btn-primary" onClick={load}>إعادة المحاولة</button>
// //           </div>
// //         ) : !rows ? (
// //           <div className="space-y-3" aria-busy="true">
// //             {[0, 1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse bg-slate-50" />)}
// //           </div>
// //         ) : items.length === 0 ? (
// //           <div className="card flex flex-col items-center gap-3 py-16 text-center animate-rise">
// //             <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ArchiveIcon className="h-7 w-7" /></span>
// //             <p className="font-extrabold">الأرشيف فاضي</p>
// //             <p className="max-w-sm text-sm leading-relaxed text-slate-400">أي مشروع بيتحذف من صفحة المهندس بيتنقل هنا تلقائيًا.</p>
// //           </div>
// //         ) : list.length === 0 ? (
// //           <div className="card py-12 text-center text-sm text-slate-400 animate-rise">مفيش نتايج مطابقة للبحث.</div>
// //         ) : (
// //           <div className="space-y-7">
// //             {groups.map((g) => (
// //               <section key={g.k}>
// //                 <h2 className="mb-3 flex items-center gap-3 text-sm font-extrabold text-slate-500">
// //                   {g.label}
// //                   <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs tabular-nums text-slate-400">{n(g.items.length)}</span>
// //                   <span className="h-px flex-1 bg-slate-100" />
// //                 </h2>
// //                 <ul className="space-y-2.5">
// //                   {g.items.map((x, i) => {
// //                     const known = engMap[x.engId];
// //                     return (
// //                       <li key={x.key} className="card flex flex-wrap items-center gap-4 p-4 animate-rise transition duration-300 hover:border-brand-200 hover:shadow-soft" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
// //                         <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ArchiveIcon /></span>
// //                         <div className="min-w-0 flex-1 basis-52">
// //                           <h3 className="truncate text-base font-extrabold">{x.name}</h3>
// //                           <p className="mt-0.5 text-xs text-slate-400">{fmt(x.at)}{x.by && ` · بواسطة ${x.by}`}</p>
// //                         </div>
// //                         <div className="flex min-w-0 items-center gap-2.5">
// //                           <Avatar engineer={known?.e || { name: x.engName }} size={32} />
// //                           <div className="min-w-0">
// //                             {known
// //                               ? <Link to={`/engineers/${x.engId}`} className="block truncate text-sm font-bold transition hover:text-brand-700">{x.engName}</Link>
// //                               : <span className="block truncate text-sm font-bold">{x.engName}</span>}
// //                             <span className="block truncate text-xs text-slate-400">{known ? teamLabel(known.t) : 'غير موجود حاليًا في الفرق'}</span>
// //                           </div>
// //                         </div>
// //                         <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500">مؤرشف</span>
// //                       </li>
// //                     );
// //                   })}
// //                 </ul>
// //               </section>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </>
// //   );
// // }


// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { useData } from '../hooks/useData';
// import { useUI } from '../hooks/useUI';
// import PageHeader from '../components/ui/PageHeader';
// import Loader, { Empty } from '../components/ui/Loader';
// import Icon from '../components/ui/EngineerIcons';
// import ArchiveDrawer, { snapshotStats } from '../components/archive/ArchiveDrawer';
// import { archivesService } from '../services/archivesService';
// import { n } from '../utils/dashboardData';
// import { teamLabel } from '../utils/helpers';
// import { timeAgo } from '../utils/dates';
// import { normalizeAr } from '../utils/departments';

// const BASE_LABEL = { won: 'فوز', lost: 'خسارة', pending: 'معلق', running: 'جاري', unknown: 'غير محدد' };
// const BADGE = { won: 'bg-brand-600 text-white', lost: 'bg-neutral-700 text-white', pending: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200', running: 'bg-white text-neutral-600 ring-1 ring-neutral-300', unknown: 'bg-neutral-100 text-neutral-500' };

// const outcomeOf = (row) => {
//   const s = row.snapshot || row.summary;
//   if (!s) return 'unknown';
//   return s.finished ? s.outcome || 'pending' : 'running';
// };

// function useCountUp(target, ms = 800) {
//   const [v, setV] = useState(0);
//   useEffect(() => {
//     if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
//     let raf; let start;
//     const step = (t) => { start ??= t; const k = Math.min((t - start) / ms, 1); setV(Math.round(target * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(step); };
//     raf = requestAnimationFrame(step);
//     return () => cancelAnimationFrame(raf);
//   }, [target, ms]);
//   return v;
// }

// function Stat({ label, value, active, onClick }) {
//   const v = useCountUp(value);
//   return (
//     <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-2xl px-4 py-3 text-center ring-1 transition hover:-translate-y-0.5 ${active ? 'bg-brand-600 text-white ring-brand-600 shadow-lift' : 'bg-white/80 text-brand-900 ring-brand-100 backdrop-blur hover:shadow-soft'}`}>
//       <p className="text-2xl font-extrabold tabular-nums">{n(v)}</p>
//       <p className={`text-xs font-semibold ${active ? 'text-white/80' : 'text-neutral-500'}`}>{label}</p>
//     </button>
//   );
// }

// function Modal({ title, children, onClose }) {
//   useEffect(() => {
//     const k = (e) => e.key === 'Escape' && onClose();
//     document.addEventListener('keydown', k);
//     return () => document.removeEventListener('keydown', k);
//   }, [onClose]);
//   return (
//     <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
//       <div onClick={onClose} className="absolute inset-0 bg-[#3C3C3B]/55 backdrop-blur-[2px]" />
//       <div dir="rtl" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-lift">{children}</div>
//     </div>
//   );
// }

// function TypeToConfirm({ row, busy, onCancel, onConfirm }) {
//   const [text, setText] = useState('');
//   const target = (row.projectName || '').trim();
//   const ok = normalizeAr(text) === normalizeAr(target);
//   return (
//     <Modal title="حذف نهائي" onClose={onCancel}>
//       <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-700"><Icon name="trash" className="h-6 w-6" /></div>
//       <h3 className="text-lg font-extrabold text-neutral-900">حذف «{target || 'بدون اسم'}» نهائيًا؟</h3>
//       <p className="mt-2 text-sm leading-relaxed text-neutral-600">هيتمسح المشروع وكل مهامه وملفاته من النظام، ومش هينفع تسترجعيه بعد كده.</p>
//       <label className="mt-4 block text-xs font-bold text-neutral-500">للتأكيد اكتبي اسم المشروع</label>
//       <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={target} className="mt-1.5 w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 transition focus:bg-white focus:ring-2 focus:ring-red-400" />
//       <div className="mt-5 flex gap-2">
//         <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-50">إلغاء</button>
//         <button type="button" disabled={!ok || busy} onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-40">{busy ? 'جاري الحذف…' : 'حذف نهائي'}</button>
//       </div>
//     </Modal>
//   );
// }

// function EngineerPicker({ row, teams, busy, onCancel, onConfirm }) {
//   const [id, setId] = useState('');
//   return (
//     <Modal title="اختيار مهندس" onClose={onCancel}>
//       <h3 className="text-lg font-extrabold text-brand-900">اختاري المهندس اللي هيرجعله المشروع</h3>
//       <p className="mt-2 text-sm leading-relaxed text-neutral-600">المهندس الأصلي لـ «{row.projectName}» مش موجود حاليًا في الفرق.</p>
//       <select value={id} onChange={(e) => setId(e.target.value)} className="mt-4 w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-sm outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500">
//         <option value="">— اختاري مهندس —</option>
//         {teams.filter((t) => t.type !== 'hasr').map((t) => (
//           <optgroup key={t.id} label={teamLabel(t)}>{t.engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
//         ))}
//       </select>
//       <div className="mt-5 flex gap-2">
//         <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-50">إلغاء</button>
//         <button type="button" disabled={!id || busy} onClick={() => onConfirm(id)} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-40">{busy ? 'جاري الاسترجاع…' : 'استرجاع'}</button>
//       </div>
//     </Modal>
//   );
// }

// export default function ArchivesPage() {
//   const { session } = useAuth();
//   const { teams, tasks, loadEngineer, outcomeLabel } = useData();
//   const { confirm } = useUI();

//   const [rows, setRows] = useState(null);
//   const [error, setError] = useState('');
//   const [q, setQ] = useState('');
//   const [fTeam, setFTeam] = useState('all');
//   const [fOutcome, setFOutcome] = useState('all');
//   const [sort, setSort] = useState('new');
//   const [openId, setOpenId] = useState(null);
//   const [detail, setDetail] = useState(null);
//   const [busyId, setBusyId] = useState(null);
//   const [leaving, setLeaving] = useState(null);
//   const [deleting, setDeleting] = useState(null);
//   const [picker, setPicker] = useState(null);
//   const [flash, setFlash] = useState(null);
//   const flashTimer = useRef();

//   const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
//   const say = useCallback((type, text) => {
//     setFlash({ type, text });
//     clearTimeout(flashTimer.current);
//     flashTimer.current = setTimeout(() => setFlash(null), 4200);
//   }, []);
//   useEffect(() => () => clearTimeout(flashTimer.current), []);

//   const load = useCallback(async () => {
//     setError('');
//     try { setRows(await archivesService.list({ taskIds })); }
//     catch (e) { setError(e.message || 'تعذر تحميل الأرشيف'); setRows([]); }
//   }, [taskIds]);
//   useEffect(() => { load(); }, [load]);

//   if (session.role !== 'dept') return <Navigate to="/" replace />;

//   const lookup = new Map();
//   teams.forEach((t) => t.engineers.forEach((e) => lookup.set(e.id, { e, t })));
//   const infoOf = (row) => {
//     const f = lookup.get(row.engineerId);
//     return { engineerName: f?.e.name || row.engineerName || '—', teamName: f ? teamLabel(f.t) : row.teamName || '—', teamId: f?.t.id || row.teamId || '', manager: f?.t.manager || '', engineerExists: !!f };
//   };
//   const labelOf = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, BASE_LABEL[k]) : BASE_LABEL[k]);

//   const counts = { all: rows?.length || 0, won: 0, lost: 0, other: 0 };
//   (rows || []).forEach((r) => { const k = outcomeOf(r); if (k === 'won') counts.won += 1; else if (k === 'lost') counts.lost += 1; else counts.other += 1; });

//   const shown = (rows || [])
//     .filter((r) => {
//       const k = outcomeOf(r);
//       const info = infoOf(r);
//       if (fOutcome === 'other' ? (k === 'won' || k === 'lost') : fOutcome !== 'all' && k !== fOutcome) return false;
//       if (fTeam !== 'all' && info.teamId !== fTeam) return false;
//       return !q || normalizeAr(`${r.projectName} ${info.engineerName} ${info.teamName}`).includes(normalizeAr(q));
//     })
//     .sort((a, b) => (sort === 'name' ? String(a.projectName).localeCompare(String(b.projectName), 'ar') : sort === 'old' ? new Date(a.archivedAt) - new Date(b.archivedAt) : new Date(b.archivedAt) - new Date(a.archivedAt)));

//   const openRow = rows?.find((r) => r.id === openId) || null;

//   const open = (row) => {
//     setOpenId(row.id);
//     setDetail(null);
//     if (!row.snapshot) archivesService.get(row.id).then((d) => d && setDetail(d)).catch(() => {});
//   };

//   const finish = (row, message) => {
//     setLeaving(row.id);
//     setOpenId(null);
//     setTimeout(() => { setRows((r) => r.filter((x) => x.id !== row.id)); setLeaving(null); }, 320);
//     say('ok', message);
//   };

//   const restore = async (row, targetEngineerId) => {
//     setBusyId(row.id);
//     try {
//       await archivesService.restore(row.id, { targetEngineerId });
//       setPicker(null);
//       finish(row, `تم استرجاع «${row.projectName}» كمشروع جاري`);
//       loadEngineer(targetEngineerId || row.engineerId, true)?.catch?.(() => {});
//     } catch (e) {
//       if (e.code === 'ENGINEER_NOT_FOUND') setPicker(row);
//       else say('error', e.message || 'تعذر الاسترجاع');
//     } finally { setBusyId(null); }
//   };

//   const askRestore = async (row) => {
//     if (!infoOf(row).engineerExists) { setPicker(row); return; }
//     const info = infoOf(row);
//     const ok = await confirm({
//       title: '↩ استرجاع المشروع',
//       message: `«${row.projectName}» هيرجع مشروع جاري عند ${info.engineerName} (${info.teamName}) بنفس مهامه وملفاته.`,
//       confirmText: 'استرجاع',
//     });
//     if (ok) restore(row);
//   };

//   const remove = async () => {
//     const row = deleting;
//     setBusyId(row.id);
//     try { await archivesService.remove(row.id); setDeleting(null); finish(row, `تم حذف «${row.projectName}» نهائيًا`); }
//     catch (e) { say('error', e.message || 'تعذر الحذف'); }
//     finally { setBusyId(null); }
//   };

//   const outcomeChips = [['all', 'الكل'], ['won', labelOf('won')], ['lost', labelOf('lost')], ['other', 'جاري / معلق']];

//   return (
//     <>
//       <PageHeader back title="الأرشيف" />

//       <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-5 shadow-soft sm:p-7">
//         <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
//         <div className="relative flex flex-wrap items-center gap-5">
//           <div className="min-w-0 flex-1 basis-60">
//             <h1 className="flex items-center gap-3 text-2xl font-extrabold text-brand-900 sm:text-3xl"><Icon name="archive" className="h-8 w-8 text-brand-600" strokeWidth={1.75} />أرشيف المشاريع</h1>
//             <p className="mt-1.5 text-sm text-[#3C3C3B]">راجعي أي مشروع اتأرشف، شوفي تفاصيله وتبع مين، واسترجعيه كمشروع جاري أو احذفيه نهائيًا.</p>
//           </div>
//           <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
//             <Stat label="الإجمالي" value={counts.all} active={fOutcome === 'all'} onClick={() => setFOutcome('all')} />
//             <Stat label={labelOf('won')} value={counts.won} active={fOutcome === 'won'} onClick={() => setFOutcome('won')} />
//             <Stat label={labelOf('lost')} value={counts.lost} active={fOutcome === 'lost'} onClick={() => setFOutcome('lost')} />
//             <Stat label="جاري / معلق" value={counts.other} active={fOutcome === 'other'} onClick={() => setFOutcome('other')} />
//           </div>
//         </div>
//       </section>

//       <div className="mb-5 flex flex-wrap items-center gap-2">
//         <div className="relative min-w-[14rem] flex-1">
//           <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
//           <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المشروع أو المهندس أو الفريق…" className="w-full rounded-xl bg-white py-2.5 pe-3 ps-9 text-sm outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-500" />
//         </div>
//         <select value={fTeam} onChange={(e) => setFTeam(e.target.value)} aria-label="الفريق" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500">
//           <option value="all">كل الفرق</option>
//           {teams.filter((t) => t.type !== 'hasr').map((t) => <option key={t.id} value={t.id}>{teamLabel(t)}</option>)}
//         </select>
//         <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500">
//           <option value="new">الأحدث أرشفة</option><option value="old">الأقدم أرشفة</option><option value="name">الاسم</option>
//         </select>
//         <button type="button" onClick={load} aria-label="تحديث" className="rounded-xl bg-white p-2.5 text-neutral-500 ring-1 ring-neutral-200 transition hover:text-brand-700 hover:ring-brand-300"><Icon name="refresh" className="h-4 w-4" /></button>
//       </div>

//       <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="النتيجة">
//         {outcomeChips.map(([k, l]) => (
//           <button key={k} type="button" role="tab" aria-selected={fOutcome === k} onClick={() => setFOutcome(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${fOutcome === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{l}</button>
//         ))}
//       </div>

//       {rows === null && <Loader />}
//       {error && <Empty icon="⚠️" title="تعذر تحميل الأرشيف" text={error} />}
//       {rows && !error && !shown.length && <Empty icon="🗄️" title={rows.length ? 'مفيش نتائج مطابقة' : 'الأرشيف فاضي'} text={rows.length ? 'غيّري البحث أو الفلتر.' : 'المشاريع اللي بتتأرشف هتظهر هنا.'} />}

//       <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
//         {shown.map((row, i) => {
//           const k = outcomeOf(row);
//           const info = infoOf(row);
//           const st = row.snapshot ? snapshotStats(row.snapshot, tasks) : row.summary ? { pct: Math.round(row.summary.progressPct || 0), done: row.summary.tasksDone, total: row.summary.tasksTotal } : null;
//           const busy = busyId === row.id;
//           return (
//             <article
//               key={row.id}
//               style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
//               className={`animate-rise group relative flex flex-col rounded-2xl bg-white p-4 ring-1 ring-neutral-200 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-300 ${leaving === row.id ? 'pointer-events-none scale-95 opacity-0' : ''} ${busy ? 'opacity-70' : ''}`}
//             >
//               <button type="button" onClick={() => open(row)} className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500" aria-label={`فتح تفاصيل ${row.projectName}`} />
//               <div className="flex items-start gap-2">
//                 <h3 className="min-w-0 flex-1 text-base font-extrabold leading-snug text-brand-900">{row.projectName || 'مشروع بدون اسم'}</h3>
//                 <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${BADGE[k]}`}>{labelOf(k)}</span>
//               </div>
//               <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">{info.engineerName.trim().charAt(0)}</span><span className="truncate">{info.engineerName} · {info.teamName}</span></p>
//               {st && (
//                 <div className="mt-3">
//                   <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700" style={{ width: `${st.pct}%` }} /></div>
//                   <p className="mt-1 text-xs font-semibold text-neutral-400">{n(st.pct)}% · {n(st.done)}/{n(st.total)} مهمة</p>
//                 </div>
//               )}
//               <p className="mt-3 text-xs text-neutral-400">اتأرشف {timeAgo(row.archivedAt)} · {row.archivedBy || '—'}</p>

//               {/* أزرار سريعة — بتظهر عند المرور أو التركيز */}
//               <div className="relative z-10 mt-3 flex gap-2 border-t border-neutral-100 pt-3 opacity-100 transition sm:translate-y-1 sm:opacity-0 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
//                 <button type="button" disabled={busy} onClick={() => askRestore(row)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60"><Icon name="restore" className="h-3.5 w-3.5" />استرجاع</button>
//                 <button type="button" disabled={busy} onClick={() => setDeleting(row)} aria-label="حذف نهائي" className="rounded-lg px-3 py-2 text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"><Icon name="trash" className="h-3.5 w-3.5" /></button>
//               </div>
//             </article>
//           );
//         })}
//       </div>

//       {openRow && (
//         <ArchiveDrawer
//           row={openRow} detail={detail} info={infoOf(openRow)} tasks={tasks} busy={busyId === openRow.id}
//           onClose={() => setOpenId(null)} onRestore={() => askRestore(openRow)} onDelete={() => setDeleting(openRow)}
//         />
//       )}
//       {deleting && <TypeToConfirm row={deleting} busy={busyId === deleting.id} onCancel={() => setDeleting(null)} onConfirm={remove} />}
//       {picker && <EngineerPicker row={picker} teams={teams} busy={busyId === picker.id} onCancel={() => setPicker(null)} onConfirm={(id) => restore(picker, id)} />}

//       <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 transition-all duration-300 ${flash ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
//         {flash && <div className={`pointer-events-auto rounded-2xl px-5 py-3 text-sm font-bold shadow-lift ${flash.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-900 text-white'}`}>{flash.text}</div>}
//       </div>
//     </>
//   );
// }

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/ui/PageHeader';
import Loader, { Empty } from '../components/ui/Loader';
import Icon from '../components/ui/EngineerIcons';
import ArchiveDrawer from '../components/archive/ArchiveDrawer';
import { archivesService } from '../services/archivesService';
import { n } from '../utils/dashboardData';
import { teamLabel } from '../utils/helpers';
import { timeAgo } from '../utils/dates';
import { normalizeAr } from '../utils/departments';
import { STATUS, STATUS_ORDER, statusOf, snapshotStats, safeDecode, fmtDate } from '../utils/archiveUtils';

const HYDRATE_LIMIT = 60; // أقصى عدد لقطات بنجيبها تلقائيًا عشان نحدد حالة الصفوف اللي ملهاش ملخص

function useCountUp(target, ms = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
    let raf; let start;
    const step = (t) => { start ??= t; const k = Math.min((t - start) / ms, 1); setV(Math.round(target * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ label, value, color, active, onClick }) {
  const v = useCountUp(value);
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`group relative overflow-hidden rounded-2xl px-4 py-3.5 text-start ring-1 transition duration-300 hover:-translate-y-0.5 ${active ? 'bg-white shadow-lift ring-2' : 'bg-white/70 ring-white/80 backdrop-blur hover:bg-white hover:shadow-soft'}`} style={active ? { '--tw-ring-color': color } : undefined}>
      <span aria-hidden className="absolute inset-y-3 start-0 w-1 rounded-e-full" style={{ background: color }} />
      <p className="text-2xl font-extrabold tabular-nums text-slate-900">{n(v)}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-500">{label}</p>
    </button>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <div dir="rtl" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-lift">{children}</div>
    </div>
  );
}

function TypeToConfirm({ row, busy, onCancel, onConfirm }) {
  const [text, setText] = useState('');
  const target = safeDecode(row.projectName).trim();
  const ok = normalizeAr(text) === normalizeAr(target);
  return (
    <Modal title="حذف نهائي" onClose={onCancel}>
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-700"><Icon name="trash" className="h-6 w-6" /></div>
      <h3 className="text-lg font-extrabold text-slate-900">حذف «{target || 'بدون اسم'}» نهائيًا؟</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">هيتمسح المشروع وكل مهامه وملفاته من النظام، ومش هينفع تسترجعيه بعد كده.</p>
      <label className="mt-4 block text-xs font-bold text-slate-500">للتأكيد اكتبي اسم المشروع</label>
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={target} className="mt-1.5 w-full rounded-xl bg-slate-50 px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-red-400" />
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء</button>
        <button type="button" disabled={!ok || busy} onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-40">{busy ? 'جاري الحذف…' : 'حذف نهائي'}</button>
      </div>
    </Modal>
  );
}

function EngineerPicker({ row, teams, busy, onCancel, onConfirm }) {
  const [id, setId] = useState('');
  return (
    <Modal title="اختيار مهندس" onClose={onCancel}>
      <h3 className="text-lg font-extrabold text-slate-900">اختاري المهندس اللي هيرجعله المشروع</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">المهندس الأصلي لـ «{safeDecode(row.projectName)}» مش موجود حاليًا في الفرق.</p>
      <select value={id} onChange={(e) => setId(e.target.value)} className="mt-4 w-full rounded-xl bg-slate-50 px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500">
        <option value="">— اختاري مهندس —</option>
        {teams.filter((t) => t.type !== 'hasr').map((t) => (
          <optgroup key={t.id} label={teamLabel(t)}>{t.engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
        ))}
      </select>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء</button>
        <button type="button" disabled={!id || busy} onClick={() => onConfirm(id)} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-40">{busy ? 'جاري الاسترجاع…' : 'استرجاع'}</button>
      </div>
    </Modal>
  );
}

function ArchiveCard({ row, i, k, label, info, st, delivery, busy, leaving, onOpen, onRestore, onDelete }) {
  const S = STATUS[k];
  const name = safeDecode(row.projectName) || 'مشروع بدون اسم';
  const by = safeDecode(row.archivedBy);
  return (
    <article
      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
      className={`animate-rise group relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 ps-5 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-300 ${leaving ? 'pointer-events-none scale-95 opacity-0' : ''} ${busy ? 'opacity-70' : ''}`}
    >
      <span aria-hidden className="absolute inset-y-0 start-0 w-1.5" style={{ background: S.color }} />
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500" aria-label={`فتح تفاصيل ${name}`} />

      <div className="flex items-start gap-2">
        <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-extrabold leading-snug text-slate-900">{name}</h3>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${S.pill}`}><span className={`h-1.5 w-1.5 rounded-full ${S.dot}`} />{label}</span>
      </div>

      <p className="mt-2.5 flex items-center gap-2 text-sm text-slate-600">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">{info.engineerName.trim().charAt(0)}</span>
        <span className="truncate font-semibold">{info.engineerName}</span>
        <span className="text-slate-300">·</span>
        <span className="truncate text-slate-400">{info.teamName}</span>
      </p>

      {st ? (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">{n(st.done)}/{n(st.total)} مهمة</span>
            <span className="tabular-nums text-slate-700">{n(st.pct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-l ${S.bar} transition-[width] duration-700`} style={{ width: `${st.pct}%` }} /></div>
        </div>
      ) : <div className="mt-3.5 h-1.5 animate-pulse rounded-full bg-slate-100" aria-hidden />}

      <dl className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 px-2.5 py-2"><dt className="font-bold text-slate-400">التسليم</dt><dd className="mt-0.5 font-extrabold tabular-nums text-slate-700">{fmtDate(delivery)}</dd></div>
        <div className="rounded-xl bg-slate-50 px-2.5 py-2"><dt className="font-bold text-slate-400">اتأرشف</dt><dd className="mt-0.5 truncate font-extrabold text-slate-700">{timeAgo(row.archivedAt)}</dd></div>
      </dl>
      {by && <p className="mt-2 truncate text-[11px] font-semibold text-slate-400">بواسطة {by}</p>}

      <div className="relative z-10 mt-3.5 flex gap-2 border-t border-slate-100 pt-3">
        <button type="button" disabled={busy} onClick={onRestore} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60"><Icon name="restore" className="h-3.5 w-3.5" />استرجاع</button>
        <button type="button" onClick={onOpen} className="rounded-lg px-3 py-2 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">التفاصيل</button>
        <button type="button" disabled={busy} onClick={onDelete} aria-label="حذف نهائي" className="rounded-lg px-3 py-2 text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"><Icon name="trash" className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}

export default function ArchivesPage() {
  const { session } = useAuth();
  const { teams, tasks, loadEngineer, outcomeLabel } = useData();
  const { confirm } = useUI();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [fTeam, setFTeam] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [sort, setSort] = useState('new');
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [hydrated, setHydrated] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [picker, setPicker] = useState(null);
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef();
  const inflight = useRef(new Set());
  const mounted = useRef(true);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const say = useCallback((type, text) => {
    setFlash({ type, text });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4200);
  }, []);
  useEffect(() => () => { mounted.current = false; clearTimeout(flashTimer.current); }, []);

  const load = useCallback(async () => {
    setError('');
    try { setRows(await archivesService.list({ taskIds })); }
    catch (e) { setError(e.message || 'تعذر تحميل الأرشيف'); setRows([]); }
  }, [taskIds]);
  useEffect(() => { load(); }, [load]);

  /* الصفوف اللي القايمة مرجّعتش لها ملخص بنجيب لقطتها في الخلفية (٣ طلبات مع بعض) عشان حالتها تبان بدل "غير محدد" */
  useEffect(() => {
    if (!rows) return;
    const todo = rows.filter((r) => !r.snapshot && !r.summary && !(r.id in hydrated) && !inflight.current.has(r.id)).slice(0, HYDRATE_LIMIT);
    if (!todo.length) return;
    todo.forEach((r) => inflight.current.add(r.id));
    let idx = 0;
    const worker = async () => {
      while (idx < todo.length) {
        const r = todo[idx]; idx += 1;
        let snap = null;
        try { const d = await archivesService.get(r.id); snap = d?.snapshot ?? d ?? null; } catch { /* هتفضل غير محدد */ }
        if (mounted.current) setHydrated((h) => ({ ...h, [r.id]: snap }));
      }
    };
    Promise.all([worker(), worker(), worker()]);
  }, [rows, hydrated]);

  if (session.role !== 'dept') return <Navigate to="/" replace />;

  const lookup = new Map();
  teams.forEach((t) => t.engineers.forEach((e) => lookup.set(e.id, { e, t })));
  const infoOf = (row) => {
    const f = lookup.get(row.engineerId);
    return { engineerName: f?.e.name || row.engineerName || '—', teamName: f ? teamLabel(f.t) : row.teamName || '—', teamId: f?.t.id || row.teamId || '', manager: f?.t.manager || '', engineerExists: !!f };
  };
  const kOf = (row) => statusOf(row, hydrated[row.id]);
  const labelOf = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, STATUS[k].label) : STATUS[k].label);
  const statsOf = (row) => {
    const snap = row.snapshot || hydrated[row.id];
    if (snap?.tasks) return snapshotStats(snap);
    if (row.summary) return { pct: Math.round(row.summary.progressPct || 0), done: row.summary.tasksDone || 0, total: row.summary.tasksTotal || 0 };
    return null;
  };
  const deliveryOf = (row) => (row.snapshot || hydrated[row.id])?.deliveryDate ?? row.summary?.deliveryDate ?? row.deliveryDate;

  const counts = { all: rows?.length || 0, running: 0, pending: 0, won: 0, lost: 0, unknown: 0 };
  (rows || []).forEach((r) => { counts[kOf(r)] += 1; });

  const shown = (rows || [])
    .filter((r) => {
      const info = infoOf(r);
      if (fStatus !== 'all' && kOf(r) !== fStatus) return false;
      if (fTeam !== 'all' && info.teamId !== fTeam) return false;
      return !q || normalizeAr(`${safeDecode(r.projectName)} ${info.engineerName} ${info.teamName}`).includes(normalizeAr(q));
    })
    .sort((a, b) => (sort === 'name' ? String(safeDecode(a.projectName)).localeCompare(String(safeDecode(b.projectName)), 'ar') : sort === 'old' ? new Date(a.archivedAt) - new Date(b.archivedAt) : new Date(b.archivedAt) - new Date(a.archivedAt)));

  const groups = fStatus === 'all'
    ? STATUS_ORDER.map((k) => ({ k, items: shown.filter((r) => kOf(r) === k) })).filter((g) => g.items.length)
    : [{ k: fStatus, items: shown }];

  const openRow = rows?.find((r) => r.id === openId) || null;
  const dirty = q || fTeam !== 'all' || fStatus !== 'all';

  const open = (row) => {
    setOpenId(row.id);
    const cached = hydrated[row.id];
    setDetail(cached ?? null);
    if (!row.snapshot && !cached) archivesService.get(row.id).then((d) => setDetail(d || false)).catch(() => setDetail(false));
  };

  const finish = (row, message) => {
    setLeaving(row.id);
    setOpenId(null);
    setTimeout(() => { setRows((r) => r.filter((x) => x.id !== row.id)); setLeaving(null); }, 320);
    say('ok', message);
  };

  const restore = async (row, targetEngineerId) => {
    setBusyId(row.id);
    try {
      await archivesService.restore(row.id, { targetEngineerId });
      setPicker(null);
      finish(row, `تم استرجاع «${safeDecode(row.projectName)}» كمشروع جاري`);
      loadEngineer(targetEngineerId || row.engineerId, true)?.catch?.(() => {});
    } catch (e) {
      if (e.code === 'ENGINEER_NOT_FOUND') setPicker(row);
      else say('error', e.message || 'تعذر الاسترجاع');
    } finally { setBusyId(null); }
  };

  const askRestore = async (row) => {
    if (!infoOf(row).engineerExists) { setPicker(row); return; }
    const info = infoOf(row);
    const ok = await confirm({
      title: '↩ استرجاع المشروع',
      message: `«${safeDecode(row.projectName)}» هيرجع مشروع جاري عند ${info.engineerName} (${info.teamName}) بنفس مهامه وملفاته.`,
      confirmText: 'استرجاع',
    });
    if (ok) restore(row);
  };

  const remove = async () => {
    const row = deleting;
    setBusyId(row.id);
    try { await archivesService.remove(row.id); setDeleting(null); finish(row, `تم حذف «${safeDecode(row.projectName)}» نهائيًا`); }
    catch (e) { say('error', e.message || 'تعذر الحذف'); }
    finally { setBusyId(null); }
  };

  const tabs = [['all', 'الكل', counts.all], ...['running', 'pending', 'won', 'lost'].map((k) => [k, labelOf(k), counts[k]]), ...(counts.unknown ? [['unknown', 'غير محدد', counts.unknown]] : [])];
  const total = counts.all || 1;

  return (
    <>
      <PageHeader back title="الأرشيف" />

      {/* ===== Hero ===== */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/60 p-5 shadow-soft sm:p-7">
        <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 end-8 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1 basis-64">
              <h1 className="flex items-center gap-3 text-2xl font-extrabold text-brand-900 sm:text-3xl"><Icon name="archive" className="h-8 w-8 text-brand-600" strokeWidth={1.75} />أرشيف المشاريع</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">كل مشروع اتأرشف محفوظ بلقطة كاملة وقت الأرشفة. راجعي تفاصيله، واسترجعيه كمشروع جاري أو احذفيه نهائيًا.</p>
            </div>
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3.5 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100 backdrop-blur transition hover:bg-white"><Icon name="refresh" className="h-4 w-4" />تحديث</button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <Stat label="الإجمالي" value={counts.all} color="#6F7DD0" active={fStatus === 'all'} onClick={() => setFStatus('all')} />
            {['running', 'pending', 'won', 'lost'].map((k) => (
              <Stat key={k} label={labelOf(k)} value={counts[k]} color={STATUS[k].color} active={fStatus === k} onClick={() => setFStatus(fStatus === k ? 'all' : k)} />
            ))}
          </div>

          {counts.all > 0 && (
            <div className="mt-4" aria-hidden="true">
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/70">
                {STATUS_ORDER.map((k) => counts[k] > 0 && <div key={k} className="transition-[flex-grow] duration-700" style={{ flexGrow: counts[k], flexBasis: 0, background: STATUS[k].color }} title={`${labelOf(k)}: ${counts[k]} (${Math.round((counts[k] / total) * 100)}%)`} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== أدوات ===== */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المشروع أو المهندس أو الفريق…" className="w-full rounded-xl bg-white py-2.5 pe-3 ps-9 text-sm outline-none ring-1 ring-slate-200 transition placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={fTeam} onChange={(e) => setFTeam(e.target.value)} aria-label="الفريق" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500">
          <option value="all">كل الفرق</option>
          {teams.filter((t) => t.type !== 'hasr').map((t) => <option key={t.id} value={t.id}>{teamLabel(t)}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500">
          <option value="new">الأحدث أرشفة</option><option value="old">الأقدم أرشفة</option><option value="name">الاسم</option>
        </select>
        {dirty && <button type="button" onClick={() => { setQ(''); setFTeam('all'); setFStatus('all'); }} className="rounded-xl px-3 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">مسح الفلاتر</button>}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="حالة المشروع">
        {tabs.map(([k, l, c]) => (
          <button key={k} type="button" role="tab" aria-selected={fStatus === k} onClick={() => setFStatus(k)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${fStatus === k ? 'bg-brand-600 text-white ring-brand-600 shadow-soft' : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand-300'}`}>
            {k !== 'all' && <span className={`h-2 w-2 rounded-full ${STATUS[k].dot}`} />}
            {l}
            <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${fStatus === k ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{n(c)}</span>
          </button>
        ))}
      </div>

      {/* ===== المحتوى ===== */}
      {rows === null && <Loader />}
      {error && <Empty icon="⚠️" title="تعذر تحميل الأرشيف" text={error} />}
      {rows && !error && !shown.length && <Empty icon="🗄️" title={rows.length ? 'مفيش نتائج مطابقة' : 'الأرشيف فاضي'} text={rows.length ? 'غيّري البحث أو الفلتر.' : 'المشاريع اللي بتتأرشف هتظهر هنا.'} />}

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.k} aria-label={labelOf(g.k)}>
            {fStatus === 'all' && (
              <h2 className="mb-3 flex items-center gap-3 text-sm font-extrabold text-slate-600">
                <span className={`h-3 w-3 rounded-full ${STATUS[g.k].dot}`} />{labelOf(g.k)}
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs tabular-nums text-slate-500">{n(g.items.length)}</span>
                <span className="h-px flex-1 bg-slate-100" />
              </h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {g.items.map((row, i) => (
                <ArchiveCard
                  key={row.id} row={row} i={i} k={g.k} label={labelOf(g.k)} info={infoOf(row)} st={statsOf(row)} delivery={deliveryOf(row)}
                  busy={busyId === row.id} leaving={leaving === row.id}
                  onOpen={() => open(row)} onRestore={() => askRestore(row)} onDelete={() => setDeleting(row)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {openRow && (
        <ArchiveDrawer
          row={openRow} detail={detail} info={infoOf(openRow)} tasks={tasks} busy={busyId === openRow.id} labelOf={labelOf}
          onClose={() => setOpenId(null)} onRestore={() => askRestore(openRow)} onDelete={() => setDeleting(openRow)}
        />
      )}
      {deleting && <TypeToConfirm row={deleting} busy={busyId === deleting.id} onCancel={() => setDeleting(null)} onConfirm={remove} />}
      {picker && <EngineerPicker row={picker} teams={teams} busy={busyId === picker.id} onCancel={() => setPicker(null)} onConfirm={(id) => restore(picker, id)} />}

      <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 transition-all duration-300 ${flash ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        {flash && <div className={`pointer-events-auto rounded-2xl px-5 py-3 text-sm font-bold shadow-lift ${flash.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-900 text-white'}`}>{flash.text}</div>}
      </div>
    </>
  );
}
// import { useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { useData } from '../hooks/useData';
// import { useAuth } from '../hooks/useAuth';
// import PageHeader from '../components/ui/PageHeader';
// import Panel from '../components/ui/Panel';
// import StatCard from '../components/ui/StatCard';
// import Avatar from '../components/ui/Avatar';
// import Segmented from '../components/ui/Segmented';
// import StackedColumns from '../components/charts/StackedColumns';
// import DonutChart from '../components/charts/DonutChart';
// import RadialGauge from '../components/charts/RadialGauge';
// import RadarChart from '../components/charts/RadarChart';
// import { ProjectsIcon, ClockIcon, CheckIcon, TrophyIcon, ChevronDownIcon } from '../components/ui/Icons';
// import { LayersIcon } from '../components/engineer/EngineerIcons';
// import { mainTeams, teamLabel } from '../utils/helpers';
// import { teamStats, pctOf } from '../utils/stats';
// import {
//   n, STATES, stateOf, daysLeft, inPeriod, collectProjects,
//   periodResults, deliveriesTimeline, teamBreakdown,
// } from '../utils/dashboardData';
// import {
//   isSaudiTeam, isHasrTeam, projectCounts, tasksOf, upcomingDeadlines, recentActivity,
//   fmtDate, HASR_STATES, hasrState, hasrProjectsOf, hasrCounts,
// } from '../utils/reportsData';
// import { isReportsViewer } from '../utils/roles';

// const PERIODS = [['week', 'آخر ٧ أيام'], ['month', 'آخر ٣٠ يوم'], ['all', 'كل الفترات']];
// const PERIOD_TEXT = { week: 'آخر ٧ أيام', month: 'آخر ٣٠ يوم', all: 'كل الفترات' };
// const PALETTE = ['#6F7DD0', '#38BDF8', '#F59E0B', '#10B981', '#FB7185', '#A78BFA'];
// const COLS = [
//   ['name', 'المهندس'], ['tasksPct', 'إنجاز المهام'], ['projects', 'المشاريع'], ['running', 'جارية'],
//   ['delivered', 'منتهية'], ['won', 'فوز'], ['lost', 'خسارة'], ['winPct', 'نسبة الفوز'], ['late', 'متأخر'],
// ];

// const whenText = (k) => (k < 0 ? `متأخر ${n(-k)} يوم` : k === 0 ? 'اليوم' : `بعد ${n(k)} يوم`);
// const tint = (hex, a = '1A') => `${hex}${a}`;

// /* رابط يتحول لعنصر عادي لو المستخدم "مشاهد تقارير" (قراءة فقط) */
// function MaybeLink({ to, disabled, className, children }) {
//   return disabled
//     ? <div className={className}>{children}</div>
//     : <Link to={to} className={className}>{children}</Link>;
// }

// function SectionTitle({ eyebrow, title, hint, icon }) {
//   return (
//     <div className="mb-3 mt-9 flex items-end justify-between gap-3">
//       <div className="flex items-center gap-3">
//         {icon && <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-lg text-brand-600">{icon}</span>}
//         <div>
//           {eyebrow && <p className="text-xs font-extrabold tracking-wide text-brand-500">{eyebrow}</p>}
//           <h2 className="text-lg font-extrabold text-slate-800 sm:text-xl">{title}</h2>
//         </div>
//       </div>
//       {hint && <p className="hidden text-xs font-semibold text-slate-400 sm:block">{hint}</p>}
//     </div>
//   );
// }

// function Chip({ color, children }) {
//   return (
//     <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: tint(color), color }}>
//       <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
//       {children}
//     </span>
//   );
// }

// function Tile({ label, value, tone = 'text-brand-700' }) {
//   return (
//     <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
//       <p className={`text-2xl font-extrabold tabular-nums ${tone}`}>{n(value)}</p>
//       <p className="mt-0.5 text-xs font-semibold text-slate-400">{label}</p>
//     </div>
//   );
// }

// /* جدول مهندسين مبسّط (للسعودية) */
// function MiniEngTable({ rows, readOnly }) {
//   return (
//     <div className="-mx-2 overflow-x-auto px-2">
//       <table className="w-full min-w-[34rem] text-sm">
//         <thead>
//           <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
//             <th className="pb-3 text-start">المهندس</th>
//             {['إنجاز المهام', 'المشاريع', 'جارية', 'منتهية', 'فوز', 'خسارة'].map((h) => <th key={h} className="pb-3 text-center">{h}</th>)}
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-slate-50">
//           {rows.map((r) => (
//             <tr key={r.e.id} className="hover:bg-brand-50/40">
//               <td className="py-3">
//                 <MaybeLink to={`/engineers/${r.e.id}`} disabled={readOnly} className="flex items-center gap-3">
//                   <Avatar engineer={r.e} size={32} />
//                   <span className="truncate font-bold">{r.e.name}</span>
//                 </MaybeLink>
//               </td>
//               <td className="text-center font-extrabold tabular-nums text-brand-700">{n(r.tasks.pct)}%</td>
//               <td className="text-center tabular-nums">{n(r.c.total)}</td>
//               <td className="text-center tabular-nums text-sky-600">{n(r.c.running)}</td>
//               <td className="text-center tabular-nums">{n(r.c.finished)}</td>
//               <td className="text-center tabular-nums text-emerald-600">{n(r.c.won)}</td>
//               <td className="text-center tabular-nums text-rose-600">{n(r.c.lost)}</td>
//             </tr>
//           ))}
//           {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">لا يوجد مهندسين</td></tr>}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default function ReportsPage() {
//   const { teams, engineers, tasks, outcomeLabel, hasr } = useData();
//   const { session } = useAuth();
//   const readOnly = isReportsViewer(session?.role);
//   const [period, setPeriod] = useState('all');
//   const [teamId, setTeamId] = useState('all');
//   const [q, setQ] = useState('');
//   const [sort, setSort] = useState({ key: 'delivered', dir: -1 });

//   const [ready, setReady] = useState(false);
//   useEffect(() => {
//     const id = requestAnimationFrame(() => setReady(true));
//     return () => cancelAnimationFrame(id);
//   }, []);

//   const lab = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, STATES[k].label) : STATES[k].label);

//   const main = useMemo(() => mainTeams(teams), [teams]);
//   const all = useMemo(() => collectProjects(main, engineers), [main, engineers]);
//   const saudiTeams = useMemo(() => teams.filter((t) => isSaudiTeam(t) && !main.includes(t) && !isHasrTeam(t)), [teams, main]);
//   const hasrTeams = useMemo(() => teams.filter(isHasrTeam), [teams]);

//   /* ---------- مؤشرات عامة (القسم الرئيسي) ---------- */
//   const counts = useMemo(() => projectCounts(all), [all]);
//   const pr = useMemo(() => periodResults(all, period), [all, period]);
//   const timeline = useMemo(() => deliveriesTimeline(all, period), [all, period]);
//   const taskTotals = useMemo(() => {
//     const t = main.reduce((a, team) => {
//       const s = teamStats(team, engineers, tasks);
//       return { done: a.done + s.done, total: a.total + s.total };
//     }, { done: 0, total: 0 });
//     return { ...t, left: t.total - t.done, pct: pctOf(t.done, t.total) };
//   }, [main, engineers, tasks]);
//   const avgRunning = useMemo(() => {
//     const run = all.filter(({ p }) => !p.finished);
//     return run.length ? tasksOf(run).pct : 0;
//   }, [all]);

//   /* ---------- الجولات ---------- */
//   const rounds = useMemo(() => {
//     let total = 0; let done = 0; const overdue = [];
//     all.forEach((item) => (item.p.rounds || []).forEach((r) => {
//       total += 1;
//       if (r.delivered) { done += 1; return; }
//       const k = daysLeft(r.date);
//       if (!item.p.finished && k !== null && k < 0) overdue.push({ item, r, k });
//     }));
//     overdue.sort((a, b) => a.k - b.k);
//     return { total, done, overdue };
//   }, [all]);

//   /* ---------- مقارنة الفرق ---------- */
//   const teamRows = useMemo(
//     () => main
//       .filter((t) => t.engineers.length)
//       .map((t, i) => {
//         const ids = new Set(t.engineers.map((e) => e.id));
//         const mine = all.filter((x) => ids.has(x.engineer.id));
//         const s = teamStats(t, engineers, tasks);
//         return {
//           t, color: t.color || PALETTE[i % PALETTE.length], s, pct: pctOf(s.done, s.total),
//           c: projectCounts(mine), b: teamBreakdown(all, t.id, period),
//         };
//       })
//       .sort((a, b) => b.b.won - a.b.won || b.b.delivered.length - a.b.delivered.length),
//     [main, engineers, tasks, all, period],
//   );

//   const radar = useMemo(() => {
//     const maxDel = Math.max(1, ...teamRows.map((r) => r.b.delivered.length));
//     return {
//       axes: ['إنجاز المهام', 'نسبة الفوز', 'إغلاق المشاريع', 'الالتزام بالمواعيد', 'حجم التسليمات'],
//       series: teamRows.map((r) => ({
//         name: teamLabel(r.t),
//         color: r.color,
//         values: [
//           r.pct,
//           r.c.winPct ?? 0,
//           pctOf(r.c.finished, r.c.total),
//           r.c.running ? Math.round((1 - r.c.late / r.c.running) * 100) : 100,
//           Math.round((r.b.delivered.length / maxDel) * 100),
//         ],
//       })),
//     };
//   }, [teamRows]);

//   /* ---------- الحركات والمواعيد ---------- */
//   const activity = useMemo(() => recentActivity(all, period), [all, period]);
//   const upcoming = useMemo(() => upcomingDeadlines(all), [all]);

//   /* ---------- أداء المهندسين ---------- */
//   const engRows = useMemo(
//     () => main.flatMap((t) => t.engineers.map((e) => {
//       const mine = all.filter((x) => x.engineer.id === e.id);
//       const c = projectCounts(mine);
//       const inP = { pending: 0, won: 0, lost: 0 };
//       mine.forEach(({ p }) => { if (p.finished && inPeriod(p.deliveryDate, period)) inP[stateOf(p)] += 1; });
//       const decided = inP.won + inP.lost;
//       return {
//         e, t, name: e.name,
//         tasksPct: tasksOf(mine).pct,
//         projects: c.total, running: c.running, late: c.late,
//         delivered: inP.pending + decided, won: inP.won, lost: inP.lost, pending: inP.pending,
//         winPct: decided ? Math.round((inP.won / decided) * 100) : null,
//       };
//     })),
//     [main, all, period],
//   );

//   const shownRows = useMemo(() => {
//     const val = (r) => (r[sort.key] === null ? -Infinity : r[sort.key]);
//     const term = q.trim();
//     return engRows
//       .filter((r) => (teamId === 'all' || r.t.id === teamId) && (!term || r.name.includes(term)))
//       .sort((a, b) => (sort.key === 'name' ? sort.dir * a.name.localeCompare(b.name, 'ar') : sort.dir * (val(a) - val(b))));
//   }, [engRows, teamId, sort, q]);

//   const sortBy = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }));

//   /* ---------- قسم السعودية ---------- */
//   const saudi = useMemo(() => saudiTeams.map((t) => {
//     const items = collectProjects([t], engineers);
//     const s = teamStats(t, engineers, tasks);
//     const rows = t.engineers.map((e) => {
//       const mine = items.filter((x) => x.engineer.id === e.id);
//       return { e, c: projectCounts(mine), tasks: tasksOf(mine) };
//     });
//     return { t, pct: pctOf(s.done, s.total), c: projectCounts(items), rows };
//   }), [saudiTeams, engineers, tasks]);

//   /* ---------- قسم الحصر ---------- */
//   const hasrSections = useMemo(() => hasrTeams.map((t) => {
//     const list = hasrProjectsOf(t, hasr);
//     return { t, list, c: hasrCounts(list) };
//   }), [hasrTeams, hasr]);

//   /* ---------- تصدير CSV (بيفتح عربي صح في Excel) ---------- */
//   const exportCsv = () => {
//     const head = ['المهندس', 'الفريق', 'إنجاز المهام %', 'المشاريع', 'جارية', 'منتهية', 'فوز', 'خسارة', 'معلق', 'نسبة الفوز %', 'متأخر'];
//     const lines = shownRows.map((r) => [r.name, teamLabel(r.t), r.tasksPct, r.projects, r.running, r.delivered, r.won, r.lost, r.pending, r.winPct ?? '', r.late]);
//     const csv = `\uFEFF${[head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
//     const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
//     const a = document.createElement('a');
//     a.href = url; a.download = `تقرير-المهندسين-${new Date().toISOString().slice(0, 10)}.csv`;
//     a.click(); URL.revokeObjectURL(url);
//   };

//   const donutProjects = [
//     { label: 'جارية في الميعاد', color: '#38BDF8', value: counts.running - counts.late },
//     { label: 'جارية ومتأخرة', color: '#FB7185', value: counts.late },
//     { label: 'منتهية', color: '#10B981', value: counts.finished },
//   ];

//   return (
//     <>
//       <PageHeader back={!readOnly} title="التقارير" subtitle="أداء القسم والفرق والمهندسين في مكان واحد" />

//       {/* ===== أدوات التقرير ===== */}
//       <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
//         <Segmented value={period} onChange={setPeriod} options={PERIODS} />
//         <div className="flex flex-wrap gap-2">
//           <button type="button" onClick={exportCsv} className="btn-primary">تصدير Excel (CSV)</button>
//           <button type="button" onClick={() => window.print()} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50">طباعة</button>
//         </div>
//       </div>

//       {/* ===== Hero: نظرة عامة على القسم الرئيسي ===== */}
//       <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-lg sm:p-7 print:break-inside-avoid">
//         <span aria-hidden className="pointer-events-none absolute -start-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
//         <span aria-hidden className="pointer-events-none absolute -bottom-20 end-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
//         <div className="relative grid items-center gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
//           <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
//             <RadialGauge value={taskTotals.pct} size={168} stroke={14} color="#fff" trackColor="rgba(255,255,255,.2)" textClass="text-white" label="نسبة الإنجاز العامة" ready={ready} />
//             <div>
//               <p className="text-xs font-extrabold tracking-wide text-white/70">نظرة عامة على القسم الرئيسي</p>
//               <h2 className="mt-1 text-2xl font-extrabold">نسبة الإنجاز العامة</h2>
//               <p className="mt-1 text-sm text-white/75">{n(main.filter((t) => t.engineers.length).length)} فرق · {n(counts.total)} مشروع</p>
//             </div>
//           </div>

//           <div>
//             <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
//               {[['مهام إجمالية', taskTotals.total], ['منجزة', taskTotals.done], ['متبقية', taskTotals.left]].map(([l, v]) => (
//                 <div key={l} className="rounded-2xl bg-white/12 px-3 py-3.5 text-center ring-1 ring-white/20 backdrop-blur">
//                   <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">{n(v)}</p>
//                   <p className="mt-0.5 text-xs font-semibold text-white/75">{l}</p>
//                 </div>
//               ))}
//             </div>
//             <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
//               {teamRows.map((r) => (
//                 <div key={r.t.id} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
//                   <div className="flex items-center justify-between gap-2 text-xs font-bold">
//                     <span className="flex min-w-0 items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} /><span className="truncate">{teamLabel(r.t)}</span></span>
//                     <span className="tabular-nums">{n(r.pct)}%</span>
//                   </div>
//                   <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
//                     <div className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${ready ? r.pct : 0}%` }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ===== مؤشرات ===== */}
//       <div className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
//         <StatCard featured delay={0} icon={<ProjectsIcon />} label="إجمالي المشاريع" value={counts.total} hint={`${n(counts.running)} جارية · ${n(counts.finished)} منتهية`} />
//         <StatCard delay={60} icon={<ClockIcon />} label="مشاريع جارية" value={counts.running} tone="sky" hint={counts.running ? `متوسط الإنجاز ${n(avgRunning)}%` : 'لا توجد مشاريع جارية'} />
//         <StatCard delay={120} icon={<TrophyIcon />} label={lab('won')} value={counts.won} tone="amber" hint={counts.decided ? `من ${n(counts.decided)} نتيجة نهائية` : 'لا نتائج نهائية بعد'} />
//         <StatCard delay={180} icon={<CheckIcon />} label={lab('lost')} value={counts.lost} hint={counts.lost ? 'مشاريع خسرناها' : 'لا توجد خسائر'} />
//         <StatCard delay={0} icon={<CheckIcon />} label="تم تسليمها (الفترة)" value={pr.delivered} hint={`${n(pr.won)} فوز · ${n(pr.lost)} خسارة · ${n(pr.pending)} معلق`} />
//         <StatCard delay={60} icon={<TrophyIcon />} label="نسبة الفوز (الفترة)" value={pr.winPct} suffix="%" tone="amber" hint={pr.decided ? `من ${n(pr.decided)} نتيجة نهائية` : 'لا نتائج نهائية في الفترة'} />
//         <StatCard delay={120} icon={<ProjectsIcon />} label="مشاريع متأخرة" value={counts.late} hint={counts.late ? 'عدّى موعد تسليمها' : 'كله في الميعاد'} />
//         <StatCard delay={180} icon={<LayersIcon className="h-5 w-5" />} label="جولات التسليم" value={rounds.total} tone="sky" hint={`${n(rounds.done)} اتسلّمت · ${n(rounds.overdue.length)} متأخرة`} />
//       </div>

//       {/* ===== Donuts ===== */}
//       <SectionTitle eyebrow="توزيعات" title="الصورة الكاملة في دوائر" hint={PERIOD_TEXT[period]} />
//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <Panel delay={40} title="حالة المشاريع" subtitle={`${n(counts.total)} مشروع`}>
//           <DonutChart centerValue={n(counts.total)} centerLabel="مشروع" segments={donutProjects} />
//         </Panel>
//         <Panel delay={80} title="نتائج التسليم" subtitle={PERIOD_TEXT[period]}>
//           <DonutChart
//             centerValue={n(pr.delivered)} centerLabel="مشروع مسلّم"
//             segments={['won', 'pending', 'lost'].map((k) => ({ label: lab(k), color: STATES[k].color, value: pr[k] }))}
//           />
//         </Panel>
//         <Panel delay={120} title="المهام" subtitle={`${n(taskTotals.total)} مهمة إجمالًا`}>
//           <DonutChart
//             centerValue={`${n(taskTotals.pct)}%`} centerLabel="منجزة"
//             segments={[{ label: 'منجزة', color: '#10B981', value: taskTotals.done }, { label: 'متبقية', color: '#CBD5E1', value: taskTotals.left }]}
//           />
//         </Panel>
//         <Panel delay={160} title="مساهمة الفرق" subtitle="المهام المنجزة لكل فريق">
//           <DonutChart
//             centerValue={n(taskTotals.done)} centerLabel="مهمة منجزة"
//             segments={teamRows.map((r) => ({ label: teamLabel(r.t), color: r.color, value: r.s.done }))}
//           />
//         </Panel>
//       </div>

//       {/* ===== الرسوم الزمنية + الرادار ===== */}
//       <div className="mt-5 grid gap-4 lg:grid-cols-12">
//         <Panel className="lg:col-span-7" delay={60} title="التسليمات عبر الزمن" subtitle={`${PERIOD_TEXT[period]} · الألوان = نتيجة المشروع`}>
//           <StackedColumns data={timeline} />
//         </Panel>
//         <Panel className="lg:col-span-5" delay={120} title="رادار مقارنة الفرق" subtitle="٥ محاور من ٠ إلى ١٠٠">
//           {radar.series.length ? <RadarChart axes={radar.axes} series={radar.series} /> : <p className="py-8 text-center text-sm text-slate-400">لا توجد فرق بعد</p>}
//         </Panel>
//       </div>

//       {/* ===== مقارنة الفرق ===== */}
//       <SectionTitle eyebrow="الفرق" title="مقارنة أداء الفرق" hint={`مرتبة بعدد مرات الفوز · ${PERIOD_TEXT[period]}`} />
//       {teamRows.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد فرق بعد</p> : (
//         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {teamRows.map(({ t, color, pct, c, b }, i) => {
//             const total = b.won + b.pending + b.lost;
//             return (
//               <article key={t.id} className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md print:break-inside-avoid">
//                 <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
//                 <div className="flex items-start justify-between gap-3">
//                   <MaybeLink to={`/teams/${t.id}`} disabled={readOnly} className="min-w-0">
//                     <p className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
//                       <span className="grid h-5 min-w-5 place-items-center rounded-md px-1 text-[11px]" style={{ background: tint(color), color }}>{n(i + 1)}</span>
//                       المركز
//                     </p>
//                     <h3 className="mt-1 truncate text-lg font-extrabold text-slate-800">{teamLabel(t)}</h3>
//                     <p className="truncate text-xs font-semibold text-slate-400">{t.manager} · {n(t.engineers.length)} مهندس</p>
//                   </MaybeLink>
//                   <RadialGauge value={pct} size={72} stroke={8} color={color} ready={ready} label="" />
//                 </div>

//                 <div className="mt-4 grid grid-cols-4 gap-1.5">
//                   {[['مشاريع', c.total, 'text-slate-700'], ['جارية', c.running, 'text-sky-600'], ['منتهية', c.finished, 'text-brand-700'], ['متأخر', c.late, c.late ? 'text-rose-600' : 'text-slate-300']].map(([l, v, tone]) => (
//                     <div key={l} className="rounded-xl bg-slate-50 py-2 text-center">
//                       <p className={`text-base font-extrabold tabular-nums ${tone}`}>{n(v)}</p>
//                       <p className="text-[11px] font-semibold text-slate-400">{l}</p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-4">
//                   <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
//                     {total > 0 && ['won', 'pending', 'lost'].map((k) => b[k] > 0 && (
//                       <div key={k} className="transition-[flex-grow] duration-1000 ease-out motion-reduce:transition-none" style={{ flexGrow: ready ? b[k] : 0, flexBasis: 0, background: STATES[k].color }} />
//                     ))}
//                   </div>
//                   <div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-400">
//                     <span className="truncate">{total ? `${n(b.won)} ${lab('won')} · ${n(b.lost)} ${lab('lost')}` : 'لا توجد تسليمات'}</span>
//                     <span className="shrink-0 font-extrabold tabular-nums text-emerald-600">{b.decided ? `${n(b.winPct)}%` : '—'}</span>
//                   </div>
//                 </div>
//               </article>
//             );
//           })}
//         </div>
//       )}

//       {/* ===== الحركات + المواعيد + الجولات ===== */}
//       <SectionTitle eyebrow="النشاط" title="آخر الحركات والمواعيد" hint="تسليمات وجولات ومواعيد قريبة" />
//       <div className="grid gap-4 lg:grid-cols-12">
//         <Panel className="lg:col-span-7" delay={60} title="سجل الحركات" subtitle={`آخر تسليمات المشاريع والجولات · ${PERIOD_TEXT[period]}`}>
//           {activity.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد حركات في هذه الفترة</p> : (
//             <ol className="relative space-y-1">
//               {activity.map((a) => {
//                 const isRound = a.kind === 'round';
//                 const color = isRound ? '#6F7DD0' : STATES[a.state]?.color || '#94A3B8';
//                 const stateLabel = isRound ? 'جولة اتسلّمت' : lab(a.state);
//                 return (
//                   <li key={a.key}>
//                     <MaybeLink to={`/engineers/${a.item.engineer.id}?p=${a.item.p.id}`} disabled={readOnly} className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-brand-50/50">
//                       <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: tint(color), color }}>
//                         {isRound ? <LayersIcon className="h-5 w-5" /> : a.state === 'won' ? <TrophyIcon /> : <CheckIcon />}
//                       </span>
//                       <span className="min-w-0 flex-1">
//                         <span className="block truncate text-sm font-extrabold text-slate-800">{a.title}</span>
//                         <span className="block truncate text-xs text-slate-400">{a.project ? `${a.project} · ` : ''}{a.who}</span>
//                       </span>
//                       <span className="flex shrink-0 flex-col items-end gap-1">
//                         <Chip color={color}>{stateLabel}</Chip>
//                         <span className="text-[11px] font-semibold tabular-nums text-slate-400">{fmtDate(a.date)}</span>
//                       </span>
//                     </MaybeLink>
//                   </li>
//                 );
//               })}
//             </ol>
//           )}
//         </Panel>

//         <div className="space-y-4 lg:col-span-5">
//           <Panel delay={100} title="مواعيد قريبة" subtitle="المشاريع الجارية بالأقرب تسليمًا">
//             {upcoming.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">لا توجد مواعيد</p> : (
//               <ul className="space-y-2.5">
//                 {upcoming.map(({ item, k, pct }) => (
//                   <li key={item.p.id}>
//                     <MaybeLink to={`/engineers/${item.engineer.id}?p=${item.p.id}`} disabled={readOnly} className="block rounded-2xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="min-w-0">
//                           <span className="block truncate text-sm font-bold">{item.p.name || 'مشروع بدون اسم'}</span>
//                           <span className="block truncate text-xs text-slate-400">{item.engineer.name}</span>
//                         </span>
//                         <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${k < 0 ? 'bg-rose-50 text-rose-600 ring-rose-200' : k <= 7 ? 'bg-amber-50 text-amber-600 ring-amber-200' : 'bg-sky-50 text-sky-600 ring-sky-200'}`}>{whenText(k)}</span>
//                       </div>
//                       <div className="mt-2.5 flex items-center gap-2">
//                         <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${ready ? pct : 0}%` }} /></div>
//                         <span className="text-xs font-bold tabular-nums text-slate-500">{n(pct)}%</span>
//                       </div>
//                     </MaybeLink>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </Panel>

//           <Panel delay={140} title="جولات التسليم" subtitle={rounds.total ? `${n(rounds.done)} من ${n(rounds.total)} جولة اتسلّمت` : 'لسه مفيش جولات متسجّلة'}
//             action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><LayersIcon className="h-5 w-5" /></span>}>
//             {rounds.total > 0 ? (
//               <>
//                 <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
//                   <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-brand-600 transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${ready ? pctOf(rounds.done, rounds.total) : 0}%` }} />
//                 </div>
//                 <div className="mt-4 grid grid-cols-3 gap-2 text-center">
//                   {[['اتسلّمت', rounds.done, 'text-emerald-600'], ['لسه', rounds.total - rounds.done, 'text-brand-700'], ['متأخرة', rounds.overdue.length, rounds.overdue.length ? 'text-rose-600' : 'text-slate-400']].map(([l, v, c]) => (
//                     <div key={l} className="rounded-xl bg-slate-50 py-2.5">
//                       <p className={`text-xl font-extrabold tabular-nums ${c}`}>{n(v)}</p>
//                       <p className="text-xs font-semibold text-slate-400">{l}</p>
//                     </div>
//                   ))}
//                 </div>
//                 {rounds.overdue.length > 0 && (
//                   <ul className="mt-4 space-y-2">
//                     {rounds.overdue.slice(0, 3).map(({ item, r, k }) => (
//                       <li key={`${item.p.id}-${r.id}`}>
//                         <MaybeLink to={`/engineers/${item.engineer.id}?p=${item.p.id}`} disabled={readOnly} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-brand-200 hover:bg-brand-50/40">
//                           <span className="min-w-0 flex-1">
//                             <span className="block truncate text-sm font-bold">{r.title || 'جولة'}</span>
//                             <span className="block truncate text-xs text-slate-400">{item.p.name || 'مشروع بدون اسم'} · {item.engineer.name}</span>
//                           </span>
//                           <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200">{whenText(k)}</span>
//                         </MaybeLink>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </>
//             ) : <p className="py-4 text-center text-sm leading-relaxed text-slate-400">الجولات بتتضاف من صفحة المهندس جوه كل مشروع.</p>}
//           </Panel>
//         </div>
//       </div>

//       {/* ===== جدول المهندسين ===== */}
//       <SectionTitle eyebrow="المهندسين" title="أداء كل مهندس" hint="عدد المشاريع، الجارية، المنتهية، الفوز والخسارة" />
//       <Panel delay={100} title="أداء المهندسين" subtitle={`اضغطي على أي عمود للترتيب · ${n(shownRows.length)} مهندس · ${PERIOD_TEXT[period]}`}
//         action={(
//           <div className="flex flex-wrap gap-2 print:hidden">
//             <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم…" aria-label="بحث بالاسم" className="w-36 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
//             <select value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label="فلتر الفريق" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400">
//               <option value="all">كل الفرق</option>
//               {main.filter((t) => t.engineers.length).map((t) => <option key={t.id} value={t.id}>{teamLabel(t)}</option>)}
//             </select>
//           </div>
//         )}>
//         <div className="-mx-2 overflow-x-auto px-2">
//           <table className="w-full min-w-[48rem] text-sm">
//             <thead>
//               <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
//                 {COLS.map(([key, label]) => {
//                   const on = sort.key === key;
//                   return (
//                     <th key={key} className={`pb-3 ${key === 'name' ? 'text-start' : 'text-center'}`} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
//                       <button type="button" onClick={() => sortBy(key)} className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 transition hover:bg-brand-50 hover:text-brand-700 ${on ? 'text-brand-700' : ''}`}>
//                         {label}
//                         <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${on ? (sort.dir === 1 ? 'rotate-180' : '') : 'opacity-0'}`} />
//                       </button>
//                     </th>
//                   );
//                 })}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {shownRows.map((r) => (
//                 <tr key={r.e.id} className="transition-colors hover:bg-brand-50/40">
//                   <td className="py-3">
//                     <MaybeLink to={`/engineers/${r.e.id}`} disabled={readOnly} className="flex items-center gap-3">
//                       <Avatar engineer={r.e} size={36} />
//                       <span className="min-w-0">
//                         <span className="block truncate font-bold">{r.name}</span>
//                         <span className="block truncate text-xs text-slate-400">{teamLabel(r.t)} · {r.t.manager}</span>
//                       </span>
//                     </MaybeLink>
//                   </td>
//                   <td className="px-2">
//                     <div className="mx-auto flex max-w-[8rem] items-center gap-2">
//                       <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${ready ? r.tasksPct : 0}%` }} /></div>
//                       <span className="text-xs font-bold tabular-nums text-slate-500">{n(r.tasksPct)}%</span>
//                     </div>
//                   </td>
//                   <td className="text-center font-extrabold tabular-nums text-slate-700">{n(r.projects)}</td>
//                   <td className="text-center font-extrabold tabular-nums text-sky-600">{n(r.running)}</td>
//                   <td className="text-center font-extrabold tabular-nums text-brand-700">{n(r.delivered)}</td>
//                   <td className="text-center tabular-nums">{n(r.won)}</td>
//                   <td className="text-center tabular-nums">{n(r.lost)}</td>
//                   <td className="text-center font-extrabold tabular-nums text-emerald-600">{r.winPct === null ? '—' : `${n(r.winPct)}%`}</td>
//                   <td className="text-center">
//                     {r.late ? <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200">{n(r.late)}</span> : <span className="text-slate-300">—</span>}
//                   </td>
//                 </tr>
//               ))}
//               {shownRows.length === 0 && <tr><td colSpan={COLS.length} className="py-10 text-center text-slate-400">لا يوجد مهندسين</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       </Panel>

//       {/* ===== قسم السعودية ===== */}
//       {saudi.map(({ t, pct, c, rows }) => (
//         <div key={t.id}>
//           <SectionTitle icon="🇸🇦" eyebrow="قسم السعودية" title={`${teamLabel(t)} (مدير: ${t.manager})`} />
//           <div className="grid gap-4 lg:grid-cols-12 print:break-inside-avoid">
//             <Panel className="lg:col-span-4" delay={60} title="نسبة إنجاز المهام" subtitle={`${n(c.total)} مشروع`}>
//               <div className="flex flex-col items-center gap-4">
//                 <RadialGauge value={pct} size={150} stroke={13} ready={ready} label="إنجاز" color="#10B981" trackColor="#ECFDF5" textClass="text-emerald-600" />
//                 <div className="grid w-full grid-cols-2 gap-2">
//                   <Tile label="إجمالي المشاريع" value={c.total} />
//                   <Tile label="جارية" value={c.running} tone="text-sky-600" />
//                   <Tile label={lab('won')} value={c.won} tone="text-emerald-600" />
//                   <Tile label={lab('lost')} value={c.lost} tone="text-rose-600" />
//                 </div>
//               </div>
//             </Panel>
//             <Panel className="lg:col-span-8" delay={100} title="مهندسو الفريق" subtitle="عدد المشاريع والنتائج">
//               <MiniEngTable rows={rows} readOnly={readOnly} />
//             </Panel>
//           </div>
//         </div>
//       ))}

//       {/* ===== قسم الحصر ===== */}
//       {hasrSections.map(({ t, list, c }) => (
//         <div key={t.id}>
//           <SectionTitle icon="📐" eyebrow="قسم الحصر" title={`${teamLabel(t)} (مدير: ${t.manager})`} />
//           <div className="grid gap-4 lg:grid-cols-12 print:break-inside-avoid">
//             <Panel className="lg:col-span-5" delay={60} title="حالة مشاريع الحصر" subtitle={`${n(c.total)} مشروع وارد`}>
//               <DonutChart
//                 centerValue={n(c.total)} centerLabel="مشروع وارد"
//                 segments={Object.entries(HASR_STATES).map(([k, s]) => ({ label: s.label, color: s.color, value: c[k] }))}
//               />
//               <div className="mt-4 grid grid-cols-2 gap-2">
//                 {Object.entries(HASR_STATES).map(([k, s]) => (
//                   <div key={k} className="rounded-2xl px-3 py-3 text-center" style={{ background: tint(s.color, '14') }}>
//                     <p className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{n(c[k])}</p>
//                     <p className="text-xs font-semibold text-slate-500">{s.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </Panel>
//             <Panel className="lg:col-span-7" delay={100} title="المشاريع الواردة" subtitle="الاسم · التاريخ · حالة الحصر">
//               {list.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد مشاريع واردة</p> : (
//                 <ul className="divide-y divide-slate-50">
//                   {list.map((p, i) => {
//                     const k = hasrState(p);
//                     const note = p.hasrNotes ?? p.notes;
//                     return (
//                       <li key={p.id ?? i} className="flex items-start gap-3 py-3">
//                         <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: HASR_STATES[k].color }} />
//                         <span className="min-w-0 flex-1">
//                           <span className="block truncate text-sm font-extrabold text-slate-800">{p.name || 'مشروع بدون اسم'}</span>
//                           <span className="block text-xs font-semibold tabular-nums text-slate-400">{fmtDate(p.date ?? p.deliveryDate)}</span>
//                           {note && <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-500">{note}</span>}
//                         </span>
//                         <Chip color={HASR_STATES[k].color}>{HASR_STATES[k].label}</Chip>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               )}
//             </Panel>
//           </div>
//         </div>
//       ))}
//     </>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import Segmented from '../components/ui/Segmented';
import StackedColumns from '../components/charts/StackedColumns';
import DonutChart from '../components/charts/DonutChart';
import RadialGauge from '../components/charts/RadialGauge';
import RadarChart from '../components/charts/RadarChart';
import { ProjectsIcon, ClockIcon, CheckIcon, TrophyIcon, ChevronDownIcon } from '../components/ui/Icons';
import { LayersIcon } from '../components/engineer/EngineerIcons';
import { mainTeams, teamLabel } from '../utils/helpers';
import { teamStats, pctOf, taskDurationHours } from '../utils/stats';
import {
  n, STATES, stateOf, daysLeft, inPeriod, collectProjects,
  periodResults, deliveriesTimeline, teamBreakdown,
} from '../utils/dashboardData';
import {
  isSaudiTeam, isHasrTeam, projectCounts, tasksOf, upcomingDeadlines, recentActivity,
  fmtDate, HASR_STATES, hasrState, hasrProjectsOf, hasrCounts,
} from '../utils/reportsData';
import { isReportsViewer } from '../utils/roles';

const PERIODS = [['week', 'آخر ٧ أيام'], ['month', 'آخر ٣٠ يوم'], ['all', 'كل الفترات']];
const PERIOD_TEXT = { week: 'آخر ٧ أيام', month: 'آخر ٣٠ يوم', all: 'كل الفترات' };
const PALETTE = ['#6F7DD0', '#38BDF8', '#F59E0B', '#10B981', '#FB7185', '#A78BFA'];
const PAGE_SIZE = 50;          // الصفحات بتبدأ بعد ٥٠ مهندس
const SCROLL_AFTER = 10;       // الـ scroll بيبدأ بعد ١٠ صفوف (الصف ≈ ٣.٨ rem + الهيدر)
const TABLE_MAX_H = '41rem';
const COLS = [
  ['name', 'المهندس'], ['tasksPct', 'المهام المنجزة / الإجمالي · %'], ['projects', 'المشاريع'], ['running', 'جارية'],
  ['delivered', 'منتهية'], ['won', 'فوز'], ['lost', 'خسارة'], ['winPct', 'نسبة الفوز'], ['late', 'متأخر'],
];

const whenText = (k) => (k < 0 ? `متأخر ${n(-k)} يوم` : k === 0 ? 'اليوم' : `بعد ${n(k)} يوم`);
const tint = (hex, a = '1A') => `${hex}${a}`;

/* رابط يتحول لعنصر عادي لو المستخدم "مشاهد تقارير" (قراءة فقط) */
function MaybeLink({ to, disabled, className, children }) {
  return disabled
    ? <div className={className}>{children}</div>
    : <Link to={to} className={className}>{children}</Link>;
}

function SectionTitle({ eyebrow, title, hint, icon }) {
  return (
    <div className="mb-3 mt-9 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-lg text-brand-600">{icon}</span>}
        <div>
          {eyebrow && <p className="text-xs font-extrabold tracking-wide text-brand-500">{eyebrow}</p>}
          <h2 className="text-lg font-extrabold text-slate-800 sm:text-xl">{title}</h2>
        </div>
      </div>
      {hint && <p className="hidden text-xs font-semibold text-slate-400 sm:block">{hint}</p>}
    </div>
  );
}

function Chip({ color, children }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: tint(color), color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function Tile({ label, value, tone = 'text-brand-700' }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
      <p className={`text-2xl font-extrabold tabular-nums ${tone}`}>{n(value)}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

/* جدول مهندسين مبسّط (للسعودية) */
function MiniEngTable({ rows, readOnly }) {
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
            <th className="pb-3 text-start">المهندس</th>
            {['المهام المنجزة / الإجمالي · %', 'المشاريع', 'جارية', 'منتهية', 'فوز', 'خسارة'].map((h) => <th key={h} className="pb-3 text-center">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r) => (
            <tr key={r.e.id} className="hover:bg-brand-50/40">
              <td className="py-3">
                <MaybeLink to={`/engineers/${r.e.id}`} disabled={readOnly} className="flex items-center gap-3">
                  <Avatar engineer={r.e} size={32} />
                  <span className="truncate font-bold">{r.e.name}</span>
                </MaybeLink>
              </td>
              <td className="text-center font-extrabold tabular-nums text-brand-700">{n(r.tasks.done)} / {n(r.tasks.total)} · {n(r.tasks.pct)}%</td>
              <td className="text-center tabular-nums">{n(r.c.total)}</td>
              <td className="text-center tabular-nums text-sky-600">{n(r.c.running)}</td>
              <td className="text-center tabular-nums">{n(r.c.finished)}</td>
              <td className="text-center tabular-nums text-emerald-600">{n(r.c.won)}</td>
              <td className="text-center tabular-nums text-rose-600">{n(r.c.lost)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">لا يوجد مهندسين</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const { teams, engineers, tasks, outcomeLabel, hasr } = useData();
  const { session } = useAuth();
  const readOnly = isReportsViewer(session?.role);
  const [period, setPeriod] = useState('all');
  const [teamId, setTeamId] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'delivered', dir: -1 });
  const [page, setPage] = useState(1);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const lab = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, STATES[k].label) : STATES[k].label);

  const main = useMemo(() => mainTeams(teams), [teams]);
  const all = useMemo(() => collectProjects(main, engineers), [main, engineers]);
  // السعودية = أي فريق مش من الفرق الرئيسية ومش فريق الحصر (من غير الاعتماد على اسم/نوع معيّن).
  // isSaudiTeam فضلت لترتيب الأقسام بس: لو في أكتر من فريق، اللي اسمه/نوعه سعودي يظهر الأول.
  const saudiTeams = useMemo(() => {
    const mainIds = new Set(main.map((t) => t.id));
    return teams
      .filter((t) => !mainIds.has(t.id) && !isHasrTeam(t))
      .sort((a, b) => Number(isSaudiTeam(b)) - Number(isSaudiTeam(a)));
  }, [teams, main]);
  const hasrTeams = useMemo(() => teams.filter(isHasrTeam), [teams]);

  /* ---------- مؤشرات عامة (القسم الرئيسي) ---------- */
  const counts = useMemo(() => projectCounts(all), [all]);
  const pr = useMemo(() => periodResults(all, period), [all, period]);
  const timeline = useMemo(() => deliveriesTimeline(all, period), [all, period]);
  const taskTotals = useMemo(() => {
    const t = main.reduce((a, team) => {
      const s = teamStats(team, engineers, tasks);
      return { done: a.done + s.done, total: a.total + s.total, completedHours: a.completedHours + s.completedHours };
    }, { done: 0, total: 0, completedHours: 0 });
    return { ...t, left: t.total - t.done, pct: pctOf(t.done, t.total) };
  }, [main, engineers, tasks]);
  const avgRunning = useMemo(() => {
    const run = all.filter(({ p }) => !p.finished);
    return run.length ? tasksOf(run).pct : 0;
  }, [all]);

  /* ---------- الجولات ---------- */
  const rounds = useMemo(() => {
    let total = 0; let done = 0; const overdue = [];
    all.forEach((item) => (item.p.rounds || []).forEach((r) => {
      total += 1;
      if (r.delivered) { done += 1; return; }
      const k = daysLeft(r.date);
      if (!item.p.finished && k !== null && k < 0) overdue.push({ item, r, k });
    }));
    overdue.sort((a, b) => a.k - b.k);
    return { total, done, overdue };
  }, [all]);

  /* ---------- مقارنة الفرق ---------- */
  const teamRows = useMemo(
    () => main
      .filter((t) => t.engineers.length)
      .map((t, i) => {
        const ids = new Set(t.engineers.map((e) => e.id));
        const mine = all.filter((x) => ids.has(x.engineer.id));
        const s = teamStats(t, engineers, tasks);
        return {
          t, color: t.color || PALETTE[i % PALETTE.length], s, pct: pctOf(s.done, s.total),
          c: projectCounts(mine), b: teamBreakdown(all, t.id, period),
        };
      })
      .sort((a, b) => b.b.won - a.b.won || b.b.delivered.length - a.b.delivered.length),
    [main, engineers, tasks, all, period],
  );

  const radar = useMemo(() => {
    const maxDel = Math.max(1, ...teamRows.map((r) => r.b.delivered.length));
    return {
      axes: ['إنجاز المهام', 'نسبة الفوز', 'إغلاق المشاريع', 'الالتزام بالمواعيد', 'حجم التسليمات'],
      series: teamRows.map((r) => ({
        name: teamLabel(r.t),
        color: r.color,
        values: [
          r.pct,
          r.c.winPct ?? 0,
          pctOf(r.c.finished, r.c.total),
          r.c.running ? Math.round((1 - r.c.late / r.c.running) * 100) : 100,
          Math.round((r.b.delivered.length / maxDel) * 100),
        ],
      })),
    };
  }, [teamRows]);

  /* ---------- الحركات والمواعيد ---------- */
  const activity = useMemo(() => recentActivity(all, period), [all, period]);
  const upcoming = useMemo(() => upcomingDeadlines(all), [all]);

  /* ---------- أداء المهندسين ---------- */
  const engRows = useMemo(
    () => main.flatMap((t) => t.engineers.map((e) => {
      const mine = all.filter((x) => x.engineer.id === e.id);
      const c = projectCounts(mine);
      const inP = { pending: 0, won: 0, lost: 0 };
      mine.forEach(({ p }) => { if (p.finished && inPeriod(p.deliveryDate, period)) inP[stateOf(p)] += 1; });
      const decided = inP.won + inP.lost;
      return {
        e, t, name: e.name,
        ...tasksOf(mine), tasksPct: tasksOf(mine).pct,
        projects: c.total, running: c.running, late: c.late,
        delivered: inP.pending + decided, won: inP.won, lost: inP.lost, pending: inP.pending,
        winPct: decided ? Math.round((inP.won / decided) * 100) : null,
      };
    })),
    [main, all, period],
  );

  const shownRows = useMemo(() => {
    const val = (r) => (r[sort.key] === null ? -Infinity : r[sort.key]);
    const term = q.trim();
    return engRows
      .filter((r) => (teamId === 'all' || r.t.id === teamId) && (!term || r.name.includes(term)))
      .sort((a, b) => (sort.key === 'name' ? sort.dir * a.name.localeCompare(b.name, 'ar') : sort.dir * (val(a) - val(b))));
  }, [engRows, teamId, sort, q]);

  /* ---------- ترقيم صفحات الجدول: scroll بعد ١٠ صفوف، وصفحات بعد ٥٠ ---------- */
  const pageCount = Math.max(1, Math.ceil(shownRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => shownRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [shownRows, safePage]);
  useEffect(() => { setPage(1); }, [teamId, q, sort, period]);

  const sortBy = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }));

  /* ---------- قسم السعودية ---------- */
  const saudi = useMemo(() => saudiTeams.map((t) => {
    const items = collectProjects([t], engineers);
    const s = teamStats(t, engineers, tasks);
    const rows = t.engineers.map((e) => {
      const mine = items.filter((x) => x.engineer.id === e.id);
      return { e, c: projectCounts(mine), tasks: tasksOf(mine) };
    });
    return { t, pct: pctOf(s.done, s.total), taskDone: s.done, taskTotal: s.total, completedHours: s.completedHours, c: projectCounts(items), rows };
  }), [saudiTeams, engineers, tasks]);
  const teamHoursRows = [
    ...teamRows.map(({ t, color, s, pct }) => ({ team: t, color, hours: s.completedHours, done: s.done, total: s.total, pct })),
    ...saudi.map(({ t, completedHours, taskDone, taskTotal, pct }) => ({ team: t, color: t.color || '#38BDF8', hours: completedHours, done: taskDone, total: taskTotal, pct })),
  ].sort((a, b) => b.hours - a.hours);
  const maxTeamHours = Math.max(1, ...teamHoursRows.map((row) => row.hours));
  const allTeamHours = teamHoursRows.reduce((sum, row) => sum + row.hours, 0);

  /* ---------- قسم الحصر ---------- */
  const hasrSections = useMemo(() => hasrTeams.map((t) => {
    const list = hasrProjectsOf(t, hasr);
    return { t, list, c: hasrCounts(list) };
  }), [hasrTeams, hasr]);

  /* ---------- تصدير CSV (بيفتح عربي صح في Excel) ---------- */
  const exportCsv = () => {
    const head = ['المهندس', 'الفريق', 'المهام المنجزة', 'إجمالي المهام', 'إنجاز المهام %', 'المشاريع', 'جارية', 'منتهية', 'فوز', 'خسارة', 'معلق', 'نسبة الفوز %', 'متأخر'];
    const lines = shownRows.map((r) => [r.name, teamLabel(r.t), r.done, r.total, r.tasksPct, r.projects, r.running, r.delivered, r.won, r.lost, r.pending, r.winPct ?? '', r.late]);
    const csv = `\uFEFF${[head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `تقرير-المهندسين-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const donutProjects = [
    { label: 'جارية في الميعاد', color: '#38BDF8', value: counts.running - counts.late },
    { label: 'جارية ومتأخرة', color: '#FB7185', value: counts.late },
    { label: 'منتهية', color: '#10B981', value: counts.finished },
  ];

  return (
    <>
      <PageHeader back={!readOnly} title="التقارير" subtitle="أداء القسم والفرق والمهندسين في مكان واحد" />

      {/* ===== أدوات التقرير ===== */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="btn-primary">تصدير Excel (CSV)</button>
          <button type="button" onClick={() => window.print()} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50">طباعة</button>
        </div>
      </div>

      {/* ===== Hero: نظرة عامة على القسم الرئيسي ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-lg sm:p-7 print:break-inside-avoid">
        <span aria-hidden className="pointer-events-none absolute -start-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 end-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            <RadialGauge value={taskTotals.pct} size={168} stroke={14} color="#fff" trackColor="rgba(255,255,255,.2)" textClass="text-white" label="نسبة الإنجاز العامة" ready={ready} />
            <div>
              <p className="text-xs font-extrabold tracking-wide text-white/70">نظرة عامة على القسم الرئيسي</p>
              <h2 className="mt-1 text-2xl font-extrabold">نسبة الإنجاز العامة</h2>
              <p className="mt-1 text-sm text-white/75">{n(main.filter((t) => t.engineers.length).length)} فرق · {n(counts.total)} مشروع</p>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[['مهام إجمالية', taskTotals.total], ['منجزة', taskTotals.done], ['متبقية', taskTotals.left], ['ساعات محسوبة', `${n(taskTotals.completedHours)} س`]].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-white/12 px-3 py-3.5 text-center ring-1 ring-white/20 backdrop-blur">
                  <p className="text-2xl font-extrabold tabular-nums sm:text-3xl">{n(v)}</p>
                  <p className="mt-0.5 text-xs font-semibold text-white/75">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {teamRows.map((r) => (
                <div key={r.t.id} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="flex min-w-0 items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} /><span className="truncate">{teamLabel(r.t)}</span></span>
                    <span className="tabular-nums">{n(r.pct)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${ready ? r.pct : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== مؤشرات ===== */}
      <div className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard featured delay={0} icon={<ProjectsIcon />} label="إجمالي المشاريع" value={counts.total} hint={`${n(counts.running)} جارية · ${n(counts.finished)} منتهية`} />
        <StatCard delay={60} icon={<ClockIcon />} label="مشاريع جارية" value={counts.running} tone="sky" hint={counts.running ? `متوسط الإنجاز ${n(avgRunning)}%` : 'لا توجد مشاريع جارية'} />
        <StatCard delay={120} icon={<TrophyIcon />} label={lab('won')} value={counts.won} tone="amber" hint={counts.decided ? `من ${n(counts.decided)} نتيجة نهائية` : 'لا نتائج نهائية بعد'} />
        <StatCard delay={180} icon={<CheckIcon />} label={lab('lost')} value={counts.lost} hint={counts.lost ? 'مشاريع خسرناها' : 'لا توجد خسائر'} />
        <StatCard delay={0} icon={<CheckIcon />} label="تم تسليمها (الفترة)" value={pr.delivered} hint={`${n(pr.won)} فوز · ${n(pr.lost)} خسارة · ${n(pr.pending)} معلق`} />
        <StatCard delay={60} icon={<TrophyIcon />} label="نسبة الفوز (الفترة)" value={pr.winPct} suffix="%" tone="amber" hint={pr.decided ? `من ${n(pr.decided)} نتيجة نهائية` : 'لا نتائج نهائية في الفترة'} />
        <StatCard delay={120} icon={<ProjectsIcon />} label="مشاريع متأخرة" value={counts.late} hint={counts.late ? 'عدّى موعد تسليمها' : 'كله في الميعاد'} />
        <StatCard delay={180} icon={<LayersIcon className="h-5 w-5" />} label="جولات التسليم" value={rounds.total} tone="sky" hint={`${n(rounds.done)} اتسلّمت · ${n(rounds.overdue.length)} متأخرة`} />
      </div>

      {/* ===== Donuts ===== */}
      <SectionTitle eyebrow="توزيعات" title="الصورة الكاملة في دوائر" hint={PERIOD_TEXT[period]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel delay={40} title="حالة المشاريع" subtitle={`${n(counts.total)} مشروع`}>
          <DonutChart centerValue={n(counts.total)} centerLabel="مشروع" segments={donutProjects} />
        </Panel>
        <Panel delay={80} title="نتائج التسليم" subtitle={PERIOD_TEXT[period]}>
          <DonutChart
            centerValue={n(pr.delivered)} centerLabel="مشروع مسلّم"
            segments={['won', 'pending', 'lost'].map((k) => ({ label: lab(k), color: STATES[k].color, value: pr[k] }))}
          />
        </Panel>
        <Panel delay={120} title="المهام" subtitle={`${n(taskTotals.total)} مهمة إجمالًا`}>
          <DonutChart
            centerValue={`${n(taskTotals.pct)}%`} centerLabel="منجزة"
            segments={[{ label: 'منجزة', color: '#10B981', value: taskTotals.done }, { label: 'متبقية', color: '#CBD5E1', value: taskTotals.left }]}
          />
        </Panel>
        <Panel delay={160} title="مساهمة الفرق" subtitle="المهام المنجزة لكل فريق">
          <DonutChart
            centerValue={n(taskTotals.done)} centerLabel="مهمة منجزة"
            segments={teamRows.map((r) => ({ label: teamLabel(r.t), color: r.color, value: r.s.done }))}
          />
        </Panel>
      </div>

      {/* ===== الرسوم الزمنية + الرادار ===== */}
      <div className="mt-5 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" delay={60} title="التسليمات عبر الزمن" subtitle={`${PERIOD_TEXT[period]} · الألوان = نتيجة المشروع`}>
          <StackedColumns data={timeline} />
        </Panel>
        <Panel className="lg:col-span-5" delay={120} title="رادار مقارنة الفرق" subtitle="٥ محاور من ٠ إلى ١٠٠">
          {radar.series.length ? <RadarChart axes={radar.axes} series={radar.series} /> : <p className="py-8 text-center text-sm text-slate-400">لا توجد فرق بعد</p>}
        </Panel>
      </div>

      {/* ===== مقارنة الفرق ===== */}
      <SectionTitle eyebrow="الفرق" title="مقارنة أداء الفرق" hint={`مرتبة بعدد مرات الفوز · ${PERIOD_TEXT[period]}`} />
      {teamRows.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد فرق بعد</p> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teamRows.map(({ t, color, pct, c, b }, i) => {
            const total = b.won + b.pending + b.lost;
            return (
              <article key={t.id} className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md print:break-inside-avoid">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
                <div className="flex items-start justify-between gap-3">
                  <MaybeLink to={`/teams/${t.id}`} disabled={readOnly} className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
                      <span className="grid h-5 min-w-5 place-items-center rounded-md px-1 text-[11px]" style={{ background: tint(color), color }}>{n(i + 1)}</span>
                      المركز
                    </p>
                    <h3 className="mt-1 truncate text-lg font-extrabold text-slate-800">{teamLabel(t)}</h3>
                    <p className="truncate text-xs font-semibold text-slate-400">{t.manager} · {n(t.engineers.length)} مهندس</p>
                  </MaybeLink>
                  <RadialGauge value={pct} size={72} stroke={8} color={color} ready={ready} label="" />
                </div>

                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {[['مشاريع', c.total, 'text-slate-700'], ['جارية', c.running, 'text-sky-600'], ['منتهية', c.finished, 'text-brand-700'], ['متأخر', c.late, c.late ? 'text-rose-600' : 'text-slate-300']].map(([l, v, tone]) => (
                    <div key={l} className="rounded-xl bg-slate-50 py-2 text-center">
                      <p className={`text-base font-extrabold tabular-nums ${tone}`}>{n(v)}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
                    {total > 0 && ['won', 'pending', 'lost'].map((k) => b[k] > 0 && (
                      <div key={k} className="transition-[flex-grow] duration-1000 ease-out motion-reduce:transition-none" style={{ flexGrow: ready ? b[k] : 0, flexBasis: 0, background: STATES[k].color }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-400">
                    <span className="truncate">{total ? `${n(b.won)} ${lab('won')} · ${n(b.lost)} ${lab('lost')}` : 'لا توجد تسليمات'}</span>
                    <span className="shrink-0 font-extrabold tabular-nums text-emerald-600">{b.decided ? `${n(b.winPct)}%` : '—'}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===== ساعات المهام المنجزة حسب الفريق ===== */}
      <SectionTitle eyebrow="وقت العمل" title="ساعات المهام المنجزة حسب الفريق" hint="تُحسب من وقت بداية المهمة إلى موعد انتهائها، للمهام المنجزة فقط" />
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/45 to-sky-50/60 p-5 shadow-soft sm:p-7 print:break-inside-avoid">
        <div aria-hidden className="pointer-events-none absolute -end-14 -top-20 h-56 w-56 rounded-full bg-brand-200/35 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(13rem,.7fr)_minmax(12rem,1fr)_minmax(0,1.6fr)] lg:items-center">
          <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-brand-100 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-700">◷</span>
            <p className="mt-4 text-sm font-bold text-neutral-500">إجمالي ساعات كل الفرق</p>
            <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-brand-900">{n(allTeamHours)} <span className="text-base font-bold text-neutral-400">ساعة</span></p>
            <p className="mt-2 text-xs leading-5 text-neutral-400">تشمل فرق القسم الرئيسي وفريق السعودية. تُجمع مدة المهام المحددة كمنجزة.</p>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-4 ring-1 ring-brand-100">
            <DonutChart size={190} stroke={24} centerValue={n(allTeamHours)} centerLabel="ساعة إجمالًا" segments={teamHoursRows.filter((row) => row.hours > 0).map((row) => ({ label: teamLabel(row.team), color: row.color, value: row.hours }))} />
            <p className="mt-2 text-center text-xs font-semibold text-neutral-400">حصة كل فريق من إجمالي الساعات</p>
          </div>
          <div className="space-y-3">
            {teamHoursRows.length === 0 ? <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-neutral-400">لا توجد فرق لعرض ساعاتها بعد.</p> : teamHoursRows.map((row, i) => (
              <article key={row.team.id} className="rounded-2xl bg-white/85 p-3.5 ring-1 ring-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-neutral-800">{isSaudiTeam(row.team) ? '🇸🇦 ' : ''}{teamLabel(row.team)}</h3><p className="mt-0.5 text-xs font-semibold text-neutral-400">{n(row.done)} من {n(row.total)} مهمة · {n(row.pct)}% إنجاز · {allTeamHours ? n(Math.round((row.hours / allTeamHours) * 100)) : 0}% من الساعات</p></div>
                  <p className="shrink-0 text-lg font-black tabular-nums text-brand-800">{n(row.hours)} <span className="text-xs font-bold text-neutral-400">س</span></p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label={`ساعات فريق ${teamLabel(row.team)} مقارنة بأعلى فريق`} aria-valuenow={Math.round((row.hours / maxTeamHours) * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${(row.hours / maxTeamHours) * 100}%`, background: `linear-gradient(90deg, ${row.color}88, ${row.color})`, transitionDelay: `${Math.min(i, 8) * 60}ms` }} />
                </div>
              </article>
            ))}
            {allTeamHours === 0 && <p className="px-2 text-xs leading-5 text-neutral-400">حددي وقت البداية والنهاية للمهام، ثم علّمي المهمة كمنجزة ليظهر مجموع ساعاتها هنا.</p>}
          </div>
        </div>
      </section>

      {/* ===== الحركات + المواعيد + الجولات ===== */}
      <SectionTitle eyebrow="النشاط" title="آخر الحركات والمواعيد" hint="تسليمات وجولات ومواعيد قريبة" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" delay={60} title="سجل الحركات" subtitle={`آخر تسليمات المشاريع والجولات · ${PERIOD_TEXT[period]}`}>
          {activity.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد حركات في هذه الفترة</p> : (
            <ol className="relative space-y-1">
              {activity.map((a) => {
                const isRound = a.kind === 'round';
                const color = isRound ? '#6F7DD0' : STATES[a.state]?.color || '#94A3B8';
                const stateLabel = isRound ? 'جولة اتسلّمت' : lab(a.state);
                return (
                  <li key={a.key}>
                    <MaybeLink to={`/engineers/${a.item.engineer.id}?p=${a.item.p.id}`} disabled={readOnly} className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-brand-50/50">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: tint(color), color }}>
                        {isRound ? <LayersIcon className="h-5 w-5" /> : a.state === 'won' ? <TrophyIcon /> : <CheckIcon />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-slate-800">{a.title}</span>
                        <span className="block truncate text-xs text-slate-400">{a.project ? `${a.project} · ` : ''}{a.who}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <Chip color={color}>{stateLabel}</Chip>
                        <span className="text-[11px] font-semibold tabular-nums text-slate-400">{fmtDate(a.date)}</span>
                      </span>
                    </MaybeLink>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <div className="space-y-4 lg:col-span-5">
          <Panel delay={100} title="مواعيد قريبة" subtitle="المشاريع الجارية بالأقرب تسليمًا">
            {upcoming.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">لا توجد مواعيد</p> : (
              <ul className="space-y-2.5">
                {upcoming.map(({ item, k, pct }) => (
                  <li key={item.p.id}>
                    <MaybeLink to={`/engineers/${item.engineer.id}?p=${item.p.id}`} disabled={readOnly} className="block rounded-2xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{item.p.name || 'مشروع بدون اسم'}</span>
                          <span className="block truncate text-xs text-slate-400">{item.engineer.name}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${k < 0 ? 'bg-rose-50 text-rose-600 ring-rose-200' : k <= 7 ? 'bg-amber-50 text-amber-600 ring-amber-200' : 'bg-sky-50 text-sky-600 ring-sky-200'}`}>{whenText(k)}</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${ready ? pct : 0}%` }} /></div>
                        <span className="text-xs font-bold tabular-nums text-slate-500">{n(pct)}%</span>
                      </div>
                    </MaybeLink>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel delay={140} title="جولات التسليم" subtitle={rounds.total ? `${n(rounds.done)} من ${n(rounds.total)} جولة اتسلّمت` : 'لسه مفيش جولات متسجّلة'}
            action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><LayersIcon className="h-5 w-5" /></span>}>
            {rounds.total > 0 ? (
              <>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-brand-600 transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${ready ? pctOf(rounds.done, rounds.total) : 0}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[['اتسلّمت', rounds.done, 'text-emerald-600'], ['لسه', rounds.total - rounds.done, 'text-brand-700'], ['متأخرة', rounds.overdue.length, rounds.overdue.length ? 'text-rose-600' : 'text-slate-400']].map(([l, v, c]) => (
                    <div key={l} className="rounded-xl bg-slate-50 py-2.5">
                      <p className={`text-xl font-extrabold tabular-nums ${c}`}>{n(v)}</p>
                      <p className="text-xs font-semibold text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                {rounds.overdue.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {rounds.overdue.slice(0, 3).map(({ item, r, k }) => (
                      <li key={`${item.p.id}-${r.id}`}>
                        <MaybeLink to={`/engineers/${item.engineer.id}?p=${item.p.id}`} disabled={readOnly} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-brand-200 hover:bg-brand-50/40">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{r.title || 'جولة'}</span>
                            <span className="block truncate text-xs text-slate-400">{item.p.name || 'مشروع بدون اسم'} · {item.engineer.name}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200">{whenText(k)}</span>
                        </MaybeLink>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : <p className="py-4 text-center text-sm leading-relaxed text-slate-400">الجولات بتتضاف من صفحة المهندس جوه كل مشروع.</p>}
          </Panel>
        </div>
      </div>

      {/* ===== جدول المهندسين ===== */}
      <SectionTitle eyebrow="المهندسين" title="أداء كل مهندس" hint="عدد المشاريع، الجارية، المنتهية، الفوز والخسارة" />
      <Panel delay={100} title="أداء المهندسين" subtitle={`اضغطي على أي عمود للترتيب · ${n(shownRows.length)} مهندس · ${PERIOD_TEXT[period]}`}
        action={(
          <div className="flex flex-wrap gap-2 print:hidden">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم…" aria-label="بحث بالاسم" className="w-36 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label="فلتر الفريق" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400">
              <option value="all">كل الفرق</option>
              {main.filter((t) => t.engineers.length).map((t) => <option key={t.id} value={t.id}>{teamLabel(t)}</option>)}
            </select>
          </div>
        )}>
        <div
          className="-mx-2 overflow-auto px-2 print:!max-h-none print:overflow-visible"
          style={pageRows.length > SCROLL_AFTER ? { maxHeight: TABLE_MAX_H } : undefined}
          tabIndex={pageRows.length > SCROLL_AFTER ? 0 : undefined}
          aria-label={pageRows.length > SCROLL_AFTER ? 'جدول أداء المهندسين — قابل للتمرير' : undefined}
        >
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                {COLS.map(([key, label]) => {
                  const on = sort.key === key;
                  return (
                    <th key={key} className={`pb-3 ${key === 'name' ? 'text-start' : 'text-center'}`} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => sortBy(key)} className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 transition hover:bg-brand-50 hover:text-brand-700 ${on ? 'text-brand-700' : ''}`}>
                        {label}
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${on ? (sort.dir === 1 ? 'rotate-180' : '') : 'opacity-0'}`} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageRows.map((r) => (
                <tr key={r.e.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="py-3">
                    <MaybeLink to={`/engineers/${r.e.id}`} disabled={readOnly} className="flex items-center gap-3">
                      <Avatar engineer={r.e} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{r.name}</span>
                        <span className="block truncate text-xs text-slate-400">{teamLabel(r.t)} · {r.t.manager}</span>
                      </span>
                    </MaybeLink>
                  </td>
                  <td className="px-2">
                    <div className="mx-auto flex max-w-[11rem] flex-col items-center gap-1">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 motion-reduce:transition-none" style={{ width: `${ready ? r.tasksPct : 0}%` }} /></div>
                      <span className="text-xs font-bold tabular-nums text-slate-500">{n(r.done)} / {n(r.total)} · {n(r.tasksPct)}%</span>
                    </div>
                  </td>
                  <td className="text-center font-extrabold tabular-nums text-slate-700">{n(r.projects)}</td>
                  <td className="text-center font-extrabold tabular-nums text-sky-600">{n(r.running)}</td>
                  <td className="text-center font-extrabold tabular-nums text-brand-700">{n(r.delivered)}</td>
                  <td className="text-center tabular-nums">{n(r.won)}</td>
                  <td className="text-center tabular-nums">{n(r.lost)}</td>
                  <td className="text-center font-extrabold tabular-nums text-emerald-600">{r.winPct === null ? '—' : `${n(r.winPct)}%`}</td>
                  <td className="text-center">
                    {r.late ? <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200">{n(r.late)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {shownRows.length === 0 && <tr><td colSpan={COLS.length} className="py-10 text-center text-slate-400">لا يوجد مهندسين</td></tr>}
            </tbody>
          </table>
        </div>

        {shownRows.length > PAGE_SIZE && (
          <nav aria-label="صفحات جدول المهندسين" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 print:hidden">
            <p className="text-xs font-semibold text-slate-400">
              {n((safePage - 1) * PAGE_SIZE + 1)}–{n(Math.min(safePage * PAGE_SIZE, shownRows.length))} من {n(shownRows.length)} مهندس
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="rounded-xl px-3.5 py-2 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">السابق</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pageCount || Math.abs(p - safePage) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-slate-300">…</span>}
                    <button type="button" aria-current={p === safePage ? 'page' : undefined} onClick={() => setPage(p)} className={`h-9 min-w-9 rounded-xl px-2 text-sm font-extrabold tabular-nums transition ${p === safePage ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-500 ring-1 ring-slate-200 hover:bg-brand-50'}`}>{n(p)}</button>
                  </span>
                ))}
              <button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} className="rounded-xl px-3.5 py-2 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">التالي</button>
            </div>
          </nav>
        )}
      </Panel>

      {/* ===== قسم السعودية ===== */}
      {saudi.map(({ t, pct, taskDone, taskTotal, completedHours, c, rows }) => (
        <div key={t.id}>
          <SectionTitle icon="🇸🇦" eyebrow="قسم السعودية" title={`${teamLabel(t)} (مدير: ${t.manager})`} />
          <div className="grid gap-4 lg:grid-cols-12 print:break-inside-avoid">
            <Panel className="lg:col-span-4" delay={60} title="إنجاز المهام والساعات" subtitle={`${n(c.total)} مشروع · ${n(taskDone)} من ${n(taskTotal)} مهمة (${n(pct)}%)`}>
              <div className="flex flex-col items-center gap-4">
                <RadialGauge value={pct} size={150} stroke={13} ready={ready} label="إنجاز" color="#10B981" trackColor="#ECFDF5" textClass="text-emerald-600" />
                <div className="grid w-full grid-cols-2 gap-2">
                  <Tile label="إجمالي المشاريع" value={c.total} />
                  <Tile label="ساعات محسوبة للمهام" value={completedHours} tone="text-brand-700" />
                  <Tile label="جارية" value={c.running} tone="text-sky-600" />
                  <Tile label={lab('won')} value={c.won} tone="text-emerald-600" />
                  <Tile label={lab('lost')} value={c.lost} tone="text-rose-600" />
                </div>
              </div>
            </Panel>
            <Panel className="lg:col-span-8" delay={100} title="مهندسو الفريق" subtitle="عدد المشاريع والنتائج">
              <MiniEngTable rows={rows} readOnly={readOnly} />
            </Panel>
          </div>
        </div>
      ))}

      {/* ===== قسم الحصر ===== */}
      {hasrSections.map(({ t, list, c }) => (
        <div key={t.id}>
          <SectionTitle icon="📐" eyebrow="قسم الحصر" title={`${teamLabel(t)} (مدير: ${t.manager})`} />
          <div className="grid gap-4 lg:grid-cols-12 print:break-inside-avoid">
            <Panel className="lg:col-span-5" delay={60} title="حالة مشاريع الحصر" subtitle={`${n(c.total)} مشروع وارد`}>
              <DonutChart
                centerValue={n(c.total)} centerLabel="مشروع وارد"
                segments={Object.entries(HASR_STATES).map(([k, s]) => ({ label: s.label, color: s.color, value: c[k] }))}
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(HASR_STATES).map(([k, s]) => (
                  <div key={k} className="rounded-2xl px-3 py-3 text-center" style={{ background: tint(s.color, '14') }}>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{n(c[k])}</p>
                    <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="lg:col-span-7" delay={100} title="المشاريع الواردة" subtitle="الاسم · التاريخ · حالة الحصر">
              {list.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">لا توجد مشاريع واردة</p> : (
                <ul className="divide-y divide-slate-50">
                  {list.map((p, i) => {
                    const k = hasrState(p);
                    const note = p.hasrNotes ?? p.notes;
                    return (
                      <li key={p.id ?? i} className="flex items-start gap-3 py-3">
                        <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: HASR_STATES[k].color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-slate-800">{p.name || 'مشروع بدون اسم'}</span>
                          <span className="block text-xs font-semibold tabular-nums text-slate-400">{fmtDate(p.date ?? p.deliveryDate)}</span>
                          {note && <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-500">{note}</span>}
                        </span>
                        <Chip color={HASR_STATES[k].color}>{HASR_STATES[k].label}</Chip>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      ))}
    </>
  );
}

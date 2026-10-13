import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import DonutChart from '../components/charts/DonutChart';
import RadialGauge from '../components/charts/RadialGauge';
import Avatar from '../components/ui/Avatar';
import { collectProjects, n } from '../utils/dashboardData';
import { teamLabel } from '../utils/helpers';
import { projectStats } from '../utils/stats';
import { projectCounts } from '../utils/reportsData';
import PercentProgress from '../components/ui/PercentProgress';

const fmtDate = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'غير محدد';

function MetricBars({ title, subtitle, items, valueKey, format = (value) => n(value) }) {
  const max = valueKey === 'pct' ? 100 : Math.max(1, ...items.map((item) => Number(item[valueKey]) || 0));
  return <Panel title={title} subtitle={subtitle}>
    {items.length ? <div className="space-y-4">{items.slice(0, 8).map((item) => {
      const value = Number(item[valueKey]) || 0;
      const width = value ? Math.max(3, (value / max) * 100) : 0;
      return <div key={item.id}>
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-bold text-neutral-700">{item.label}</span><b className="shrink-0 tabular-nums text-brand-800">{format(value)}</b></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-800 transition-all duration-700" style={{ width: `${width}%` }} /></div>
      </div>;
    })}</div> : <div className="grid min-h-36 place-items-center text-sm text-neutral-400">لا توجد بيانات كافية للرسم بعد</div>}
  </Panel>;
}

export default function ScopedReportsPage() {
  const { session } = useAuth();
  const { teams, engineers, tasks } = useData();
  const isEngineer = session.role === 'engineer';
  const scope = useMemo(() => {
    if (isEngineer) {
      const team = teams.find((item) => item.engineers.some((engineer) => engineer.id === session.id));
      const engineer = team?.engineers.find((item) => item.id === session.id) || { id: session.id, name: session.name || 'المهندس' };
      return { team, members: [engineer], title: `تقاريري — ${engineer.name}` };
    }
    const team = teams.find((item) => item.id === session.id);
    return { team, members: team?.engineers || [], title: `تقارير ${team ? teamLabel(team) : 'الفريق'}` };
  }, [isEngineer, session.id, session.name, teams]);
  const items = useMemo(() => scope.team ? collectProjects([scope.team], engineers).filter((item) => !isEngineer || item.engineer.id === session.id) : [], [scope.team, engineers, isEngineer, session.id]);
  const totals = useMemo(() => items.reduce((result, { p }) => {
    const stats = projectStats(p, tasks);
    result.projects += 1;
    result.running += Number(!p.finished);
    result.delivered += Number(!!p.finished);
    result.done += stats.done;
    result.total += stats.total;
    return result;
  }, { projects: 0, running: 0, delivered: 0, done: 0, total: 0 }), [items, tasks]);
  const rows = useMemo(() => scope.members.map((engineer) => {
    const mine = items.filter((item) => item.engineer.id === engineer.id);
    const summary = mine.reduce((result, { p }) => {
      const stats = projectStats(p, tasks);
      result.projects += 1; result.running += Number(!p.finished); result.done += stats.done; result.total += stats.total;
      return result;
    }, { projects: 0, running: 0, done: 0, total: 0 });
    return { engineer, ...summary, pct: summary.total ? Math.round(summary.done / summary.total * 100) : 0 };
  }), [scope.members, items, tasks]);
  const counts = projectCounts(items);
  const taskPct = totals.total ? Math.round(totals.done / totals.total * 100) : 0;
  const projectSegments = [
    { label: 'جارية', value: totals.running, color: '#414A9B' },
    { label: 'بانتظار نتيجة العميل', value: counts.pending, color: '#9AA3D8' },
    { label: 'فوز', value: counts.won, color: '#16A34A' },
    { label: 'خسارة', value: counts.lost, color: '#DC2626' },
  ];
  const taskSegments = [
    { label: 'مهام منجزة', value: totals.done, color: '#2A317A' },
    { label: 'مهام متبقية', value: Math.max(0, totals.total - totals.done), color: '#D9DDF4' },
  ];
  const completionBars = (isEngineer
    ? items.map(({ p }) => ({ id: p.id, label: p.name || 'مشروع بدون اسم', pct: projectStats(p, tasks).pct }))
    : rows.map(({ engineer, pct }) => ({ id: engineer.id, label: engineer.name, pct })))
    .sort((a, b) => b.pct - a.pct);
  const sizeBars = (isEngineer
    ? items.map(({ p }) => ({ id: p.id, label: p.name || 'مشروع بدون اسم', tasks: projectStats(p, tasks).total }))
    : rows.map(({ engineer, projects }) => ({ id: engineer.id, label: engineer.name, projects })))
    .sort((a, b) => (isEngineer ? b.tasks - a.tasks : b.projects - a.projects));

  return <>
    <PageHeader title={scope.title} subtitle={isEngineer ? 'ملخص مرئي لتقدم مشاريعك وإنجاز مهامك.' : 'نظرة أداء مركزة على مشاريع ومهام فريقك.'} />
    {!scope.team && <div className="card p-8 text-center text-sm text-neutral-500">تعذر تحديد الفريق المرتبط بالحساب.</div>}
    {scope.team && <>
      <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/60 p-5 shadow-sm sm:p-7">
        <span aria-hidden className="pointer-events-none absolute -end-12 -top-20 h-64 w-64 rounded-full bg-brand-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="max-w-xl text-center sm:text-start"><span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-100">لوحة الأداء · {isEngineer ? 'نطاقك الشخصي' : 'نطاق الفريق'}</span><h2 className="mt-3 text-2xl font-black leading-tight text-brand-950 sm:text-3xl">صورة واضحة للتقدم والإنجاز</h2><p className="mt-2 text-sm leading-6 text-neutral-600">تابعي حجم العمل ونسب الإنجاز وحالة التسليم في لوحة واحدة.</p><div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start"><span className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-neutral-600">{n(totals.projects)} مشروع</span><span className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-neutral-600">{n(totals.done)} مهمة مكتملة</span><span className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-neutral-600">إنجاز {n(taskPct)}%</span></div></div>
          <div className="shrink-0 rounded-full bg-white/80 p-3 shadow-sm ring-1 ring-brand-100"><RadialGauge value={taskPct} size={148} stroke={13} color="#2A317A" trackColor="#E6E8F5" label="إنجاز المهام" /></div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="▣" label="إجمالي المشاريع" value={totals.projects} hint={`${n(totals.running)} جاري · ${n(totals.delivered)} تم تسليمه`} featured />
        <StatCard icon="✓" label="إنجاز المهام" value={`${n(totals.done)} / ${n(totals.total)}`} hint={`${n(taskPct)}% من إجمالي المهام`} />
        <StatCard icon="↗" label="نسبة الفوز" value={`${n(counts.winPct || 0)}%`} hint={`${n(counts.won)} فوز من ${n(counts.delivered)} مشروع تم تسليمه`} />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <Panel title="توزيع نتائج المشاريع" subtitle="المشاريع الجارية ونتائج التسليم">
          <div className="mx-auto max-w-sm"><DonutChart segments={projectSegments} centerValue={totals.projects} centerLabel="مشروع" /></div>
        </Panel>
        <Panel title="نسبة إنجاز المهام" subtitle="نسبة المهام المكتملة إلى إجمالي المهام">
          <div className="mx-auto max-w-sm"><DonutChart segments={taskSegments} centerValue={`${n(taskPct)}%`} centerLabel={`${n(totals.done)} من ${n(totals.total)} مهمة`} /></div>
        </Panel>
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <MetricBars title={isEngineer ? 'إنجاز المهام حسب المشروع' : 'مقارنة إنجاز المهام'} subtitle={isEngineer ? 'نسبة الإنجاز في مشاريعك' : 'نسبة إنجاز المهام لكل عضو في الفريق'} items={completionBars} valueKey="pct" format={(value) => `${n(value)}%`} />
        <MetricBars title={isEngineer ? 'حجم المهام حسب المشروع' : 'عدد المشاريع حسب المهندس'} subtitle={isEngineer ? 'إجمالي المهام المطلوبة داخل كل مشروع' : 'المشاريع المسندة لكل عضو في الفريق'} items={sizeBars} valueKey={isEngineer ? 'tasks' : 'projects'} />
      </div>

      {!isEngineer && <Panel className="mt-5" title="مقارنة أعضاء الفريق" subtitle="الإجمالي محسوب من المشاريع التي يملك الفريق صلاحية الوصول إليها">
        {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-sm"><thead><tr className="border-b border-neutral-100 text-xs text-neutral-400"><th className="py-3 text-start">المهندس</th><th className="text-center">المشاريع</th><th className="text-center">الجارية</th><th className="text-center">المهام المنجزة / الإجمالي</th><th className="text-center">الإنجاز</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.engineer.id} className="hover:bg-brand-50/40"><td className="py-3"><div className="flex items-center gap-2.5"><Avatar engineer={row.engineer} size={32} /><span className="font-bold">{row.engineer.name}</span></div></td><td className="text-center">{n(row.projects)}</td><td className="text-center">{n(row.running)}</td><td className="text-center font-bold">{n(row.done)} / {n(row.total)}</td><td className="px-2"><PercentProgress value={row.pct} compact /></td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-neutral-400">لا يوجد أعضاء في الفريق حتى الآن.</p>}
      </Panel>}

      <Panel className="mt-5" title={isEngineer ? 'مشاريعي' : 'مشاريع الفريق'} subtitle={`${n(items.length)} مشروع ضمن نطاق التقرير`}>
        {items.length ? <div className="grid gap-3 lg:grid-cols-2">{items.map(({ p, engineer }) => {
          const stats = projectStats(p, tasks); const percent = stats.pct;
          return <article key={`${engineer.id}:${p.id}`} className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-extrabold text-neutral-800">{p.name || 'مشروع بدون اسم'}</h3>{!isEngineer && <p className="mt-1 text-xs text-neutral-500">{engineer.name}</p>}</div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.finished ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-600'}`}>{p.finished ? 'تم التسليم' : 'جاري'}</span></div><div className="mt-4 flex items-center justify-between text-xs text-neutral-500"><span>التسليم: {fmtDate(p.deliveryDate)}</span><b className="text-brand-700">{n(stats.done)} / {n(stats.total)} مهمة · {n(percent)}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} /></div></article>;
        })}</div> : <p className="py-8 text-center text-sm text-neutral-400">لا توجد مشاريع ضمن الفترة الحالية.</p>}
      </Panel>
    </>}
  </>;
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Panel from '../components/ui/Panel';
import Avatar from '../components/ui/Avatar';
import DonutChart from '../components/charts/DonutChart';
import RadialGauge from '../components/charts/RadialGauge';
import { Empty } from '../components/ui/Loader';
import { ArrowIcon, CheckIcon, EngineersIcon, ProjectsIcon, ReportsIcon } from '../components/ui/Icons';
import { engineerStats, getAllProjects, projectStats } from '../utils/stats';
import { teamLabel } from '../utils/helpers';
import { daysLeft, n } from '../utils/dashboardData';

const deadline = (project) => {
  const days = daysLeft(project.deliveryDate);
  if (days === null) return 'موعد غير محدد';
  if (days < 0) return `متأخر ${n(Math.abs(days))} يوم`;
  if (days === 0) return 'التسليم اليوم';
  if (days === 1) return 'التسليم غدًا';
  return `خلال ${n(days)} يوم`;
};

export default function TeamPerformancePage() {
  const { session } = useAuth();
  const { teams, engineers, tasks } = useData();
  const team = teams.find((item) => item.id === session.id && item.type !== 'hasr');
  const projects = useMemo(() => team ? getAllProjects([team], engineers, tasks) : [], [team, engineers, tasks]);
  const members = useMemo(() => (team?.engineers || []).map((engineer) => {
    const summary = engineerStats(engineers[engineer.id], tasks);
    const ownProjects = engineers[engineer.id]?.projects || [];
    const running = ownProjects.filter((project) => !project.finished).length;
    return { engineer, ...summary, projects: ownProjects.length, running, remaining: Math.max(0, summary.total - summary.done) };
  }).sort((a, b) => b.pct - a.pct || b.done - a.done), [team, engineers, tasks]);
  const totals = members.reduce((result, member) => ({
    done: result.done + member.done,
    total: result.total + member.total,
    running: result.running + member.running,
    projects: result.projects + member.projects,
  }), { done: 0, total: 0, running: 0, projects: 0 });
  const pct = totals.total ? Math.round(totals.done / totals.total * 100) : 0;
  const leading = members.find((member) => member.total > 0);
  const projectMix = [
    { label: 'جارية', value: projects.filter(({ project }) => !project.finished).length, color: '#414A9B' },
    { label: 'تم تسليمها', value: projects.filter(({ project }) => project.finished).length, color: '#2A317A' },
  ];
  const deadlines = useMemo(() => projects.filter(({ project }) => !project.finished && project.deliveryDate)
    .sort((a, b) => daysLeft(a.project.deliveryDate) - daysLeft(b.project.deliveryDate)).slice(0, 6), [projects]);

  if (!team) return <Empty icon="🔎" title="الفريق غير متاح" text="لا توجد صلاحية لعرض أداء هذا الفريق." />;

  return <>
    <PageHeader title={`أداء ${teamLabel(team)}`} subtitle="متابعة عبء العمل وإنجاز المهندسين وأولويات التسليم." actions={<Link to="/reports" className="btn-ghost"><ReportsIcon className="h-4 w-4" />التقارير التحليلية</Link>} />

    <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/80 to-brand-100/70 p-5 shadow-sm sm:p-7">
      <span aria-hidden className="pointer-events-none absolute -end-16 -top-20 h-60 w-60 rounded-full bg-brand-300/25 blur-3xl" />
      <div className="relative grid items-center gap-5 md:grid-cols-[1fr_auto]">
        <div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">لوحة تشغيلية</span><h2 className="mt-3 text-2xl font-black text-brand-950 sm:text-3xl">صورة يومية لأداء الفريق</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">ركّزي على توزيع المهام، نشاط كل مهندس، والمشاريع التي تحتاج متابعة قريبة.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-neutral-600">{n(members.length)} مهندس</span><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-neutral-600">{n(totals.running)} مشروع جاري</span><span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-neutral-600">{n(totals.done)} مهمة منجزة</span></div></div>
        <div className="mx-auto rounded-full bg-white p-3 shadow-sm ring-1 ring-brand-100"><RadialGauge value={pct} size={142} stroke={13} color="#2A317A" trackColor="#E6E8F5" label="إنجاز الفريق" /></div>
      </div>
    </section>

    <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard icon={<EngineersIcon className="h-5 w-5" />} label="أعضاء الفريق" value={members.length} hint="المهندسون النشطون" featured />
      <StatCard icon={<ProjectsIcon className="h-5 w-5" />} label="مشاريع جارية" value={totals.running} hint={`${n(totals.projects)} مشروع ضمن الفريق`} />
      <StatCard icon={<CheckIcon className="h-5 w-5" />} label="المهام المنجزة" value={totals.done} hint={`من إجمالي ${n(totals.total)} مهمة`} />
      <StatCard icon="%" label="معدل الإنجاز" value={`${n(pct)}%`} hint={leading ? `الأعلى حاليًا: ${leading.engineer.name}` : 'لا توجد مهام بعد'} />
    </div>

    <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
      <Panel title="مقارنة إنجاز المهندسين" subtitle="المهام المنجزة من إجمالي المهام المسندة لكل مهندس">
        {members.length ? <div className="space-y-4">{members.map((member, index) => <Link key={member.engineer.id} to={`/engineers/${member.engineer.id}`} className="group block rounded-2xl border border-neutral-100 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="flex items-center gap-3"><Avatar engineer={member.engineer} size={42} /><div className="min-w-0 flex-1"><p className="truncate font-extrabold text-neutral-800 group-hover:text-brand-700">{member.engineer.name}</p><p className="mt-0.5 text-xs text-neutral-500">{n(member.done)} من {n(member.total)} مهمة · {n(member.running)} مشروع جاري</p></div><strong className="text-lg tabular-nums text-brand-800">{n(member.pct)}%</strong></div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-700 transition-[width] duration-700" style={{ width: `${member.pct}%` }} /></div>
        </Link>)}</div> : <p className="py-10 text-center text-sm text-neutral-400">أضيفي مهندسين للفريق لبدء المقارنة.</p>}
      </Panel>
      <Panel title="محفظة المشاريع" subtitle="توزيع المشاريع الجارية والمسلّمة">
        <div className="mx-auto max-w-sm"><DonutChart segments={projectMix} centerValue={projects.length} centerLabel="مشروع" /></div>
        <div className="mt-3 grid grid-cols-2 gap-2">{projectMix.map((segment) => <div key={segment.label} className="rounded-xl bg-neutral-50 p-3 text-center"><b className="text-xl tabular-nums text-brand-800">{n(segment.value)}</b><p className="mt-1 text-xs text-neutral-500">{segment.label}</p></div>)}</div>
      </Panel>
    </div>

    <Panel title="أولويات التسليم" subtitle="المشاريع الأقرب لموعد التسليم — افتحي بطاقة المشروع لمتابعة تفاصيله">
      {deadlines.length ? <div className="grid gap-3 md:grid-cols-2">{deadlines.map(({ project, eng, stats: summary }) => <Link key={project.id} to={`/engineers/${eng.id}?p=${project.id}`} className="group rounded-2xl border border-neutral-200 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-extrabold text-neutral-800 group-hover:text-brand-700">{project.name || 'مشروع بدون اسم'}</h3><p className="mt-1 text-xs text-neutral-500">{eng.name}</p></div><span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{deadline(project)}</span></div>
        <div className="mt-4 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${projectStats(project, tasks).pct}%` }} /></div><span className="text-xs font-extrabold tabular-nums text-brand-700">{n(summary.pct)}%</span><ArrowIcon className="h-4 w-4 text-neutral-300 transition group-hover:-translate-x-1 group-hover:text-brand-600" /></div>
      </Link>)}</div> : <p className="py-8 text-center text-sm text-neutral-400">لا توجد مواعيد تسليم قريبة مسجلة للمشاريع الجارية.</p>}
    </Panel>
  </>;
}

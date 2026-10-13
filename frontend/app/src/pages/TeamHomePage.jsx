import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import Avatar from '../components/ui/Avatar';
import Panel from '../components/ui/Panel';
import ProgressRing from '../components/ui/ProgressRing';
import ProgressBar from '../components/ui/ProgressBar';
import { Empty } from '../components/ui/Loader';
import {
  CalendarIcon, CheckIcon, ClockIcon, ProjectsIcon, ReportsIcon, TeamsIcon,
  TrophyIcon, UserIcon, AlertIcon,
} from '../components/ui/Icons';
import { fmtDate } from '../utils/dates';
import { teamLabel } from '../utils/helpers';
import { getAllProjects, teamStats, engineerStats } from '../utils/stats';
import { daysLeft, n } from '../utils/dashboardData';

const greeting = () => (new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');
const todayText = () => new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <div className="card flex items-center gap-4 p-4 sm:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon className="h-6 w-6" /></span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-brand-900">{value}</p>
        {detail && <p className="mt-0.5 truncate text-xs text-neutral-400">{detail}</p>}
      </div>
    </div>
  );
}

export default function TeamHomePage() {
  const { session } = useAuth();
  const { teams, engineers, tasks } = useData();
  const navigate = useNavigate();
  const team = teams.find((item) => item.id === session.id);

  const projects = useMemo(() => team ? getAllProjects([team], engineers, tasks) : [], [team, engineers, tasks]);
  const stats = useMemo(() => team ? teamStats(team, engineers, tasks) : null, [team, engineers, tasks]);
  const running = projects.filter(({ project }) => !project.finished);
  const delivered = projects.filter(({ project }) => project.finished);
  const overdue = running.filter(({ project }) => daysLeft(project.deliveryDate) < 0);
  const dueSoon = running.filter(({ project }) => {
    const days = daysLeft(project.deliveryDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const nextProjects = [...running]
    .filter(({ project }) => project.deliveryDate)
    .sort((a, b) => new Date(a.project.deliveryDate) - new Date(b.project.deliveryDate))
    .slice(0, 5);

  if (!team) return <Empty icon="🔎" title="الفريق غير موجود" />;

  const openEngineer = (engineerId, projectId) => {
    if (projectId) localStorage.setItem(`tender-dashboard-active-project:${engineerId}`, projectId);
    navigate(`/engineers/${engineerId}`);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-6 text-neutral-800 shadow-soft animate-rise sm:p-8">
        <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 end-10 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="rounded-full bg-white/80 p-1.5 ring-1 ring-brand-200"><Avatar engineer={{ name: session.name }} size={72} /></div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200/70">
                <CalendarIcon className="h-4 w-4 text-brand-600" />{todayText()}
              </p>
              <h1 className="mt-3 text-2xl font-extrabold text-brand-900 sm:text-3xl">{greeting()}، {session.name}</h1>
              <p className="mt-1 truncate text-sm font-semibold text-[#3C3C3B]">إدارة ومتابعة {teamLabel(team)}</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Link to="/reports" className="btn-primary"><ReportsIcon className="h-4 w-4" />تقارير الفريق</Link>
            <Link to="/profile" className="btn-ghost"><UserIcon className="h-4 w-4" />ملفي الشخصي</Link>
          </div>
        </div>
        <div className="relative mt-6 grid gap-4 rounded-2xl bg-white/75 p-4 ring-1 ring-brand-200/60 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div>
            <p className="font-extrabold text-brand-900">ملخص أداء الفريق</p>
            <p className="mt-1 text-sm text-neutral-500">تابعوا المشاريع القادمة وإنجاز المهام من مكان واحد.</p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing pct={stats.pct} size={72} stroke={8} tone="brand" />
            <div><p className="text-xs font-semibold text-neutral-500">إنجاز المهام</p><p className="text-xl font-extrabold text-brand-900">{n(stats.pct)}%</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TeamsIcon} label="مهندسو الفريق" value={n(team.engineers.length)} detail="أعضاء الفريق" />
        <Metric icon={ProjectsIcon} label="المشاريع الجارية" value={n(running.length)} detail={`${n(projects.length)} مشروع إجمالاً`} />
        <Metric icon={ClockIcon} label="تسليم خلال أسبوع" value={n(dueSoon.length)} detail="مشاريع تحتاج متابعة قريبة" />
        <Metric icon={AlertIcon} label="تسليمات متأخرة" value={n(overdue.length)} detail={overdue.length ? 'راجع مواعيد المشاريع' : 'لا توجد مشاريع متأخرة'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7" title="المشاريع القادمة" subtitle="أقرب مواعيد التسليم في الفريق"
          action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><CalendarIcon className="h-5 w-5" /></span>}>
          {nextProjects.length ? (
            <div className="space-y-3">
              {nextProjects.map(({ project, eng, stats: projectStat }) => {
                const left = daysLeft(project.deliveryDate);
                return (
                  <button key={project.id} type="button" onClick={() => openEngineer(eng.id, project.id)}
                    className="w-full rounded-2xl border border-neutral-100 p-4 text-start transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0"><p className="truncate font-extrabold text-neutral-800">{project.name || 'مشروع بدون اسم'}</p><p className="mt-1 text-xs text-neutral-500">{eng.name} · التسليم {fmtDate(project.deliveryDate)}</p></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${left < 0 ? 'bg-brand-100 text-brand-800 ring-brand-200' : left <= 3 ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-neutral-50 text-neutral-500 ring-neutral-200'}`}>
                        {left < 0 ? `متأخر ${n(Math.abs(left))} يوم` : left === 0 ? 'التسليم اليوم' : `متبقي ${n(left)} يوم`}
                      </span>
                    </div>
                    <div className="mt-3"><ProgressBar pct={projectStat.pct} /><p className="mt-1 text-xs font-semibold text-neutral-400">إنجاز المهام {n(projectStat.pct)}%</p></div>
                  </button>
                );
              })}
            </div>
          ) : <Empty icon="📁" title="لا توجد مشاريع بمواعيد قادمة" text="ستظهر هنا المشاريع الجارية المرتبطة بتاريخ تسليم." />}
        </Panel>

        <Panel className="xl:col-span-5" title="فريقك" subtitle={`${n(team.engineers.length)} مهندس · ${n(delivered.length)} مشروع تم تسليمه`}>
          {team.engineers.length ? (
            <div className="space-y-3">
              {team.engineers.map((engineer) => {
                const engineerData = engineers[engineer.id];
                const engineerProgress = engineerStats(engineerData, tasks);
                const engineerProjects = engineerData?.projects || [];
                const activeCount = engineerProjects.filter((project) => !project.finished).length;
                return (
                  <button key={engineer.id} type="button" onClick={() => openEngineer(engineer.id)}
                    className="w-full rounded-2xl border border-neutral-100 p-3.5 text-start transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                    <div className="flex items-center gap-3">
                      <Avatar engineer={engineer} size={44} />
                      <div className="min-w-0 flex-1"><p className="truncate font-extrabold">{engineer.name}</p><p className="mt-0.5 text-xs text-neutral-400">{n(activeCount)} مشروع جاري</p></div>
                      <span className="text-sm font-extrabold text-brand-700">{n(engineerProgress.pct)}%</span>
                    </div>
                    <div className="mt-3"><ProgressBar pct={engineerProgress.pct} /><p className="mt-1 text-xs text-neutral-400">{n(engineerProgress.done)} من {n(engineerProgress.total)} مهمة منجزة</p></div>
                  </button>
                );
              })}
            </div>
          ) : <Empty icon="👥" title="لا يوجد مهندسون في الفريق" />}
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-5 py-4">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700"><TrophyIcon className="h-5 w-5" /></span><div><p className="font-extrabold text-brand-900">إنجازات الفريق</p><p className="text-sm text-neutral-500">{n(stats.done)} مهمة منجزة من أصل {n(stats.total)} · {n(delivered.length)} مشروع تم تسليمه</p></div></div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200"><CheckIcon className="h-4 w-4" />{n(stats.pct)}% إنجاز</span>
      </div>
    </div>
  );
}

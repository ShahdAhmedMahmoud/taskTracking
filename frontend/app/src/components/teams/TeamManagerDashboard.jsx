import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useUI } from '../../hooks/useUI';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import FormModal from '../ui/FormModal';
import Avatar from '../ui/Avatar';
import Pagination from '../ui/Pagination';
import DonutChart from '../charts/DonutChart';
import RadialGauge from '../charts/RadialGauge';
import { Empty } from '../ui/Loader';
import { ArrowIcon, CalendarIcon, CheckIcon, EngineersIcon, ProjectsIcon, ReportsIcon, SearchIcon, UserPlusIcon } from '../ui/Icons';
import { teamLabel } from '../../utils/helpers';
import { engineerStats, getAllProjects, teamStats } from '../../utils/stats';
import { daysLeft, n } from '../../utils/dashboardData';

const PROJECT_PAGE_SIZE = 5;
const ENGINEER_PAGE_SIZE = 6;
const dateLabel = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'بدون موعد';
const deadlineLabel = (days) => days === null ? 'موعد غير محدد' : days < 0 ? `متأخر ${n(-days)} يوم` : days === 0 ? 'التسليم اليوم' : days === 1 ? 'التسليم غدًا' : `خلال ${n(days)} يوم`;

export default function TeamManagerDashboard() {
  const { session, removeHash } = useAuth();
  const { teams, engineers, tasks, createEngineer, deleteEngineer } = useData();
  const { confirm, toast } = useUI();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [engineerPage, setEngineerPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const team = teams.find((item) => item.id === session.id);
  const members = team?.engineers || [];
  const stats = team ? teamStats(team, engineers, tasks) : { total: 0, done: 0, remaining: 0, pct: 0 };
  const projects = useMemo(() => team ? getAllProjects([team], engineers, tasks) : [], [team, engineers, tasks]);
  const projectCounts = useMemo(() => ({
    active: projects.filter(({ project }) => !project.finished).length,
    completed: projects.filter(({ project }) => project.finished).length,
    overdue: projects.filter(({ project }) => !project.finished && daysLeft(project.deliveryDate) !== null && daysLeft(project.deliveryDate) < 0).length,
  }), [projects]);
  const performanceRows = useMemo(() => members.map((engineer) => {
    const summary = engineerStats(engineers[engineer.id], tasks);
    const assigned = engineers[engineer.id]?.projects || [];
    return { engineer, stats: summary, projects: assigned.length, active: assigned.filter((project) => !project.finished).length, lastSaved: engineers[engineer.id]?.lastSaved };
  }), [members, engineers, tasks]);
  const visibleMembers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('ar');
    return performanceRows
      .filter(({ engineer }) => !search || engineer.name.toLocaleLowerCase('ar').includes(search) || (engineer.employeeCode || '').toLowerCase().includes(search))
      .sort((a, b) => b.stats.pct - a.stats.pct || b.active - a.active);
  }, [performanceRows, query]);
  const soonProjects = useMemo(() => projects
    .filter(({ project }) => !project.finished && project.deliveryDate)
    .map((item) => ({ ...item, days: daysLeft(item.project.deliveryDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 4), [projects]);
  const engineerPageCount = Math.max(1, Math.ceil(visibleMembers.length / ENGINEER_PAGE_SIZE));
  const shownMembers = visibleMembers.slice((Math.min(engineerPage, engineerPageCount) - 1) * ENGINEER_PAGE_SIZE, Math.min(engineerPage, engineerPageCount) * ENGINEER_PAGE_SIZE);
  const projectPageCount = Math.max(1, Math.ceil(projects.length / PROJECT_PAGE_SIZE));
  const safeProjectPage = Math.min(projectPage, projectPageCount);
  const shownProjects = projects.slice((safeProjectPage - 1) * PROJECT_PAGE_SIZE, safeProjectPage * PROJECT_PAGE_SIZE);
  const teamSegments = [
    { label: 'جاري', value: projectCounts.active, color: '#414A9B' },
    { label: 'تم تسليمه', value: projectCounts.completed, color: '#2A317A' },
  ];

  const removeMember = async (engineer) => {
    if (!await confirm({ title: 'حذف المهندس', message: `حذف «${engineer.name}» من الفريق؟ بياناته المحفوظة ستظل في النظام، لكنه لن يتمكن من الدخول بهذا الحساب.`, confirmText: 'حذف المهندس' })) return;
    if (await deleteEngineer(team.id, engineer.id)) removeHash('engineer', engineer.id);
  };
  const openProject = (item) => {
    localStorage.setItem(`tender-dashboard-active-project:${item.eng.id}`, item.project.id);
    navigate(`/engineers/${item.eng.id}`);
  };

  if (!team) return <Empty icon="🔎" title="الفريق غير موجود" />;

  return <>
    <PageHeader title="لوحة الفريق" subtitle="نظرة سريعة على أداء الفريق ومشاريعه ومواعيد التسليم." />

    <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/80 to-brand-100/70 p-5 shadow-sm sm:p-7">
      <span aria-hidden className="pointer-events-none absolute -end-14 -top-20 h-64 w-64 rounded-full bg-brand-300/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-28 start-1/3 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100"><span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />لوحة مدير الفريق</span>
          <h2 className="mt-4 text-2xl font-black leading-tight text-brand-950 sm:text-4xl">{teamLabel(team)}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">أهلًا {team.manager || session.name}، تابعي سير العمل ووزّعي انتباهك على أهم الأولويات.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/reports" className="group inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md"><ReportsIcon className="h-4 w-4" />التقارير التحليلية<ArrowIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></Link>
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-brand-700 ring-1 ring-brand-200 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-50"><UserPlusIcon className="h-4 w-4" />إضافة مهندس</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[25rem]">
          {[
            ['أعضاء الفريق', members.length, 'مهندس'],
            ['مشاريع جارية', projectCounts.active, 'مشروع'],
            ['مواعيد متأخرة', projectCounts.overdue, 'مشروع'],
          ].map(([label, value, unit], index) => <div key={label} className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animationDelay: `${index * 80}ms` }}><p className="text-xs font-bold text-neutral-500">{label}</p><p className="mt-2 text-3xl font-black tabular-nums text-brand-800">{n(value)}</p><p className="mt-0.5 text-xs text-neutral-400">{unit}</p></div>)}
        </div>
      </div>
    </section>

    <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard icon={<EngineersIcon className="h-5 w-5" />} label="مهندسو الفريق" value={members.length} hint="الأعضاء المسجلون في الفريق" featured />
      <StatCard icon={<ProjectsIcon className="h-5 w-5" />} label="إجمالي المشاريع" value={projects.length} hint={`${n(projectCounts.active)} مشروع جاري`} />
      <StatCard icon={<CheckIcon className="h-5 w-5" />} label="المهام المنجزة" value={stats.done} hint={`من إجمالي ${n(stats.total)} مهمة`} />
      <StatCard icon="%" label="إنجاز الفريق" value={`${n(stats.pct)}%`} hint={`${n(stats.remaining)} مهمة متبقية`} />
    </div>

    <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,.75fr)]">
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-600">مؤشر الفريق</p><h2 className="mt-1 text-lg font-extrabold text-neutral-900">التقدم وحالة المشاريع</h2><p className="mt-1 text-sm text-neutral-500">ملخص إنجاز المهام وتوزيع المشاريع الحالية.</p></div><Link to="/reports" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-brand-700 transition hover:bg-brand-50">تفاصيل الأداء<ArrowIcon className="h-4 w-4" /></Link></div>
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto rounded-full bg-brand-50/70 p-2"><RadialGauge value={stats.pct} size={142} stroke={13} color="#2A317A" trackColor="#E6E8F5" label="إنجاز المهام" /></div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['مهام منجزة', stats.done], ['متبقية', stats.remaining], ['مشاريع جارية', projectCounts.active], ['تم تسليمها', projectCounts.completed],
            ].map(([label, value], index) => <div key={label} className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-3 transition duration-300 hover:border-brand-200 hover:bg-brand-50/60" style={{ transitionDelay: `${index * 30}ms` }}><p className="text-xl font-black tabular-nums text-brand-800">{n(value)}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md sm:p-6">
        <div className="mb-2"><p className="text-xs font-extrabold uppercase tracking-wide text-brand-600">توزيع العمل</p><h2 className="mt-1 text-lg font-extrabold text-neutral-900">حالة المشاريع</h2><p className="mt-1 text-sm text-neutral-500">الجاري مقارنة بالمشاريع التي تم تسليمها.</p></div>
        <DonutChart segments={teamSegments} centerValue={projects.length} centerLabel="مشروع" size={184} stroke={24} />
      </section>
    </div>

    <section className="mb-5 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-600">الفريق</p><h2 className="mt-1 text-xl font-extrabold text-neutral-900">مهندسو الفريق</h2><p className="mt-1 text-sm text-neutral-500">رتّبي المتابعة حسب الإنجاز وابحثي بالاسم أو الكود الوظيفي.</p></div>
        <label className="relative block w-full sm:max-w-xs"><span className="sr-only">البحث عن مهندس</span><SearchIcon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setEngineerPage(1); }} className="input pe-10" placeholder="ابحثي عن مهندس..." /></label>
      </div>
      {shownMembers.length ? <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {shownMembers.map(({ engineer, stats: memberStats, projects: memberProjects, active, lastSaved }, index) => <article key={engineer.id} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: `${index * 55}ms` }}>
          <span className="absolute inset-x-0 top-0 h-1 origin-right scale-x-0 bg-gradient-to-l from-brand-400 to-brand-700 transition-transform duration-500 group-hover:scale-x-100 group-focus:scale-x-100" />
          <div className="flex items-center gap-3"><Avatar engineer={engineer} size={48} className="ring-2 ring-brand-50 transition duration-300 group-hover:scale-105" /><div className="min-w-0 flex-1"><button type="button" onClick={() => navigate(`/engineers/${engineer.id}`)} className="block max-w-full truncate text-start font-extrabold text-neutral-900 hover:text-brand-700 focus:outline-none focus-visible:underline">{engineer.name}</button><p className="mt-0.5 truncate text-xs text-neutral-500">{engineer.employeeCode || 'عضو في الفريق'}</p></div><ArrowIcon className="h-4 w-4 shrink-0 text-neutral-300 transition duration-300 group-hover:-translate-x-1 group-hover:text-brand-600" /></div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold"><span className="text-neutral-500">نسبة الإنجاز</span><span className="tabular-nums text-brand-800">{n(memberStats.pct)}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-50"><div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-700 transition-[width] duration-1000 ease-out" style={{ width: `${memberStats.pct}%`, transitionDelay: `${index * 60}ms` }} /></div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-neutral-100 rounded-xl bg-neutral-50/80 py-2 text-center"><div><p className="font-extrabold tabular-nums text-neutral-800">{n(active)}</p><p className="mt-0.5 text-[10px] text-neutral-500">جارية</p></div><div><p className="font-extrabold tabular-nums text-neutral-800">{n(memberProjects)}</p><p className="mt-0.5 text-[10px] text-neutral-500">مشاريع</p></div><div><p className="font-extrabold tabular-nums text-neutral-800">{n(memberStats.done)}/{n(memberStats.total)}</p><p className="mt-0.5 text-[10px] text-neutral-500">مهام</p></div></div>
          <p className="mt-3 text-[11px] text-neutral-400">آخر تحديث: {lastSaved ? new Date(lastSaved).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'لم يُحفظ بعد'}</p>
          <button type="button" onClick={(event) => { event.stopPropagation(); removeMember(engineer); }} className="absolute bottom-3 end-3 rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-400 opacity-0 transition hover:bg-brand-50 hover:text-brand-700 focus:opacity-100 group-hover:opacity-100" aria-label={`حذف ${engineer.name}`}>إزالة</button>
        </article>)}
      </div> : <div className="p-5">{query ? <Empty icon={<SearchIcon className="h-7 w-7" />} title="لا توجد نتائج" text="جرّبي اسمًا أو كودًا وظيفيًا مختلفًا." /> : <Empty icon={<EngineersIcon className="h-7 w-7" />} title="ابدئي ببناء فريقك" text="أضيفي أول مهندس للبدء في متابعة الأداء والمشاريع." />}</div>}
      <div className="px-4 pb-4 sm:px-5"><Pagination page={Math.min(engineerPage, engineerPageCount)} pageCount={engineerPageCount} pageSize={ENGINEER_PAGE_SIZE} itemCount={visibleMembers.length} onChange={setEngineerPage} /></div>
    </section>

    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-5 sm:p-6"><div><p className="text-xs font-extrabold uppercase tracking-wide text-brand-600">الأولويات</p><h2 className="mt-1 text-xl font-extrabold text-neutral-900">المشاريع ومواعيد التسليم</h2><p className="mt-1 text-sm text-neutral-500">المشاريع الجارية مرتبة حسب أقرب موعد للتسليم.</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">{n(projects.length)} مشروع</span></div>
      {shownProjects.length ? <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">{shownProjects.map((item, index) => {
        const days = daysLeft(item.project.deliveryDate);
        return <button key={item.project.id} type="button" onClick={() => openProject(item)} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-start transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm" style={{ animationDelay: `${index * 55}ms` }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition duration-300 group-hover:bg-brand-600 group-hover:text-white"><ProjectsIcon className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><b className="truncate text-sm font-extrabold text-neutral-900">{item.project.name || 'مشروع بدون اسم'}</b><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${days !== null && days < 0 ? 'bg-brand-100 text-brand-800' : 'bg-neutral-100 text-neutral-600'}`}>{deadlineLabel(days)}</span></span><span className="mt-1 block truncate text-xs text-neutral-500">المهندس: {item.eng.name} · التسليم: {dateLabel(item.project.deliveryDate)}</span><span className="mt-3 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100"><span className="block h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${item.stats.pct}%` }} /></span><span className="text-[10px] font-extrabold tabular-nums text-brand-700">{n(item.stats.pct)}%</span></span></span>
        </button>;
      })}</div> : <div className="p-5"><Empty icon={<ProjectsIcon className="h-7 w-7" />} title="لا توجد مشاريع بعد" text="ستظهر المشاريع هنا بمجرد إضافتها لأحد أعضاء الفريق." /></div>}
      <div className="px-4 pb-4 sm:px-5"><Pagination page={safeProjectPage} pageCount={projectPageCount} pageSize={PROJECT_PAGE_SIZE} itemCount={projects.length} onChange={setProjectPage} /></div>
    </section>

    <section className="mt-5 rounded-3xl border border-brand-100 bg-gradient-to-l from-brand-50 via-white to-brand-100/70 p-5 text-neutral-800 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><CalendarIcon className="h-5 w-5" /></span><div><h2 className="font-extrabold">أداء الفريق بالتفصيل</h2><p className="mt-1 text-sm leading-6 text-neutral-600">تابعي إنجاز كل مهندس وعبء العمل ومواعيد التسليم في لوحة أداء مستقلة.</p></div></div>
      <Link to="/team/performance" className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-extrabold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-brand-800 sm:mt-0"><EngineersIcon className="h-4 w-4" />عرض أداء الفريق<ArrowIcon className="h-4 w-4" /></Link>
    </section>

    {adding && <FormModal title="إضافة مهندس جديد" submitText="إضافة المهندس" onClose={() => setAdding(false)} fields={[
      { name: 'name', label: 'اسم المهندس', required: true }, { name: 'companyEmail', label: 'إيميل الشركة', type: 'email' }, { name: 'phoneNumber', label: 'رقم التليفون', type: 'tel' }, { name: 'employeeCode', label: 'الكود الوظيفي' },
    ]} onSubmit={async (value) => { const ok = await createEngineer(team.id, value); if (ok) { setAdding(false); toast('success', 'تمت إضافة المهندس للفريق'); } }} />}
  </>;
}

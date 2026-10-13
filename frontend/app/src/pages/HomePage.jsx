import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import ProgressRing from '../components/ui/ProgressRing';
import Panel from '../components/ui/Panel';
import Avatar from '../components/ui/Avatar';
import Segmented from '../components/ui/Segmented';
import QuickActions from '../components/ui/QuickActions';
import SegmentBar from '../components/charts/SegmentBar';
import DonutChart from '../components/charts/DonutChart';
import StackedColumns from '../components/charts/StackedColumns';
import TeamPerformanceCard from '../components/teams/TeamPerformanceCard';
import {
  TeamsIcon, EngineersIcon, ProjectsIcon, ReportsIcon, UserPlusIcon, SettingsIcon, MailIcon, ArchiveIcon,
  HasrIcon, FlagIcon, CheckIcon, ClockIcon, CalendarIcon, TrophyIcon,
} from '../components/ui/Icons';
import { teamStats, pctOf } from '../utils/stats';
import {
  n, collectProjects, daysLeft, projectProgress, STATES, stateCounts, periodResults,
  deliveriesTimeline, teamBreakdown, workloadByEngineer, hasrSummary,
} from '../utils/dashboardData';

const ACTIONS = [
  ['/teams', TeamsIcon, 'أداء الفرق', 'نظرة عامة على كل الفرق ونسب إنجازها'],
  ['/engineers', EngineersIcon, 'اختيار مهندس', 'ادخلي مباشرة على أي مهندس لمتابعة مهامه'],
  ['/projects', ProjectsIcon, 'المشاريع الجارية', 'كل المشاريع مرتبة بأقرب موعد تسليم'],
  ['/reports', ReportsIcon, 'التقارير', 'رسوم وجداول أداء القسم والفرق والمهندسين'],
  ['/add-employee', UserPlusIcon, 'إضافة موظف', 'إضافة موظف جديد لفريق محدد'],
  // ['/master-data', SettingsIcon, 'الماستر داتا', 'إدارة الحقول الديناميكية لكل الأقسام'],
  // ['/email-settings', MailIcon, 'إعدادات البريد', 'SMTP والمستلمين عند إنشاء مشروع'],
  ['/archives', ArchiveIcon, 'الأرشيف', 'المشاريع المؤرشفة والمحذوفة'],
];

const PERIODS = [['week', 'آخر ٧ أيام'], ['month', 'آخر ٣٠ يوم'], ['all', 'كل الفترات']];
const PERIOD_TEXT = { week: 'آخر ٧ أيام', month: 'آخر ٣٠ يوم', all: 'كل الفترات' };
const UNIT_TEXT = { week: 'كل عمود = يوم', month: 'كل عمود = ٥ أيام', all: 'كل عمود = شهر (آخر ٦ شهور)' };

const greeting = () => (new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'بدون تاريخ');
const soonText = (k) => (k === 0 ? 'يُسلَّم اليوم' : k === 1 ? 'غدًا' : k === 2 ? 'خلال يومين' : k <= 10 ? `خلال ${n(k)} أيام` : `خلال ${n(k)} يوم`);

function SectionHead({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const { session } = useAuth();
  const { teams, engineers, tasks, hasr, deptManager } = useData();
  const [period, setPeriod] = useState('month');
  const [projectPage, setProjectPage] = useState(1);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const main = useMemo(() => teams.filter((team) => team.type !== 'hasr'), [teams]);
  const all = useMemo(() => collectProjects(main, engineers), [main, engineers]);

  /* ---------- كل الوقت ---------- */
  const counts = useMemo(() => stateCounts(all), [all]);
  const runningList = useMemo(
    () => all
      .filter(({ p }) => !p.finished)
      .sort((a, b) => {
        if (!a.p.deliveryDate) return 1;
        if (!b.p.deliveryDate) return -1;
        return new Date(a.p.deliveryDate) - new Date(b.p.deliveryDate);
      }),
    [all],
  );
  const projectPageSize = 5;
  const projectPageCount = Math.max(1, Math.ceil(runningList.length / projectPageSize));
  const safeProjectPage = Math.min(projectPage, projectPageCount);
  const runningPage = runningList.slice((safeProjectPage - 1) * projectPageSize, safeProjectPage * projectPageSize);
  const avgProgress = runningList.length
    ? Math.round(runningList.reduce((a, { p }) => a + projectProgress(p).pct, 0) / runningList.length) : 0;

  /* ---------- حسب الفترة ---------- */
  const pr = useMemo(() => periodResults(all, period), [all, period]);
  const timeline = useMemo(() => deliveriesTimeline(all, period), [all, period]);

  /* ---------- الفرق ---------- */
  const teamCards = useMemo(
    () => main
      .map((t) => {
        const s = teamStats(t, engineers, tasks);
        return { t, done: s.done, total: s.total, pct: pctOf(s.done, s.total), b: teamBreakdown(all, t.id, period) };
      })
      .sort((a, b) => b.b.won - a.b.won || b.b.delivered.length - a.b.delivered.length),
    [main, engineers, tasks, all, period],
  );
  const tasksDone = teamCards.reduce((a, r) => a + r.done, 0);
  const tasksTotal = teamCards.reduce((a, r) => a + r.total, 0);
  const engineersCount = main.reduce((a, t) => a + t.engineers.length, 0);

  const workload = useMemo(() => workloadByEngineer(all, 5), [all]);
  const maxLoad = Math.max(1, ...workload.map((w) => w.count));
  const hasrSum = useMemo(() => hasrSummary(hasr), [hasr]);
  const hasrTotal = hasrSum.waiting + hasrSum.working + hasrSum.done;

  const actions = [
    ...ACTIONS,
    ...teams
      .filter((t) => t.type === 'hasr' || t.division === 'saudi')
      .map((t) => (t.type === 'hasr'
        ? [`/hasr/${t.id}`, HasrIcon, `قسم ${t.label}`, `${n((hasr[t.id] || []).length)} مشروع وارد`]
        : [`/teams/${t.id}`, FlagIcon, 'قسم السعودية', `مدير الفريق ${t.manager}`])),
  ];

  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* ===== Hero + الإجراءات السريعة ===== */}
      <div>
        <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-6 pb-16 text-neutral-800 shadow-soft animate-rise sm:p-8 sm:pb-16">
          <div className="pointer-events-none absolute -start-16 -top-16 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200/70">
                <CalendarIcon className="h-4 w-4 text-brand-600" />{today}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold text-brand-900 sm:text-4xl">{greeting()}، {deptManager || session?.name}</h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-[#3C3C3B]">
                عندك {n(counts.running)} مشروع جاري
                {counts.pending > 0 && `، و${n(counts.pending)} معلق بانتظار القرار`}
                {counts.total > 0 && `، ونسبة الفوز ${counts.delivered ? `${n(counts.winPct)}%` : 'لا توجد مشاريع مُسلّمة بعد'}`}.
              </p>
              <p className="mt-3 inline-block rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200/80 shadow-xs">
                {n(main.length)} فرق · {n(engineersCount)} مهندس
              </p>
            </div>

            <div className="flex w-full items-center gap-5 rounded-2xl bg-white/80 p-5 ring-1 ring-brand-200/60 shadow-sm backdrop-blur sm:w-auto">
              <ProgressRing pct={pctOf(tasksDone, tasksTotal)} size={112} stroke={11} tone="brand" />
              <div>
                <p className="text-sm font-bold text-neutral-500">إنجاز المهام</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-900">{n(tasksDone)} <span className="text-base font-semibold text-neutral-400">من {n(tasksTotal)}</span></p>
              </div>
            </div>
          </div>
        </section>

        <div className="relative z-10 -mt-10 px-0 sm:px-4">
          <QuickActions items={actions} />
        </div>
      </div>

      {/* ===== الكروت ===== */}
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard featured delay={0} to="/projects" icon={<ProjectsIcon />} label="إجمالي المشاريع" value={counts.total} hint={`${n(counts.delivered)} تم تسليمه`} />
        <StatCard delay={70} to="/projects" icon={<ClockIcon />} label="مشاريع جارية" value={counts.running} tone="sky" hint={counts.running ? `متوسط الإنجاز ${n(avgProgress)}%` : 'لا توجد مشاريع جارية'} />
        <StatCard delay={140} icon={<CheckIcon />} label="تم تسليمها" value={counts.delivered} tone="brand" hint={`${n(counts.won)} فوز · ${n(counts.lost)} خسارة · ${n(counts.pending)} معلق`} />
        <StatCard delay={210} icon={<TrophyIcon />} label="نسبة الفوز" value={counts.winPct} suffix="%" tone="amber" hint={counts.delivered ? `من ${n(counts.delivered)} مشروع تم تسليمه` : 'لا توجد مشاريع مُسلّمة بعد'} />
      </div>

      {/* ===== حالة المشاريع ===== */}
      <Panel delay={100} title="حالة المشاريع" subtitle="كل مشروع إما جاري، أو تم تسليمه ونتيجته فوز أو خسارة أو معلق">
        <SegmentBar
          hints={{ pending: 'تم التسليم وبانتظار النتيجة، وممكن يرجع جاري', running: 'قيد العمل حالياً' }}
          segments={['running', 'pending', 'won', 'lost'].map((k) => ({ key: k, label: STATES[k].label, color: STATES[k].color, value: counts[k] }))}
        />
      </Panel>

      {/* ===== التسليمات والنتائج + فلتر الفترة ===== */}
      <SectionHead title="التسليمات والنتائج" subtitle={`المشاريع اللي اتسلّمت خلال: ${PERIOD_TEXT[period]}`}>
        <Segmented value={period} onChange={setPeriod} options={PERIODS} />
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" delay={60} title="التسليمات عبر الزمن" subtitle={`${UNIT_TEXT[period]} · الألوان = نتيجة المشروع`}>
          <StackedColumns data={timeline} />
        </Panel>

        <Panel className="lg:col-span-5" delay={120} title="نتائج التسليم" subtitle={`${n(pr.delivered)} مشروع مسلّم · ${PERIOD_TEXT[period]}`}
          action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><TrophyIcon className="h-5 w-5" /></span>}>
          <DonutChart
            centerValue={n(pr.delivered)} centerLabel="مشروع مسلّم"
            segments={['won', 'pending', 'lost'].map((k) => ({ label: STATES[k].label, color: STATES[k].color, value: pr[k] }))}
          />
          <p className="mt-4 text-center text-sm font-semibold text-neutral-400">
            نسبة الفوز في الفترة: <b className="text-brand-700">{pr.delivered ? `${n(pr.winPct)}%` : '—'}</b>
          </p>
        </Panel>
      </div>

      {/* ===== أداء الفرق ===== */}
      <SectionHead title="أداء الفرق" subtitle="كل فريق: إنجاز مهامه، وإيه اللي سلّمه ونتيجة كل مشروع (اضغطي على المشاريع المسلّمة)" />
      <div className="grid gap-5 pt-1 md:grid-cols-2 2xl:grid-cols-3">
        {teamCards.length === 0 && <p className="card col-span-full py-10 text-center text-sm text-neutral-400">لا توجد فرق بعد</p>}
        {teamCards.map(({ t, pct, done, total, b }, i) => (
          <TeamPerformanceCard
            key={t.id} team={t} pct={pct} done={done} total={total} breakdown={b} delay={i * 70}
            rank={i < 3 && b.delivered.length > 0 ? i + 1 : null}
          />
        ))}
      </div>

      {/* ===== الجاري + ضغط العمل + الحصر ===== */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" delay={80} title="المشاريع الجارية" subtitle="مرتبة بأقرب تاريخ تسليم"
          action={<Link to="/projects" className="text-sm font-bold text-brand-600 transition hover:text-brand-800">عرض الكل</Link>}>
          <ul className="space-y-2.5">
            {runningList.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-400">
                <CheckIcon className="h-9 w-9 text-brand-500" />لا توجد مشاريع جارية
              </li>
            )}
            {runningPage.map(({ p, engineer }, i) => {
              const k = daysLeft(p.deliveryDate);
              const prog = projectProgress(p);
              return (
                <li key={p.id ?? i}>
                  <Link to={`/engineers/${engineer.id}`} className="block rounded-xl border border-neutral-100 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold">{p.name || 'مشروع بدون اسم'}</p>
                        <p className="mt-0.5 truncate text-sm text-neutral-400">{engineer.name} · {fmtDate(p.deliveryDate)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {k !== null && k >= 0 && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${k <= 3 ? 'bg-brand-50 text-brand-600 ring-brand-200' : 'bg-neutral-50 text-neutral-500 ring-neutral-200'}`}>{soonText(k)}</span>
                        )}
                        <span className="text-base font-extrabold tabular-nums text-brand-700">{n(prog.pct)}%</span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-1000 ease-out" style={{ width: `${ready ? prog.pct : 0}%`, transitionDelay: `${i * 80}ms` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination page={safeProjectPage} pageCount={projectPageCount} pageSize={projectPageSize} itemCount={runningList.length} onChange={setProjectPage} />
        </Panel>

        <div className="space-y-4 lg:col-span-5">
          <Panel delay={140} title="ضغط العمل على المهندسين" subtitle="المهندسون الذين لديهم أكثر من مشروعين جاريين">
            <ul className="space-y-4">
              {workload.length === 0 && <li className="py-8 text-center text-sm text-neutral-400">لا يوجد مهندسون لديهم أكثر من مشروعين جاريين حاليًا</li>}
              {workload.map(({ engineer, count, avg }, i) => (
                <li key={engineer.id}>
                  <Link to={`/engineers/${engineer.id}`} className="group flex items-center gap-3">
                    <Avatar engineer={engineer} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-base font-bold transition group-hover:text-brand-700">{engineer.name}</p>
                        <p className="shrink-0 text-sm font-bold text-neutral-400">{n(count)} مشروع · <span className="text-brand-700">{n(avg)}%</span></p>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-1000 ease-out" style={{ width: `${ready ? (count / maxLoad) * 100 : 0}%`, transitionDelay: `${i * 90}ms` }} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          {hasrTotal > 0 && (
            <Panel delay={200} title="قسم الحصر" subtitle={`${n(hasrTotal)} مشروع وارد`}
              action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><HasrIcon className="h-5 w-5" /></span>}>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-neutral-100">
                {[[hasrSum.done, 'bg-brand-700'], [hasrSum.working, 'bg-brand-400'], [hasrSum.waiting, 'bg-neutral-300']].map(([v, c], i) => (
                  v > 0 && <div key={i} className={`${c} transition-[flex-grow] duration-1000 ease-out`} style={{ flexGrow: ready ? v : 0, flexBasis: 0 }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['تم', hasrSum.done, 'text-brand-700'], ['جاري', hasrSum.working, 'text-brand-600'], ['منتظر', hasrSum.waiting, 'text-neutral-500']].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-neutral-50 py-3 transition hover:bg-brand-50">
                    <p className={`text-2xl font-extrabold tabular-nums ${c}`}>{n(v)}</p>
                    <p className="text-sm font-semibold text-neutral-400">{l}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

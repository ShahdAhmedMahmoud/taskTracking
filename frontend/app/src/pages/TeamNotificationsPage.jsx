import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useTeamActivity } from '../hooks/useTeamActivity';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import { Empty } from '../components/ui/Loader';
import { BellIcon, CheckIcon, ClockIcon, ProjectsIcon, TasksIcon } from '../components/ui/Icons';
import { eventTitle } from '../utils/activityDiff';
import { teamLabel } from '../utils/helpers';
import { n } from '../utils/dashboardData';
import { timeAgo } from '../utils/dates';

const groupFor = (event) => event.group === 'tasks' ? 'المهام' : event.group === 'projects' || event.group === 'rounds' ? 'المشاريع والجولات' : 'تحديثات أخرى';

function EventCard({ event, isNew }) {
  const className = `group flex items-start gap-3 rounded-2xl border p-3.5 transition duration-300 ${event.actorId ? 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm' : ''} sm:p-4 ${isNew ? 'border-brand-200 bg-brand-50/45' : 'border-neutral-200 bg-white'}`;
  const content = <>
    <Avatar engineer={{ name: event.actorName }} size={42} />
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><b className="text-sm font-extrabold text-neutral-800">{event.actorName}</b><span className="text-sm text-neutral-600">{eventTitle(event)}</span><time title={new Date(event.at).toLocaleString('ar-EG')} className="ms-auto text-xs text-neutral-400">{timeAgo(event.at)}</time></span>
      <span className="mt-1 block truncate text-xs text-neutral-500">{event.project || 'تحديث على بيانات الفريق'}</span>
      {event.items?.length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">{event.items.slice(0, 4).map((item) => <span key={item} className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-100">{item}</span>)}</span>}
    </span>
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isNew ? 'bg-brand-700 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{isNew ? 'جديد' : 'مقروء'}</span>
  </>;
  if (!event.actorId) return <article className={className}>{content}</article>;
  return <Link to={`/engineers/${event.actorId}`} onClick={() => localStorage.setItem(`tender-dashboard-active-project:${event.actorId}`, event.projectId)} className={className}>{content}</Link>;
}

function ActivitySection({ title, events, isNew }) {
  const grouped = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = groupFor(event);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return [...map.entries()];
  }, [events]);
  return <section className="space-y-4">
    <h2 className="flex items-center gap-2 text-base font-extrabold text-neutral-800"><span className={`h-2.5 w-2.5 rounded-full ${isNew ? 'bg-brand-600' : 'bg-neutral-300'}`} />{title}<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs tabular-nums text-neutral-500">{n(events.length)}</span><span className="h-px flex-1 bg-neutral-100" /></h2>
    {events.length ? grouped.map(([group, list]) => <div key={group} className="space-y-2">
      <h3 className="flex items-center gap-2 px-1 text-xs font-bold text-neutral-500">{group === 'المهام' ? <TasksIcon className="h-4 w-4 text-brand-600" /> : <ProjectsIcon className="h-4 w-4 text-brand-600" />}{group}</h3>
      {list.map((event) => <EventCard key={event.id} event={event} isNew={isNew} />)}
    </div>) : <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">لا توجد إشعارات {isNew ? 'جديدة' : 'مقروءة'}.</p>}
  </section>;
}

export default function TeamNotificationsPage() {
  const { session } = useAuth();
  const { teams } = useData();
  const { enabled, events, unseen, seenAt, checking, markAllSeen, checkNow } = useTeamActivity();
  const team = teams.find((item) => item.id === session.id && item.type !== 'hasr');
  const newEvents = useMemo(() => events.filter((event) => event.detectedAt > seenAt), [events, seenAt]);
  const readEvents = useMemo(() => events.filter((event) => event.detectedAt <= seenAt), [events, seenAt]);
  const projectsCount = events.filter((event) => event.group === 'projects' || event.group === 'rounds').length;
  const taskCount = events.filter((event) => event.group === 'tasks').length;

  useEffect(() => {
    if (!enabled || !unseen) return undefined;
    const timer = setTimeout(markAllSeen, 900);
    return () => clearTimeout(timer);
  }, [enabled, unseen, events.length, markAllSeen]);

  if (!team || !enabled) return <Empty icon="🔎" title="الإشعارات غير متاحة" text="هذه الصفحة مخصصة لمدير الفريق." />;

  return <>
    <PageHeader title="إشعارات الفريق" subtitle={`تابعي تحديثات مهندسي ${teamLabel(team)} وحالة قراءتها.`} />
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/80 to-brand-100/70 p-5 shadow-soft animate-rise sm:p-7">
      <span aria-hidden className="pointer-events-none absolute -end-12 -top-16 h-56 w-56 rounded-full bg-brand-300/25 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100"><span className={`h-2 w-2 rounded-full ${checking ? 'animate-pulse bg-amber-500' : 'bg-brand-600'}`} />{checking ? 'جارٍ التحديث' : 'ملخص نشاط الفريق'}</span><h2 className="mt-3 text-2xl font-black text-brand-950 sm:text-3xl">كل تحديث في مكانه</h2><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">راجعي الجديد، وارجعي للإشعارات المقروءة وقت ما تحتاجيها.</p>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={checkNow} disabled={checking} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-extrabold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-800 disabled:opacity-60"><ClockIcon className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />تحديث النشاط</button>{unseen > 0 && <button type="button" onClick={markAllSeen} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"><CheckIcon className="h-4 w-4" />تعليم الكل كمقروء</button>}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[20rem]"><div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm ring-1 ring-brand-100"><p className="text-2xl font-black tabular-nums text-brand-800">{n(unseen)}</p><p className="mt-1 text-[11px] font-bold text-neutral-500">جديد</p></div><div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm ring-1 ring-brand-100"><p className="text-2xl font-black tabular-nums text-brand-800">{n(projectsCount)}</p><p className="mt-1 text-[11px] font-bold text-neutral-500">مشاريع وجولات</p></div><div className="rounded-2xl bg-white/90 p-3 text-center shadow-sm ring-1 ring-brand-100"><p className="text-2xl font-black tabular-nums text-brand-800">{n(taskCount)}</p><p className="mt-1 text-[11px] font-bold text-neutral-500">مهام</p></div></div>
      </div>
    </section>

    {events.length ? <div className="space-y-7"><ActivitySection title="الإشعارات الجديدة" events={newEvents} isNew /><ActivitySection title="الإشعارات المقروءة" events={readEvents} isNew={false} /></div>
      : <Empty icon={<BellIcon className="h-7 w-7" />} title="لا توجد تحديثات حتى الآن" text="ستظهر هنا تغييرات المهندسين على المشاريع والمهام بعد مزامنة بيانات الفريق." />}
    <p className="mt-5 text-center text-xs leading-5 text-neutral-400">يُكتشف نشاط المهندسين عند تحديث بيانات الفريق، وقد يتأخر ظهوره حتى موعد المزامنة التالية.</p>
  </>;
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import { Empty } from '../components/ui/Loader';
import Icon from '../components/ui/EngineerIcons';
import { activityService, describeEvent, eventMeta, EVENT_GROUPS, typesOfGroup } from '../services/activityService';
import { n } from '../utils/dashboardData';
import { timeAgo } from '../utils/dates';

// عدّلي لو مسار صفحة المهندس عندك مختلف
const engineerPath = (id, projectId) => `/engineer/${id}${projectId ? `?p=${projectId}` : ''}`;
const ARCHIVE_PATH = '/archives';

const TONE = {
  ok: 'bg-brand-600 text-white',
  info: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
  neutral: 'bg-neutral-100 text-neutral-600',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
};
const RANGES = [['all', 'الكل', 0], ['today', 'اليوم', 1], ['week', '٧ أيام', 7], ['month', '٣٠ يوم', 30]];

const dayKey = (iso) => new Date(iso).toDateString();
const dayLabel = (iso) => {
  const d = new Date(iso);
  const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
};
const fromOf = (range) => {
  const days = RANGES.find((r) => r[0] === range)?.[2];
  if (!days) return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString();
};

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />
          <div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 animate-pulse rounded bg-neutral-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" /></div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ ev, fresh, onOpen }) {
  const meta = eventMeta(ev.type);
  const { title, detail } = describeEvent(ev);
  const unread = !ev.readAt;
  return (
    <li>
      <button
        type="button" onClick={() => onOpen(ev)}
        className={`group relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl p-4 text-start ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft ${unread ? 'bg-white ring-brand-200' : 'bg-white/70 ring-neutral-200'} ${fresh ? 'shadow-soft ring-2 ring-brand-500' : ''}`}
      >
        {unread && <span className="absolute inset-y-0 start-0 w-1 bg-brand-600" aria-hidden="true" />}
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[meta.tone]}`}><Icon name={meta.icon} className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className={`text-sm leading-snug ${unread ? 'font-extrabold text-neutral-900' : 'font-bold text-neutral-700'}`}>{title}</span>
            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="غير مقروء" />}
            <time dateTime={ev.updatedAt || ev.createdAt} className="ms-auto shrink-0 text-xs text-neutral-400">{timeAgo(ev.updatedAt || ev.createdAt)}</time>
          </span>
          {detail && <span className="mt-0.5 block truncate text-sm text-neutral-500">{detail}</span>}
          <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2 py-1 font-bold text-neutral-700 ring-1 ring-neutral-100"><span className="grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[9px] text-white">{(ev.actor?.name || '؟').trim().charAt(0)}</span>{ev.actor?.name || 'النظام'}</span>
            {ev.team?.name && <span className="rounded-lg bg-neutral-50 px-2 py-1 font-semibold text-neutral-500 ring-1 ring-neutral-100">{ev.team.name}</span>}
            {ev.project?.name && <span className="max-w-[16rem] truncate rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700 ring-1 ring-brand-100">{ev.project.name}</span>}
          </span>
        </span>
        <Icon name="back" className="mt-3 h-4 w-4 shrink-0 text-neutral-300 transition group-hover:-translate-x-1 group-hover:text-brand-600" />
      </button>
    </li>
  );
}

export default function ActivityPage() {
  const { session } = useAuth();
  const { teams } = useData();
  const navigate = useNavigate();

  const [group, setGroup] = useState('all');
  const [range, setRange] = useState('all');
  const [teamId, setTeamId] = useState('');
  const [engineerId, setEngineerId] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [q, setQ] = useState('');
  const dq = useDebounced(q);

  const [items, setItems] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const [fresh, setFresh] = useState(new Set());
  const seen = useRef(new Set());

  const people = useMemo(() => teams.flatMap((t) => t.engineers.map((e) => ({ engineerId: e.id, name: e.name, teamId: t.id, teamName: t.label ? `فريق ${t.label}` : t.id }))), [teams]);
  const engineersOfTeam = useMemo(() => teams.filter((t) => !teamId || t.id === teamId).flatMap((t) => t.engineers), [teams, teamId]);

  const params = useMemo(() => ({ types: typesOfGroup(group), teamId: teamId || undefined, engineerId: engineerId || undefined, q: dq, from: fromOf(range), unreadOnly, people }), [group, teamId, engineerId, dq, range, unreadOnly, people]);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await activityService.list(params);
      seen.current = new Set(r.items.map((e) => e.id));
      setItems(r.items); setCursor(r.nextCursor); setUnread(r.unread ?? 0); setFresh(new Set());
    } catch (e) { setError(e.message || 'تعذر تحميل النشاط'); setItems([]); }
  }, [params]);

  useEffect(() => { setItems(null); load(); }, [load]);

  /* تحديث تلقائي كل 30 ثانية: الجديد بس بيتضاف فوق ومعمول له تمييز لحظي */
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const r = await activityService.list({ ...params, cursor: undefined });
        setUnread(r.unread ?? 0);
        const incoming = r.items.filter((e) => !seen.current.has(e.id));
        if (!incoming.length) return;
        incoming.forEach((e) => seen.current.add(e.id));
        setItems((prev) => [...incoming, ...(prev || [])]);
        setFresh(new Set(incoming.map((e) => e.id)));
        setTimeout(() => setFresh(new Set()), 6000);
      } catch { /* الدورة الجاية */ }
    }, 30000);
    return () => clearInterval(id);
  }, [params]);

  if (session.role !== 'dept') return <Navigate to="/" replace />;

  const loadMore = async () => {
    setMore(true);
    try {
      const r = await activityService.list({ ...params, cursor });
      const add = r.items.filter((e) => !seen.current.has(e.id));
      add.forEach((e) => seen.current.add(e.id));
      setItems((p) => [...p, ...add]); setCursor(r.nextCursor);
    } catch (e) { setError(e.message); } finally { setMore(false); }
  };

  const markRead = async (ids) => {
    setItems((p) => p.map((e) => (ids.includes(e.id) && !e.readAt ? { ...e, readAt: new Date().toISOString() } : e)));
    try { const r = await activityService.markRead({ ids, people }); setUnread(r.unread ?? 0); } catch { load(); }
  };
  const markAll = async () => {
    setItems((p) => p.map((e) => ({ ...e, readAt: e.readAt || new Date().toISOString() })));
    try { const r = await activityService.markRead({ all: true, people }); setUnread(r.unread ?? 0); } catch { load(); }
  };

  const open = (ev) => {
    if (!ev.readAt) markRead([ev.id]);
    if (ev.type === 'project.archived' || ev.type === 'project.deleted') navigate(ARCHIVE_PATH);
    else if (ev.actor?.engineerId && ev.type !== 'project.deleted') navigate(engineerPath(ev.actor.engineerId, ev.project?.id));
  };

  const groups = [];
  (items || []).forEach((e) => {
    const k = dayKey(e.createdAt);
    const last = groups[groups.length - 1];
    if (last?.k === k) last.list.push(e); else groups.push({ k, label: dayLabel(e.createdAt), list: [e] });
  });

  const tasksDone = (items || []).filter((e) => e.type === 'task.completed' && dayKey(e.createdAt) === new Date().toDateString()).reduce((s, e) => s + (e.meta?.count || 1), 0);

  return (
    <>
      <PageHeader back title="مركز النشاط" />

      <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-5 shadow-soft sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="min-w-0 flex-1 basis-60">
            <h1 className="flex items-center gap-3 text-2xl font-extrabold text-brand-900 sm:text-3xl">
              <span className="relative"><Icon name="bell" className="h-8 w-8 text-brand-600" strokeWidth={1.75} />{unread > 0 && <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full bg-brand-600 ring-2 ring-white" />}</span>
              مركز النشاط والإشعارات
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-[#3C3C3B]">كل تعديل أو إضافة أو إنجاز عند أي مهندس بيظهر هنا.<span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />تحديث تلقائي</span></p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-2xl bg-white/80 px-5 py-2.5 text-center ring-1 ring-brand-100 backdrop-blur"><p className="text-2xl font-extrabold tabular-nums text-brand-900">{n(unread)}</p><p className="text-xs font-semibold text-neutral-500">غير مقروء</p></div>
            <div className="rounded-2xl bg-white/80 px-5 py-2.5 text-center ring-1 ring-brand-100 backdrop-blur"><p className="text-2xl font-extrabold tabular-nums text-brand-900">{n(tasksDone)}</p><p className="text-xs font-semibold text-neutral-500">مهام اتنجزت النهارده</p></div>
          </div>
        </div>
      </section>

      {/* فلاتر */}
      <div className="sticky top-0 z-20 -mx-1 mb-4 space-y-3 bg-[#F8F9FC]/90 px-1 pb-3 pt-1 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم مهندس أو مشروع أو نوع نشاط…" className="w-full rounded-xl bg-white py-2.5 pe-3 ps-9 text-sm outline-none ring-1 ring-neutral-200 transition focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setEngineerId(''); }} aria-label="الفريق" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500">
            <option value="">كل الفرق</option>
            {teams.filter((t) => t.type !== 'hasr').map((t) => <option key={t.id} value={t.id}>{t.label ? `فريق ${t.label}` : t.id}</option>)}
          </select>
          <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} aria-label="المهندس" className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500">
            <option value="">كل المهندسين</option>
            {engineersOfTeam.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button type="button" onClick={markAll} disabled={!unread} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-40"><Icon name="check" className="h-4 w-4" />تحديد الكل كمقروء</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="نوع النشاط">
            {EVENT_GROUPS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={group === k} onClick={() => setGroup(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${group === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{l}</button>
            ))}
          </div>
          <span className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block" />
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="الفترة">
            {RANGES.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={range === k} onClick={() => setRange(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${range === k ? 'bg-brand-900 text-white ring-brand-900' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{l}</button>
            ))}
          </div>
          <label className="ms-auto inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-neutral-600">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="peer sr-only" />
            <span className={`relative h-5 w-9 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${unreadOnly ? 'bg-brand-600' : 'bg-neutral-300'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${unreadOnly ? 'end-0.5' : 'end-[1.1rem]'}`} /></span>
            غير المقروء فقط
          </label>
        </div>
      </div>

      {items === null && <Skeleton />}
      {error && <Empty icon="⚠️" title="تعذر تحميل النشاط" text={error} />}
      {items && !error && !items.length && <Empty icon="🔔" title="مفيش نشاط مطابق" text="غيّري الفلاتر أو استني أي تعديل جديد من المهندسين." />}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.k} aria-label={g.label}>
            <h2 className="mb-2 flex items-center gap-3 text-xs font-extrabold text-neutral-500"><span>{g.label}</span><span className="h-px flex-1 bg-neutral-200" /><span className="tabular-nums text-neutral-400">{n(g.list.length)}</span></h2>
            <ul className="space-y-2.5">{g.list.map((ev) => <EventCard key={ev.id} ev={ev} fresh={fresh.has(ev.id)} onOpen={open} />)}</ul>
          </section>
        ))}
      </div>

      {cursor && (
        <div className="mt-6 text-center">
          <button type="button" onClick={loadMore} disabled={more} className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-60">{more ? 'جاري التحميل…' : 'عرض المزيد'}</button>
        </div>
      )}
      <div className="h-16" />
    </>
  );
}
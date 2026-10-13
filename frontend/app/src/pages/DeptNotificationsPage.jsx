import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useDeptActivity } from '../hooks/useDeptActivity';
import useCountUp from '../hooks/useCountUp';
import Avatar from '../components/ui/Avatar';
import Panel from '../components/ui/Panel';
import { Empty } from '../components/ui/Loader';
import {
  BellIcon, TasksIcon, ArchiveIcon, CheckIcon, ClockIcon, TrophyIcon, HasrIcon,
  CalendarIcon, SearchIcon, ArrowIcon, ChevronDownIcon, CloseIcon,
} from '../components/ui/Icons';
import { PlusIcon, LayersIcon } from '../components/engineer/EngineerIcons';
import { timeAgo } from '../utils/dates';
import { eventTitle } from '../utils/activityDiff';
import { n } from '../utils/dashboardData';

const ICON = {
  project_added: PlusIcon, project_removed: ArchiveIcon, project_edit: CalendarIcon,
  delivered: CheckIcon, reopened: ClockIcon, outcome: TrophyIcon,
  tasks_done: TasksIcon, tasks_undone: TasksIcon, tasks_review: TasksIcon, tasks_na: TasksIcon, tasks_edit: TasksIcon,
  custom_added: TasksIcon, custom_removed: TasksIcon, custom_done: TasksIcon,
  round_added: LayersIcon, round_done: LayersIcon,
  hasr_work: HasrIcon, hasr_done: HasrIcon, hasr_edit: HasrIcon,
};
const GROUPS = [['all', 'الكل'], ['projects', 'المشاريع'], ['tasks', 'المهام'], ['rounds', 'الجولات'], ['hasr', 'الحصر']];
const DAY = 86400000;

const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA'); // YYYY-MM-DD بالتوقيت المحلي
const dayLabel = (key) => {
  if (key === dayKey(Date.now())) return 'النهاردة';
  if (key === dayKey(Date.now() - DAY)) return 'امبارح';
  return new Date(`${key}T12:00:00`).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
};
const ago = (ms) => timeAgo(new Date(ms).toISOString());

function Stat({ label, value, delay }) {
  const v = useCountUp(value);
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3.5 text-center ring-1 ring-white/20 backdrop-blur transition duration-300 animate-rise hover:-translate-y-1 hover:bg-white/20" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-3xl font-extrabold tabular-nums">{n(v)}</p>
      <p className="mt-0.5 text-xs font-semibold text-white/75">{label}</p>
    </div>
  );
}

function EventCard({ ev, engineer, i, fresh }) {
  const [open, setOpen] = useState(false);
  const Icon = ICON[ev.kind] || BellIcon;
  const items = ev.items || [];
  const shown = open ? items : items.slice(0, 3);
  const to = ev.actorId ? `/engineers/${ev.actorId}` : `/hasr/${ev.teamId}`;

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border bg-white p-3.5 transition duration-300 animate-rise hover:-translate-y-0.5 hover:shadow-soft ${fresh ? 'border-brand-300' : 'border-neutral-100 hover:border-brand-200'}`}
      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
    >
      {fresh && <span className="absolute inset-y-0 start-0 w-1 bg-brand-600" />}
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          {ev.actorId
            ? <Avatar engineer={engineer || { name: ev.actorName }} size={44} />
            : <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600"><HasrIcon className="h-5 w-5" /></span>}
          <span className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-white"><Icon className="h-3.5 w-3.5" /></span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-neutral-700"><b className="font-extrabold text-neutral-900">{ev.actorName}</b> {eventTitle(ev)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-neutral-400">
            {ev.project && <span className="max-w-[16rem] truncate text-brand-700">{ev.project}</span>}
            <span>{ev.teamName}</span>
            <span title={new Date(ev.at).toLocaleString('ar-EG')}>{ago(ev.at)}</span>
            {fresh && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-extrabold text-white">جديد</span>}
          </p>

          {items.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {shown.map((it, k) => <span key={k} className="max-w-full truncate rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600">{it}</span>)}
              {items.length > 3 && (
                <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-extrabold text-brand-700 transition hover:bg-brand-100">
                  {open ? 'عرض أقل' : `+${n(items.length - 3)}`}
                  <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        <Link to={to} onClick={() => { if (ev.actorId && ev.projectId) localStorage.setItem(`tender-dashboard-active-project:${ev.actorId}`, ev.projectId); }} aria-label="فتح" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 ring-1 ring-neutral-200 transition duration-300 hover:bg-brand-600 hover:text-white hover:ring-brand-600">
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>
    </li>
  );
}

export default function DeptNotificationsPage() {
  const { teams } = useData();
  const { events, seenAt, startedAt, lastCheck, checking, markAllSeen, clear, checkNow } = useDeptActivity();

  const [group, setGroup] = useState('all');
  const [actor, setActor] = useState('all');
  const [day, setDay] = useState(null);
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);

  const baseline = useRef(seenAt); // بنثبّت لحظة الدخول عشان "جديد" يفضل ظاهر وإحنا في الصفحة
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    const t = setTimeout(markAllSeen, 3000);
    return () => { cancelAnimationFrame(id); clearTimeout(t); };
  }, []); // eslint-disable-line

  const engineersById = useMemo(() => new Map(teams.flatMap((t) => t.engineers).map((e) => [e.id, e])), [teams]);

  /* ---------- أرقام ---------- */
  const todayKey = dayKey(Date.now());
  const todayCount = events.filter((e) => dayKey(e.at) === todayKey).length;
  const active24 = new Set(events.filter((e) => Date.now() - e.at < DAY).map((e) => e.actorId ?? e.actorName)).size;
  const newCount = events.filter((e) => e.detectedAt > baseline.current).length;

  const days = useMemo(() => {
    const list = Array.from({ length: 7 }, (_, i) => {
      const ms = Date.now() - (6 - i) * DAY;
      return { key: dayKey(ms), label: new Date(ms).toLocaleDateString('ar-EG', { weekday: 'short' }), count: 0, today: i === 6 };
    });
    events.forEach((e) => { const d = list.find((x) => x.key === dayKey(e.at)); if (d) d.count += 1; });
    return list;
  }, [events]);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const leaders = useMemo(() => {
    const map = new Map();
    events.filter((e) => Date.now() - e.at < 7 * DAY).forEach((e) => {
      const k = e.actorId ?? `hasr:${e.teamId}`;
      const cur = map.get(k) || { key: k, id: e.actorId, name: e.actorName, count: 0 };
      cur.count += 1;
      map.set(k, cur);
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [events]);
  const maxLead = Math.max(1, ...leaders.map((l) => l.count));

  const actors = useMemo(() => {
    const seen = new Map();
    events.forEach((e) => { if (e.actorId && !seen.has(e.actorId)) seen.set(e.actorId, { id: e.actorId, name: e.actorName }); });
    return [...seen.values()];
  }, [events]);

  /* ---------- فلترة ---------- */
  const groupCount = (g) => (g === 'all' ? events.length : events.filter((e) => e.group === g).length);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return events.filter((e) => {
      if (group !== 'all' && e.group !== group) return false;
      if (actor !== 'all' && e.actorId !== actor) return false;
      if (day && dayKey(e.at) !== day) return false;
      if (term && ![e.actorName, e.project, eventTitle(e), ...(e.items || [])].join(' ').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [events, group, actor, day, q]);

  const grouped = useMemo(() => {
    const out = [];
    shown.forEach((e) => {
      const k = dayKey(e.at);
      if (!out.length || out[out.length - 1].key !== k) out.push({ key: k, list: [] });
      out[out.length - 1].list.push(e);
    });
    return out;
  }, [shown]);

  const filtered = group !== 'all' || actor !== 'all' || day || q;
  const resetFilters = () => { setGroup('all'); setActor('all'); setDay(null); setQ(''); };

  return (
    <div className="space-y-5">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lift animate-rise sm:p-7" style={{ backgroundImage: 'linear-gradient(135deg, #2A317A, #414A9B, #2A317A)' }}>
        <span aria-hidden className="pointer-events-none absolute -start-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 end-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-bold backdrop-blur">
              <span className="relative grid h-2.5 w-2.5 place-items-center"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-white/70" /><span className="h-2 w-2 rounded-full bg-white" /></span>
              {checking ? 'جاري الفحص…' : lastCheck ? `آخر فحص ${ago(lastCheck)}` : 'التتبع شغّال'}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">إشعارات القسم</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-7 text-white/80">كل حاجة بيعملها أي مهندس على مشاريعه ومهامه بتظهر هنا، وبتتحدّث تلقائيًا كل ٤٥ ثانية.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={checkNow} disabled={checking} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-brand-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60">
                <ClockIcon className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />تحديث الآن
              </button>
              <button type="button" onClick={() => { markAllSeen(); baseline.current = Date.now(); }} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold ring-1 ring-white/25 transition hover:bg-white/25">
                <CheckIcon className="h-4 w-4" />تعليم الكل كمقروء
              </button>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:grid-cols-4">
            <Stat delay={0} label="جديد" value={newCount} />
            <Stat delay={60} label="النهاردة" value={todayCount} />
            <Stat delay={120} label="مهندسين نشطين (٢٤ ساعة)" value={active24} />
            <Stat delay={180} label="إجمالي السجل" value={events.length} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* ===== الفيد ===== */}
        <Panel
          className="lg:col-span-8" delay={60} title="سجل النشاط"
          subtitle={`${n(shown.length)} حركة${filtered ? ' (بعد التصفية)' : ''}`}
          action={events.length > 0 && (
            <button
              type="button"
              onClick={() => { if (window.confirm('مسح كل سجل الإشعارات من الجهاز ده؟')) clear(); }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              مسح السجل
            </button>
          )}
        >
          {/* فلاتر */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[11rem] flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-neutral-400"><SearchIcon className="h-4 w-4" /></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي في الإشعارات..." className="input ps-9" />
              </div>
              {filtered && (
                <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-brand-50 hover:text-brand-700">
                  <CloseIcon className="h-4 w-4" />مسح الفلاتر
                </button>
              )}
            </div>

            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="نوع الحركة">
              {GROUPS.map(([k, label]) => (
                <button
                  key={k} type="button" aria-pressed={group === k} onClick={() => setGroup(k)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition duration-300 active:scale-95 ${group === k ? 'bg-brand-600 text-white shadow-soft' : 'bg-neutral-100 text-neutral-600 hover:bg-brand-50 hover:text-brand-700'}`}
                >
                  {label}<span className={`rounded-full px-1.5 text-xs tabular-nums ${group === k ? 'bg-white/20' : 'bg-white'}`}>{n(groupCount(k))}</span>
                </button>
              ))}
            </div>

            {actors.length > 1 && (
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="المهندس">
                {[{ id: 'all', name: 'كل المهندسين' }, ...actors].map((a) => (
                  <button
                    key={a.id} type="button" aria-pressed={actor === a.id} onClick={() => setActor(a.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full py-1 pe-3.5 text-sm font-bold transition duration-300 active:scale-95 ${a.id === 'all' ? 'ps-3.5' : 'ps-1'} ${actor === a.id ? 'bg-brand-600 text-white shadow-soft' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-brand-50 hover:text-brand-700'}`}
                  >
                    {a.id !== 'all' && <Avatar engineer={engineersById.get(a.id) || a} size={26} />}
                    <span className="max-w-[9rem] truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* القايمة */}
          {events.length === 0 ? (
            <div className="py-6">
              <Empty
                icon="🔔" title="لسه مفيش حركات"
                text={`التتبع شغّال من ${new Date(startedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}. أول ما أي مهندس يعدّل في مشاريعه أو مهامه هيظهر هنا.`}
              />
            </div>
          ) : shown.length === 0 ? (
            <div className="py-6"><Empty icon="🔎" title="مفيش نتائج مطابقة" text="جرّبي تغيّري الفلاتر أو البحث." /></div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ key, list }) => (
                <section key={key}>
                  <h3 className="mb-2.5 flex items-center gap-3 text-sm font-extrabold text-neutral-500">
                    {dayLabel(key)}<span className="h-px flex-1 bg-neutral-100" /><span className="text-xs tabular-nums text-neutral-400">{n(list.length)}</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {list.map((ev, i) => (
                      <EventCard key={ev.id} ev={ev} i={i} engineer={engineersById.get(ev.actorId)} fresh={ev.detectedAt > baseline.current} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Panel>

        {/* ===== الشريط الجانبي ===== */}
        <div className="space-y-4 lg:col-span-4">
          <Panel delay={100} title="آخر ٧ أيام" subtitle="اضغطي على يوم لتصفية الحركات">
            <div className="flex h-40 items-end justify-between gap-2">
              {days.map((d, i) => {
                const active = day === d.key;
                const px = d.count ? Math.max(18, Math.round(112 * (d.count / maxDay))) : 6;
                return (
                  <button
                    key={d.key} type="button" onClick={() => setDay(active ? null : d.key)} aria-pressed={active} title={`${d.count} حركة`}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    {d.count > 0 && <span className={`text-xs font-extrabold tabular-nums transition ${active ? 'text-brand-700' : 'text-neutral-400'}`}>{n(d.count)}</span>}
                    <span
                      className={`w-full max-w-[2.5rem] rounded-xl group-hover:scale-x-110 ${d.count ? (active ? 'bg-brand-600' : 'bg-brand-300 group-hover:bg-brand-500') : 'bg-neutral-100'}`}
                      style={{ height: ready ? px : 0, transition: `height .8s cubic-bezier(.22,1,.36,1) ${i * 60}ms, background-color .3s, transform .3s` }}
                    />
                    <span className={`text-xs font-bold ${d.today ? 'text-brand-700' : 'text-neutral-400'}`}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel delay={140} title="الأكثر نشاطًا" subtitle="عدد الحركات خلال ٧ أيام">
            {leaders.length === 0 ? <p className="py-6 text-center text-sm text-neutral-400">لا يوجد نشاط بعد</p> : (
              <ul className="space-y-3.5">
                {leaders.map((l, i) => (
                  <li key={l.key}>
                    <button type="button" disabled={!l.id} onClick={() => l.id && setActor(actor === l.id ? 'all' : l.id)} className="group flex w-full items-center gap-3 text-start">
                      {l.id
                        ? <Avatar engineer={engineersById.get(l.id) || { name: l.name }} size={38} />
                        : <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-brand-50 text-brand-600"><HasrIcon className="h-5 w-5" /></span>}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold transition group-hover:text-brand-700">{l.name}</span>
                          <span className="text-xs font-extrabold tabular-nums text-neutral-500">{n(l.count)}</span>
                        </span>
                        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-neutral-100">
                          <span className="block h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-1000 ease-out" style={{ width: `${ready ? (l.count / maxLead) * 100 : 0}%`, transitionDelay: `${i * 80}ms` }} />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* <Panel delay={180} title="إزاي بتشتغل الإشعارات؟">
            <ul className="space-y-2 text-sm leading-7 text-neutral-500">
              <li>• اللوحة بتفحص بيانات كل المهندسين كل ٤٥ ثانية وهي مفتوحة.</li>
              <li>• لو قفلتيها، أول ما تفتحي بتطلع التغييرات اللي حصلت بعد آخر زيارة.</li>
              <li>• السجل محفوظ على الجهاز ده بس.</li>
              <li>• تعديلاتك أنتِ على لوحات المهندسين مش بتظهر كإشعارات.</li>
            </ul>
          </Panel> */}
        </div>
      </div>
    </div>
  );
}

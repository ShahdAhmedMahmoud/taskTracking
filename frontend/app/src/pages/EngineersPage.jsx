import { useEffect, useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import ProgressRing from '../components/ui/ProgressRing';
import Segmented from '../components/ui/Segmented';
import EngineerTile from '../components/engineers/EngineerTile';
import { teamLabel } from '../utils/helpers';
import { n, daysLeft, projectProgress, stateOf } from '../utils/dashboardData';

const SORTS = [
  ['load', 'الأكثر مشاريع جارية'],
  ['deadline', 'أقرب تسليم'],
  ['progress', 'الأعلى إنجازًا'],
  ['name', 'الاسم'],
];
const VIEWS = [['cards', 'كروت'], ['list', 'قائمة']];

/** كل أرقام المهندس من بيانات الـ API (مشاريعه + مهامه) */
function metricsOf(data) {
  const projects = data?.projects || [];
  const running = projects.filter((p) => !p.finished);
  const counts = { running: running.length, pending: 0, won: 0, lost: 0 };
  projects.forEach((p) => { if (p.finished) counts[stateOf(p)] += 1; });
  const decided = counts.won + counts.lost;

  let td = 0; let tt = 0;
  running.forEach((p) => { const r = projectProgress(p); td += r.done; tt += r.total; });

  const dated = running
    .map((p) => ({ p, k: daysLeft(p.deliveryDate) }))
    .filter((x) => x.k !== null)
    .sort((a, b) => a.k - b.k);

  return {
    counts,
    delivered: counts.pending + decided,
    winPct: decided ? Math.round((counts.won / decided) * 100) : null,
    td, tt,
    pct: tt ? Math.round((td / tt) * 100) : 0,
    next: dated[0] || null,
    overdue: dated.filter((x) => x.k < 0).length,
    lastSaved: data?.lastSaved,
  };
}

const SORTERS = {
  load: (a, b) => b.m.counts.running - a.m.counts.running || a.e.name.localeCompare(b.e.name, 'ar'),
  deadline: (a, b) => (a.m.next ? a.m.next.k : 1e9) - (b.m.next ? b.m.next.k : 1e9),
  progress: (a, b) => b.m.pct - a.m.pct,
  name: (a, b) => a.e.name.localeCompare(b.e.name, 'ar'),
};

const SearchIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);

export default function EngineersPage() {
  const { teams, engineers } = useData();
  const [q, setQ] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [sort, setSort] = useState('load');
  const [view, setView] = useState('cards');

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* ---------- كل الفرق مع أرقام مهندسيها ---------- */
  const rows = useMemo(
    () => teams
      .filter((t) => t.engineers.length)
      .map((t) => ({ t, list: t.engineers.map((e) => ({ e, m: metricsOf(engineers[e.id]) })) })),
    [teams, engineers],
  );

  /* ---------- ملخص الهيرو (مش متأثر بالفلاتر) ---------- */
  const summary = useMemo(() => {
    const all = rows.flatMap((r) => r.list);
    const td = all.reduce((a, x) => a + x.m.td, 0);
    const tt = all.reduce((a, x) => a + x.m.tt, 0);
    return {
      engineers: all.length,
      running: all.reduce((a, x) => a + x.m.counts.running, 0),
      overdue: all.reduce((a, x) => a + x.m.overdue, 0),
      free: all.filter((x) => x.m.counts.running === 0).length,
      pct: tt ? Math.round((td / tt) * 100) : 0,
    };
  }, [rows]);

  /* ---------- بحث + فلتر فريق + ترتيب ---------- */
  const term = q.trim().toLowerCase();
  const visible = useMemo(
    () => rows
      .filter(({ t }) => teamId === 'all' || t.id === teamId)
      .map(({ t, list }) => ({
        t,
        list: list
          .filter(({ e }) => !term || [e.name, teamLabel(t), t.manager].some((s) => (s || '').toLowerCase().includes(term)))
          .sort(SORTERS[sort]),
      }))
      .filter(({ list }) => list.length),
    [rows, teamId, term, sort],
  );
  const shown = visible.reduce((a, r) => a + r.list.length, 0);

  const stats = [
    ['مهندس', summary.engineers, 'text-white'],
    ['مشروع جاري', summary.running, 'text-white'],
    ['متاحين الآن', summary.free, 'text-emerald-200'],
    ['مواعيد متأخرة', summary.overdue, summary.overdue ? 'text-amber-200' : 'text-white'],
  ];

  return (
    <>
      <PageHeader back title="اختيار مهندس" subtitle="اختاري مهندس لمتابعة وتحديث مهام مشاريعه" />

      {/* ===== Hero: صورة سريعة عن حمل الفريق كله ===== */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-5 text-white shadow-lift animate-rise sm:p-7">
        <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 end-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
            {stats.map(([label, v, c]) => (
              <div key={label} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                <p className={`text-3xl font-extrabold tabular-nums ${c}`}>{n(v)}</p>
                <p className="mt-0.5 text-sm font-semibold text-white/70">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex w-full items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur sm:w-auto">
            <ProgressRing pct={summary.pct} size={88} stroke={9} tone="light" />
            <div>
              <p className="text-sm font-bold text-white/70">متوسط إنجاز المشاريع الجارية</p>
              <p className="mt-1 text-sm text-white/60">على مستوى كل المهندسين</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== أدوات البحث والفلترة ===== */}
      <div className="card mb-6 space-y-4 p-4 animate-rise" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-60">
            <span className="sr-only">ابحثي عن مهندس</span>
            <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي بالاسم أو الفريق أو المدير"
              className="w-full rounded-xl bg-slate-50 py-2.5 pe-4 ps-11 text-sm font-semibold outline-none ring-1 ring-slate-200 transition placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-brand-400"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-400">
            ترتيب
            <select
              value={sort} onChange={(e) => setSort(e.target.value)}
              className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400"
            >
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <Segmented value={view} onChange={setView} options={VIEWS} />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="فلتر الفرق">
          {[{ id: 'all', label: 'كل الفرق', count: summary.engineers }, ...rows.map(({ t, list }) => ({ id: t.id, label: teamLabel(t), color: t.color || '#6366f1', count: list.length }))].map((c) => {
            const on = teamId === c.id;
            return (
              <button
                key={c.id} type="button" onClick={() => setTeamId(c.id)} aria-pressed={on}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition duration-300 ${on ? 'bg-brand-600 text-white ring-brand-600 shadow-soft' : 'bg-white text-slate-500 ring-slate-200 hover:bg-brand-50 hover:text-brand-800'}`}
              >
                {c.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />}
                {c.label}
                <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{n(c.count)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== النتائج ===== */}
      {shown === 0 && (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <SearchIcon className="h-10 w-10 text-slate-300" />
          <p className="font-bold">{rows.length === 0 ? 'لا يوجد مهندسين بعد' : 'مفيش مهندس بالاسم ده'}</p>
          <p className="text-sm text-slate-400">{rows.length === 0 ? 'ضيفي موظف جديد من صفحة إضافة موظف' : 'جرّبي كلمة تانية أو اختاري كل الفرق'}</p>
          {(q || teamId !== 'all') && (
            <button type="button" onClick={() => { setQ(''); setTeamId('all'); }} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
              مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {visible.map(({ t, list }) => {
        const color = t.color || '#6366f1';
        const running = list.reduce((a, x) => a + x.m.counts.running, 0);
        return (
          <section key={t.id} className="mb-9">
            <header className="mb-4 flex flex-wrap items-center gap-3">
              <span className="h-9 w-1.5 rounded-full" style={{ background: color }} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold">{teamLabel(t)}</h2>
                <p className="truncate text-sm text-slate-400">مدير الفريق: {t.manager}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{n(list.length)} مهندس</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">{n(running)} مشروع جاري</span>
            </header>

            <div className={view === 'cards' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2.5'}>
              {list.map(({ e, m }, i) => (
                <EngineerTile key={e.id} eng={e} team={t} m={m} variant={view === 'cards' ? 'card' : 'list'} ready={ready} delay={Math.min(i, 8) * 60} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
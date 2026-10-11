import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Avatar from '../components/ui/Avatar';
import { ProjectsIcon, ClockIcon, CheckIcon, CalendarIcon, ArrowIcon } from '../components/ui/Icons';
import { NoteIcon, LayersIcon } from '../components/engineer/EngineerIcons';
import { mainTeams, teamLabel } from '../utils/helpers';
import { STATES, n, stateOf, daysLeft, projectProgress, collectProjects } from '../utils/dashboardData';

/* ================= ثوابت ================= */
const TABS = [
  ['all', 'كل المشاريع', ProjectsIcon, 'bg-brand-50 text-brand-700', '#2a317a'],
  ['running', 'جارية', ClockIcon, 'bg-brand-50 text-brand-600', STATES.running.color],
  // ['late', 'متأخرة', CalendarIcon, 'bg-brand-50 text-brand-600', STATES.lost.color],
  ['delivered', 'تم التسليم', CheckIcon, 'bg-brand-50 text-brand-700', '#2a317a'],
];
const OUTCOMES = [['all', 'كل المسلّم'], ['pending', 'معلق'], ['won', 'فوز'], ['lost', 'خسارة']];
const SORTS = [
  ['auto', 'الترتيب الذكي'],
  ['deadline', 'أقرب تسليم'],
  ['recent', 'الأحدث تسليمًا'],
  ['progress', 'الأعلى إنجازًا'],
  ['name', 'الاسم'],
];
const GRID = 'md:grid-cols-[minmax(0,2.3fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1.5fr)]';

const isLate = (p) => { const k = daysLeft(p.deliveryDate); return !p.finished && k !== null && k < 0; };
const matches = (p, status, outcome) => {
  if (status === 'running') return !p.finished;
  if (status === 'late') return isLate(p);
  if (status === 'delivered') return !!p.finished && (outcome === 'all' || stateOf(p) === outcome);
  return true;
};

const time = (x) => { const v = new Date(x.p.deliveryDate).getTime(); return Number.isNaN(v) ? null : v; };
const byDate = (dir) => (a, b) => {
  const ta = time(a); const tb = time(b);
  if (ta === tb) return 0;
  if (ta === null) return 1;
  if (tb === null) return -1;
  return dir * (ta - tb);
};
const SORTERS = {
  auto: (a, b) => (Number(!!a.p.finished) - Number(!!b.p.finished)) || byDate(a.p.finished ? -1 : 1)(a, b),
  deadline: byDate(1),
  recent: byDate(-1),
  progress: (a, b) => projectProgress(b.p).pct - projectProgress(a.p).pct,
  name: (a, b) => (a.p.name || '').localeCompare(b.p.name || '', 'ar'),
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'بدون تاريخ');
const whenText = (k) => (k === null ? 'بدون تاريخ' : k < 0 ? `متأخر ${n(-k)} يوم` : k === 0 ? 'اليوم' : k === 1 ? 'غدًا' : `بعد ${n(k)} يوم`);
const whenTone = (k) => (k === null ? 'bg-neutral-50 text-neutral-400 ring-neutral-200' : k < 0 ? 'bg-brand-50 text-brand-600 ring-brand-200' : k <= 3 ? 'bg-brand-50 text-brand-600 ring-brand-200' : 'bg-neutral-50 text-neutral-500 ring-neutral-200');
const kOrInf = (k) => (k === null ? 1e9 : k);

/* ================= عناصر صغيرة ================= */
const SearchIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);

function Count({ value }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(value); from.current = value; return undefined; }
    const start = from.current; const t0 = performance.now(); let id;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 600);
      setV(Math.round(start + (value - start) * (1 - (1 - k) ** 3)));
      if (k < 1) id = requestAnimationFrame(tick); else from.current = value;
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <>{n(v)}</>;
}

function Bar({ pct, className = '', fill = 'bg-gradient-to-l from-brand-300 to-brand-600' }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-neutral-100 ${className}`}>
      <div className={`h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none ${fill}`} style={{ width: `${on ? pct : 0}%` }} />
    </div>
  );
}

/* ================= صف المشروع ================= */
function ProjectRow({ item, i, lab }) {
  const { p, engineer, team } = item;
  const st = stateOf(p);
  const pr = projectProgress(p);
  const k = daysLeft(p.deliveryDate);
  const rounds = p.rounds || [];
  const rd = rounds.filter((r) => r.delivered).length;
  const next = rounds.filter((r) => !r.delivered).map((r) => ({ r, k: daysLeft(r.date) })).sort((a, b) => kOrInf(a.k) - kOrInf(b.k))[0];

  return (
    <article
      className={`card group/row relative grid gap-3 overflow-hidden p-4 ps-6 animate-rise transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-400 motion-reduce:transition-none md:items-center md:gap-5 ${GRID}`}
      style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
    >
      <span aria-hidden className="absolute inset-y-0 start-0 w-1.5" style={{ background: STATES[st].color }} />

      {/* المشروع + المهندس */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar engineer={engineer} size={40} />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-base font-extrabold">
            <Link to={`/engineers/${engineer.id}?p=${p.id}`} className="truncate after:absolute after:inset-0 focus:outline-none">{p.name || 'مشروع بدون اسم'}</Link>
            {p.note && <span title={p.note} className="relative z-10 shrink-0 text-brand-500"><NoteIcon className="h-4 w-4" /></span>}
          </h3>
          <p className="flex items-center gap-1.5 truncate text-xs text-neutral-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />{engineer.name} · {teamLabel(team)}
          </p>
        </div>
      </div>

      {/* الإنجاز */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-neutral-400">
          <span>{n(pr.done)} من {n(pr.total)} مهمة</span>
          <span className="tabular-nums text-brand-700">{n(pr.pct)}%</span>
        </div>
        <Bar pct={pr.pct} fill={p.finished ? 'bg-brand-600' : undefined} />
      </div>

      {/* الجولات */}
      <div className="min-w-0">
        {rounds.length === 0 ? (
          <p className="text-xs font-semibold text-neutral-300">لا توجد جولات</p>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              {rounds.slice(0, 8).map((r) => (
                <span key={r.id} title={`${r.title}${r.delivered ? ' · تم التسليم' : ''}`} className={`h-2.5 w-2.5 rounded-full ring-2 transition-colors duration-500 ${r.delivered ? 'bg-brand-600 ring-brand-100' : 'bg-white ring-neutral-300'}`} />
              ))}
              {rounds.length > 8 && <span className="text-xs font-bold text-neutral-400">+{n(rounds.length - 8)}</span>}
              <span className="ms-1 text-xs font-extrabold tabular-nums text-neutral-500">{n(rd)}/{n(rounds.length)}</span>
            </div>
            <p className="mt-1.5 truncate text-xs font-semibold text-neutral-400">
              {next ? <>التالية: {next.r.title}{next.r.date ? ` · ${fmtDate(next.r.date)}` : ''}</> : 'كل الجولات اتسلّمت'}
            </p>
          </>
        )}
      </div>

      {/* الحالة + الموعد */}
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${STATES[st].pill}`}>{lab(st)}</span>
        {p.finished
          ? <span className="text-xs font-semibold text-neutral-400">سُلّم {fmtDate(p.deliveryDate)}</span>
          : <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${whenTone(k)}`}>{whenText(k)}</span>}
        <ArrowIcon className="hidden h-4 w-4 shrink-0 text-neutral-300 transition duration-300 group-hover/row:-translate-x-1 group-hover/row:text-brand-600 md:block" />
      </div>
    </article>
  );
}

/* ================= الصفحة ================= */
export default function ProjectsPage() {
  const { teams, engineers, outcomeLabel } = useData();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [sort, setSort] = useState('auto');

  const rawStatus = sp.get('status');
  const status = ['running', 'late', 'delivered'].includes(rawStatus) ? rawStatus : 'all';
  const rawOutcome = sp.get('outcome');
  const outcome = status === 'delivered' && ['won', 'lost', 'pending'].includes(rawOutcome) ? rawOutcome : 'all';
  const setParams = (next) => {
    const params = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => (v && v !== 'all' ? params.set(k, v) : params.delete(k)));
    setSp(params, { replace: true });
  };

  const lab = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, STATES[k].label) : STATES[k].label);

  const main = useMemo(() => mainTeams(teams), [teams]);
  const all = useMemo(() => collectProjects(main, engineers), [main, engineers]);

  const term = q.trim().toLowerCase();
  const base = useMemo(
    () => all.filter(({ p, engineer, team }) => (teamId === 'all' || team.id === teamId)
      && (!term || [p.name, engineer.name, teamLabel(team), p.note].some((s) => (s || '').toLowerCase().includes(term)))),
    [all, teamId, term],
  );

  const counts = useMemo(() => {
    const c = { all: base.length, running: 0, late: 0, delivered: 0, won: 0, lost: 0, pending: 0 };
    base.forEach(({ p }) => {
      if (!p.finished) { c.running += 1; if (isLate(p)) c.late += 1; return; }
      c.delivered += 1; c[stateOf(p)] += 1;
    });
    return c;
  }, [base]);

  const list = useMemo(
    () => base.filter(({ p }) => matches(p, status, outcome)).sort(SORTERS[sort]),
    [base, status, outcome, sort],
  );

  /* ---------- الجولات: إجمالي + أقرب الجولات القادمة ---------- */
  const roundsInfo = useMemo(() => {
    let total = 0; let done = 0;
    const upcoming = [];
    base.forEach((item) => {
      (item.p.rounds || []).forEach((r) => {
        total += 1;
        if (r.delivered) done += 1;
        else if (!item.p.finished) upcoming.push({ item, r, k: daysLeft(r.date) });
      });
    });
    upcoming.sort((a, b) => kOrInf(a.k) - kOrInf(b.k));
    return { total, done, upcoming: upcoming.slice(0, 6), pendingCount: upcoming.length };
  }, [base]);

  const dirty = status !== 'all' || !!q || teamId !== 'all' || sort !== 'auto';
  const reset = () => { setQ(''); setTeamId('all'); setSort('auto'); setSp({}, { replace: true }); };
  const showOutcomes = status === 'delivered';

  const emptyText = status === 'running' ? 'مفيش مشاريع جارية'
    : status === 'late' ? 'مفيش مشاريع متأخرة'
      : outcome !== 'all' ? `مفيش مشاريع نتيجتها «${lab(outcome)}»`
        : status === 'delivered' ? 'لسه مفيش مشاريع اتسلّمت' : 'مفيش مشاريع مطابقة';

  const dist = ['running', 'pending', 'won', 'lost'].map((k) => ({ k, v: k === 'running' ? counts.running : counts[k] }));

  return (
    <>
      <PageHeader back title="المشاريع" subtitle={`${n(list.length)} من ${n(all.length)} مشروع`} />

      {/* ===== الفلتر الأساسي ===== */}
      <div role="tablist" aria-label="حالة المشروع" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TABS.map(([k, label, Icon, tone, color], i) => {
          const on = status === k;
          const share = k === 'all' || !counts.all ? 100 : (counts[k] / counts.all) * 100;
          return (
            <button
              key={k} type="button" role="tab" aria-selected={on} onClick={() => setParams({ status: k, outcome: 'all' })}
              className={`rounded-2xl bg-white p-4 text-start ring-1 animate-rise transition duration-300 motion-reduce:transition-none ${on ? '-translate-y-0.5 shadow-lift ring-2 ring-brand-500' : 'ring-neutral-200 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200'}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition duration-300 ${on ? 'scale-105 bg-brand-600 text-white' : tone}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-neutral-400">{label}</span>
                  <span className={`block text-3xl font-extrabold tabular-nums ${k === 'late' && counts.late > 0 ? 'text-brand-600' : ''}`}><Count value={counts[k]} /></span>
                </span>
              </span>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <span className="block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${share}%`, background: color }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== الفلتر الثانوي ===== */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${showOutcomes ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!showOutcomes} inert={!showOutcomes}>
        <div className="overflow-hidden">
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-50/70 p-2.5 ring-1 ring-brand-100">
            <span className="me-1 ps-1 text-sm font-bold text-brand-800">النتيجة</span>
            {OUTCOMES.map(([k, l]) => {
              const on = outcome === k;
              return (
                <button
                  key={k} type="button" aria-pressed={on} onClick={() => setParams({ outcome: k })}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition duration-300 motion-reduce:transition-none ${on ? 'bg-brand-600 text-white shadow-soft ring-brand-600' : 'bg-white text-neutral-500 ring-neutral-200 hover:bg-brand-50 hover:text-brand-800'}`}
                >
                  {k !== 'all' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATES[k].color }} />}
                  {k === 'all' ? l : lab(k)}
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-neutral-100 text-neutral-400'}`}>{n(k === 'all' ? counts.delivered : counts[k])}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== بحث + فريق + ترتيب ===== */}
      <div className="card mt-4 flex flex-wrap items-center gap-3 p-3.5">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">بحث في المشاريع</span>
          <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-300" />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المشروع أو المهندس أو الملحوظة"
            className="w-full rounded-xl bg-neutral-50 py-2.5 pe-4 ps-11 text-sm font-semibold outline-none ring-1 ring-neutral-200 transition placeholder:text-neutral-300 focus:bg-white focus:ring-2 focus:ring-brand-400"
          />
        </label>
        {[
          ['الفريق', teamId, setTeamId, [['all', 'كل الفرق'], ...main.filter((t) => t.engineers.length).map((t) => [t.id, teamLabel(t)])]],
          ['ترتيب', sort, setSort, SORTS],
        ].map(([label, value, set, opts]) => (
          <label key={label} className="flex items-center gap-2 text-sm font-bold text-neutral-400">
            {label}
            <select value={value} onChange={(e) => set(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-neutral-600 outline-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-400">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
        {dirty && <button type="button" onClick={reset} className="rounded-xl px-3 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50">مسح الفلاتر</button>}
      </div>

      {/* ===== القايمة + الجانب ===== */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <p className="mb-3 text-sm font-semibold text-neutral-400" aria-live="polite">
            عرض <b className="text-neutral-700"><Count value={list.length} /></b> من {n(base.length)} مشروع
          </p>

          {list.length > 0 && (
            <div className={`mb-2 hidden gap-5 px-4 ps-6 text-xs font-bold text-neutral-400 md:grid ${GRID}`}>
              <span>المشروع</span><span>الإنجاز</span><span>جولات التسليم</span><span className="text-end">الحالة والموعد</span>
            </div>
          )}

          {list.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-14 text-center animate-rise">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-50 text-neutral-300"><SearchIcon className="h-7 w-7" /></span>
              <p className="font-bold">{emptyText}</p>
              <p className="text-sm text-neutral-400">جرّبي تغيّري الفلتر أو كلمة البحث</p>
              {dirty && <button type="button" onClick={reset} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700">مسح الفلاتر</button>}
            </div>
          ) : (
            <div key={`${status}-${outcome}-${sort}-${teamId}`} className="space-y-3">
              {list.map((item, i) => <ProjectRow key={`${item.engineer.id}-${item.p.id ?? i}`} item={item} i={i} lab={lab} />)}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
          <Panel delay={100} title="أقرب جولات التسليم" subtitle={roundsInfo.total ? `${n(roundsInfo.done)} من ${n(roundsInfo.total)} جولة اتسلّمت` : 'الجولات اللي لسه ما اتسلّمتش'}
            action={<span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><LayersIcon className="h-5 w-5" /></span>}>
            {roundsInfo.total > 0 && <Bar pct={(roundsInfo.done / roundsInfo.total) * 100} className="mb-4" fill="bg-gradient-to-l from-brand-400 to-brand-600" />}
            {roundsInfo.upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm leading-relaxed text-neutral-400">
                {roundsInfo.total ? 'كل الجولات اتسلّمت 🎉' : 'لما تضيفي جولات تسليم من صفحة المهندس هتظهر هنا مرتبة بأقرب موعد.'}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {roundsInfo.upcoming.map(({ item, r, k }) => (
                  <li key={`${item.p.id}-${r.id}`}>
                    <Link to={`/engineers/${item.engineer.id}?p=${item.p.id}`} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3 transition duration-300 hover:border-brand-200 hover:bg-brand-50/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{r.title || 'جولة'}</p>
                        <p className="truncate text-xs text-neutral-400">{item.p.name || 'مشروع بدون اسم'} · {item.engineer.name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${whenTone(k)}`}>{r.date ? whenText(k) : 'بدون تاريخ'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {roundsInfo.pendingCount > roundsInfo.upcoming.length && (
              <p className="mt-3 text-center text-xs font-semibold text-neutral-400">و{n(roundsInfo.pendingCount - roundsInfo.upcoming.length)} جولة تانية</p>
            )}
          </Panel>

          <Panel delay={160} title="توزيع المشاريع" subtitle="حسب الحالة الحالية">
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-neutral-100">
              {dist.map(({ k, v }) => v > 0 && <div key={k} className="transition-[flex-grow] duration-700 motion-reduce:transition-none" style={{ flexGrow: v, flexBasis: 0, background: STATES[k].color }} />)}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {dist.map(({ k, v }) => (
                <li key={k} className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATES[k].color }} />{lab(k)}
                  <b className="ms-auto tabular-nums text-neutral-700">{n(v)}</b>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  );
}

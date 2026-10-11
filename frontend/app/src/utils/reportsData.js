import { daysLeft, inPeriod, projectProgress, stateOf } from './dashboardData';

/* =====================================================================
   طبقة بيانات صفحة التقارير.
   أي افتراض عن شكل الداتا مركّز هنا — لو اسم حقل عندك مختلف عدّليه
   في مكان واحد من غير ما تلمسي الصفحة.
   ===================================================================== */

/** فريق السعودية: غير موجود في الفرق الرئيسية */
export const isSaudiTeam = (t) => t?.type === 'saudi' || t?.region === 'saudi' || /سعود/.test(t?.name || '');
/** فريق الحصر */
export const isHasrTeam = (t) => t?.type === 'hasr';

/** تجميع أعداد المشاريع (كل الفترات) */
export function projectCounts(items) {
  const c = { total: items.length, running: 0, finished: 0, won: 0, lost: 0, pending: 0, late: 0 };
  items.forEach(({ p }) => {
    if (!p.finished) {
      c.running += 1;
      const k = daysLeft(p.deliveryDate);
      if (k !== null && k < 0) c.late += 1;
      return;
    }
    c.finished += 1;
    const s = stateOf(p);
    if (s === 'won') c.won += 1;
    else if (s === 'lost') c.lost += 1;
    else c.pending += 1;
  });
  c.decided = c.won + c.lost;
  c.winPct = c.decided ? Math.round((c.won / c.decided) * 100) : null;
  return c;
}

/** نسبة إنجاز المهام لمجموعة مشاريع (مجموع done / مجموع total) */
export function tasksOf(items) {
  let done = 0; let total = 0; let pctSum = 0;
  items.forEach(({ p }) => {
    const g = projectProgress(p) || {};
    if (typeof g.total === 'number') { done += g.done || 0; total += g.total; }
    pctSum += g.pct || 0;
  });
  const pct = total ? Math.round((done / total) * 100) : (items.length ? Math.round(pctSum / items.length) : 0);
  return { done, total, pct };
}

/** المشاريع الجارية مرتبة بالأقرب تسليمًا (المتأخر أولًا) */
export function upcomingDeadlines(all, limit = 6) {
  return all
    .filter(({ p }) => !p.finished && daysLeft(p.deliveryDate) !== null)
    .map((item) => ({ item, k: daysLeft(item.p.deliveryDate), pct: (projectProgress(item.p) || {}).pct || 0 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, limit);
}

const ts = (d) => { const x = new Date(d).getTime(); return Number.isNaN(x) ? 0 : x; };

/** آخر الحركات: تسليمات مشاريع + جولات اتسلّمت، الأحدث أولًا */
export function recentActivity(all, period, limit = 9) {
  const ev = [];
  all.forEach((item) => {
    const { p, engineer } = item;
    if (p.finished && p.deliveryDate && inPeriod(p.deliveryDate, period)) {
      ev.push({
        key: `p-${p.id}`, kind: 'delivery', state: stateOf(p), date: p.deliveryDate,
        title: p.name || 'مشروع بدون اسم', who: engineer.name, item,
      });
    }
    (p.rounds || []).forEach((r) => {
      if (r.delivered && r.date && inPeriod(r.date, period)) {
        ev.push({
          key: `r-${p.id}-${r.id}`, kind: 'round', state: 'round', date: r.date,
          title: r.title || 'جولة', who: engineer.name, project: p.name, item,
        });
      }
    });
  });
  return ev.sort((a, b) => ts(b.date) - ts(a.date)).slice(0, limit);
}

export const fmtDate = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '—' : x.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ---------------- قسم الحصر ---------------- */
export const HASR_STATES = {
  unset: { label: 'لم يُحدد بعد', color: '#94A3B8' },
  none: { label: 'لا يوجد عمل', color: '#FB7185' },
  working: { label: 'جاري العمل عليها', color: '#38BDF8' },
  done: { label: 'تم الحصر بالكامل', color: '#10B981' },
};

/** حالة مشروع الحصر — نفس منطق hasrSummary في dashboardData:
 *  hasWork == null → لم يُحدد | false → لا يوجد عمل | true + hasrDone → تم | true → جاري */
export function hasrState(p) {
  if (p.hasWork == null) return 'unset';
  if (p.hasWork === false) return 'none';
  return p.hasrDone ? 'done' : 'working';
}

/** مشاريع فريق الحصر من خريطة hasr في useData (hasr[teamId]) */
export function hasrProjectsOf(team, hasrMap) {
  const list = hasrMap?.[team?.id];
  return Array.isArray(list) ? list : [];
}

export function hasrCounts(list) {
  const c = { total: list.length, unset: 0, none: 0, working: 0, done: 0 };
  list.forEach((p) => { c[hasrState(p)] += 1; });
  return c;
}
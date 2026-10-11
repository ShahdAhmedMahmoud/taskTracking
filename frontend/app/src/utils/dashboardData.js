const DAY = 86400000;

export const n = (v) => Number(v || 0).toLocaleString("ar-EG");

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** عدد الأيام المتبقية. null لو مفيش تاريخ صالح */
export const daysLeft = (d) => {
  if (!d) return null;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return Math.round((startOfDay(t) - startOfDay(new Date())) / DAY);
};

/** كل مشاريع الفرق المعروضة: [{ p, engineer, team }] */
export function collectProjects(teams, engineers) {
  const out = [];
  teams.forEach((t) =>
    t.engineers.forEach((e) => {
      (engineers[e.id]?.projects || []).forEach((p) =>
        out.push({ p, engineer: e, team: t }),
      );
    }),
  );
  return out;
}

/** تقدم مشروع = المهام المنجزة ÷ المهام القابلة للتطبيق */
export function projectProgress(p) {
  const list = Object.values(p.tasks || {}).filter((t) => t && t.applicable);
  const done = list.filter((t) => t.status).length;
  return {
    done,
    total: list.length,
    pct: list.length ? Math.round((done / list.length) * 100) : 0,
  };
}

/* ================= تصنيف المشاريع ================= */
export const STATES = {
  running: {
    label: "جاري",
    color: "#414a9b",
    pill: "bg-brand-50 text-brand-600 ring-brand-200",
  },
  pending: {
    label: "معلق",
    color: "#6f7dd0",
    pill: "bg-brand-50 text-brand-600 ring-brand-200",
  },
  won: {
    label: "فوز",
    color: "#2a317a",
    pill: "bg-brand-50 text-brand-700 ring-brand-200",
  },
  lost: {
    label: "خسارة",
    color: "#3c3c3b",
    pill: "bg-brand-50 text-brand-600 ring-brand-200",
  },
};

/** جاري ← لسه مخلصش | بعد التسليم: فوز / خسارة / معلق (outcome فاضي) */
export const stateOf = (p) => {
  if (!p.finished) return "running";
  if (p.outcome === "won") return "won";
  if (p.outcome === "lost") return "lost";
  return "pending";
};

const withRates = (c) => {
  const decided = c.won + c.lost;
  return {
    ...c,
    delivered: c.pending + decided,
    decided,
    winPct: decided ? Math.round((c.won / decided) * 100) : 0,
  };
};

/** أعداد كل الحالات (كل الوقت) */
export function stateCounts(all) {
  const c = { running: 0, pending: 0, won: 0, lost: 0 };
  all.forEach(({ p }) => {
    c[stateOf(p)] += 1;
  });
  return { ...withRates(c), total: all.length };
}

/* ================= الفترات (أسبوع / شهر / الكل) ================= */
export function inPeriod(date, period) {
  if (period === "all") return true;
  const d = startOfDay(date);
  if (Number.isNaN(d.getTime())) return false;
  const today = startOfDay(new Date());
  const from = new Date(today);
  from.setDate(today.getDate() - (period === "week" ? 6 : 29));
  return d >= from && d <= today;
}

/** نتائج المشاريع المسلّمة داخل الفترة */
export function periodResults(all, period) {
  const c = { pending: 0, won: 0, lost: 0 };
  all.forEach(({ p }) => {
    if (p.finished && inPeriod(p.deliveryDate, period)) c[stateOf(p)] += 1;
  });
  return withRates(c);
}

const fmtShort = (d) =>
  d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

/** أعمدة الـ timeline: مشاريع مسلّمة مقسّمة بالنتيجة. من الأقدم للأحدث */
export function deliveriesTimeline(all, period) {
  const today = startOfDay(new Date());
  const buckets = [];
  const add = (label, title, from, to) =>
    buckets.push({
      label,
      title,
      from,
      to,
      won: 0,
      lost: 0,
      pending: 0,
      total: 0,
    });

  if (period === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      add(
        d.toLocaleDateString("ar-EG", { weekday: "short" }),
        d.toLocaleDateString("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        d,
        d,
      );
    }
  } else if (period === "month") {
    for (let i = 5; i >= 0; i -= 1) {
      const to = new Date(today);
      to.setDate(to.getDate() - i * 5);
      const from = new Date(to);
      from.setDate(from.getDate() - 4);
      add(fmtShort(to), `${fmtShort(from)} – ${fmtShort(to)}`, from, to);
    }
  } else {
    for (let i = 5; i >= 0; i -= 1) {
      const from = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const to = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      add(
        from.toLocaleDateString("ar-EG", { month: "short" }),
        from.toLocaleDateString("ar-EG", { month: "long", year: "numeric" }),
        from,
        to,
      );
    }
  }

  all.forEach(({ p }) => {
    if (!p.finished || !p.deliveryDate) return;
    const d = startOfDay(p.deliveryDate);
    const b = buckets.find((x) => d >= x.from && d <= x.to);
    if (b) {
      b[stateOf(p)] += 1;
      b.total += 1;
    }
  });
  return buckets;
}

/** تفاصيل فريق: الجاري + المسلّم في الفترة بنتيجة كل مشروع */
export function teamBreakdown(all, teamId, period) {
  const mine = all.filter((x) => x.team.id === teamId);
  const running = mine.filter(({ p }) => !p.finished).length;
  const delivered = mine
    .filter(({ p }) => p.finished && inPeriod(p.deliveryDate, period))
    .sort((a, b) => new Date(b.p.deliveryDate) - new Date(a.p.deliveryDate));
  const c = { pending: 0, won: 0, lost: 0 };
  delivered.forEach(({ p }) => {
    c[stateOf(p)] += 1;
  });
  return { ...withRates(c), running, delivered };
}

/** أكتر المهندسين مشاريع جارية + متوسط تقدمهم */
export function workloadByEngineer(all, limit = 5) {
  const map = new Map();
  all.forEach(({ p, engineer }) => {
    if (p.finished) return;
    const cur = map.get(engineer.id) || { engineer, count: 0, pctSum: 0 };
    cur.count += 1;
    cur.pctSum += projectProgress(p).pct;
    map.set(engineer.id, cur);
  });
  return [...map.values()]
    .map((x) => ({ ...x, avg: Math.round(x.pctSum / x.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** ملخص قسم الحصر: منتظر / جاري / تم */
export function hasrSummary(hasr) {
  let waiting = 0,
    working = 0,
    done = 0;
  Object.values(hasr).forEach((list) =>
    list.forEach((i) => {
      if (i.hasWork == null) waiting += 1;
      else if (i.hasWork === false) return;
      else if (i.hasrDone) done += 1;
      else working += 1;
    }),
  );
  return { waiting, working, done };
}

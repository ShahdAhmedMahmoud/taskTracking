/* =====================================================================
   أدوات صفحة الأرشيف — كل افتراض عن شكل الـ snapshot/summary هنا.
   snapshot = المشروع كامل وقت الأرشفة: { name, finished, outcome, deliveryDate,
   inquiryDate, note, tasks: { [taskId]: { applicable, status, dueDate, notes } },
   customTasks: [], rounds: [] }.  summary = ملخص خفيف من قايمة الأرشيف.
   ===================================================================== */

/** فك ترميز URL بأمان (اسم المؤرشف بيتبعت مشفّر في الهيدر: %D8%A7%D9%83… ). */
export const safeDecode = (s) => {
  const str = String(s ?? "");
  if (!/%[0-9A-Fa-f]{2}/.test(str)) return str;
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

/** ألوان الحالات مختلفة بوضوح (الجاري ≠ المعلق ≠ فوز ≠ خسارة) */
export const STATUS = {
  running: {
    label: "جاري",
    color: "#0EA5E9",
    pill: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    bar: "from-sky-300 to-sky-500",
    soft: "bg-sky-50",
  },
  pending: {
    label: "معلق",
    color: "#F59E0B",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    bar: "from-amber-300 to-amber-500",
    soft: "bg-amber-50",
  },
  won: {
    label: "فوز",
    color: "#10B981",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "from-emerald-300 to-emerald-500",
    soft: "bg-emerald-50",
  },
  lost: {
    label: "خسارة",
    color: "#F43F5E",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    bar: "from-rose-300 to-rose-500",
    soft: "bg-rose-50",
  },
  unknown: {
    label: "غير محدد",
    color: "#94A3B8",
    pill: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
    bar: "from-slate-300 to-slate-400",
    soft: "bg-slate-50",
  },
};
export const STATUS_ORDER = ["running", "pending", "won", "lost", "unknown"];

/** جاري ← لسه مخلصش | منتهي: فوز / خسارة / معلق (نفس منطق stateOf) */
export const statusOf = (row, extra) => {
  const s = row.snapshot || extra || row.summary;
  if (!s) return "unknown";
  if (!s.finished) return "running";
  return s.outcome === "won"
    ? "won"
    : s.outcome === "lost"
      ? "lost"
      : "pending";
};

/** نسبة الإنجاز = المهام المنجزة ÷ القابلة للتطبيق (نفس projectProgress) */
export function snapshotStats(snapshot) {
  const list = Object.values(snapshot?.tasks || {}).filter(
    (t) => t && t.applicable,
  );
  const done = list.filter((t) => t.status).length;
  return {
    done,
    total: list.length,
    pct: list.length ? Math.round((done / list.length) * 100) : 0,
  };
}

const valid = (d) => {
  const x = new Date(d);
  return d && !Number.isNaN(x.getTime()) ? x : null;
};
export const fmtDate = (d) => {
  const x = valid(d);
  return x
    ? x.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
};
export const fmtDateTime = (d) => {
  const x = valid(d);
  return x
    ? x.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })
    : "—";
};
export const monthKey = (d) => {
  const x = valid(d);
  return x ? `${x.getFullYear()}-${x.getMonth()}` : "none";
};

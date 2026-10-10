export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('ar-EG', opts) : '—';

export function daysLeft(dateStr) {
  if (!dateStr) return { text: 'بدون موعد', tone: 'slate' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0) return { text: `متأخر ${Math.abs(diff)} يوم`, tone: 'red', late: true };
  if (diff === 0) return { text: 'اليوم', tone: 'red' };
  if (diff <= 3) return { text: `باقي ${diff} يوم`, tone: 'amber' };
  return { text: `باقي ${diff} يوم`, tone: 'green' };
}

export function timeAgo(iso) {
  if (!iso) return 'لم يُحفظ بعد';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

export const toneChip = {
  red: 'bg-rose-50 text-rose-600 ring-rose-200',
  rose: 'bg-rose-50 text-rose-600 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};
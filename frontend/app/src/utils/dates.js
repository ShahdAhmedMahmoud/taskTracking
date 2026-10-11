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
  red: 'bg-brand-50 text-brand-600 ring-brand-200',
  rose: 'bg-brand-50 text-brand-600 ring-brand-200',
  amber: 'bg-brand-50 text-brand-600 ring-brand-200',
  green: 'bg-brand-50 text-brand-700 ring-brand-200',
  emerald: 'bg-brand-50 text-brand-700 ring-brand-200',
  slate: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-200',
};
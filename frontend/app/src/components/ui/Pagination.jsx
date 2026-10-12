import { n } from '../../utils/dashboardData';

export default function Pagination({ page, pageCount, onChange, itemCount, pageSize = 5 }) {
  if (pageCount <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, itemCount);
  return <nav aria-label="صفحات المشاريع" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white p-3">
    <span className="text-xs font-semibold text-neutral-500">عرض {n(first)}–{n(last)} من {n(itemCount)} مشروع</span>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="rounded-xl px-3 py-2 text-sm font-bold text-brand-700 ring-1 ring-neutral-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">السابق</button>
      <span aria-live="polite" className="min-w-16 text-center text-sm font-extrabold tabular-nums text-neutral-700">{n(page)} / {n(pageCount)}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} className="rounded-xl px-3 py-2 text-sm font-bold text-brand-700 ring-1 ring-neutral-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">التالي</button>
    </div>
  </nav>;
}

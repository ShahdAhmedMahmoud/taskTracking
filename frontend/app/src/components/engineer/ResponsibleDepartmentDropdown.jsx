import { useMemo, useState } from 'react';
import { parseDepts, serializeDepts } from '../../utils/departments';
import { useData } from '../../hooks/useData';

const DEFAULT_DEPARTMENTS = [
  'قسم الدراسات',
  'قسم الحصر',
  'قسم السعودية',
  'قسم المشتريات',
  'القسم الفني',
  'القسم المالي',
  'قسم العقود',
  'التخطيط',
  'الجودة',
  'السلامة والصحة المهنية',
];

export default function ResponsibleDepartmentDropdown({
  value,
  onChange,
  options = null,
  disabled = false,
  label,
}) {
  const { tasks, teams } = useData() || {};
  const [opened, setOpened] = useState(false);
  const selected = useMemo(() => parseDepts(value), [value]);

  const availableDepartments = useMemo(() => {
    const set = new Set(Array.isArray(options) && options.length ? options : DEFAULT_DEPARTMENTS);
    if (Array.isArray(tasks)) {
      tasks.forEach((t) => {
        const d = t.department || t.dept || t.responsibleDepartments;
        if (d) parseDepts(d).forEach((x) => set.add(x));
      });
    }
    if (Array.isArray(teams)) {
      teams.forEach((t) => {
        if (t.division === 'saudi') set.add('قسم السعودية');
        if (t.type === 'hasr') set.add('قسم الحصر');
      });
    }
    selected.forEach((x) => set.add(x));
    return [...set].filter(Boolean);
  }, [options, tasks, teams, selected]);

  const toggle = (dept) => {
    const next = selected.includes(dept)
      ? selected.filter((item) => item !== dept)
      : [...selected, dept];
    onChange(serializeDepts(next));
  };

  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={opened}
        onClick={() => setOpened((v) => !v)}
        className={`flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border bg-gradient-to-br from-white to-neutral-50 px-3 py-2 text-start shadow-sm transition duration-200 hover:border-brand-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 ${opened ? 'border-brand-300 ring-2 ring-brand-100' : 'border-neutral-200'}`}
      >
        <span title={selected.join('، ')} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          {selected.length ? (
            selected.map((item) => (
              <span key={item} className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 ring-1 ring-brand-100">
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm font-semibold text-neutral-400">اختاري القسم المسؤول</span>
          )}
        </span>
        <span className="shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-extrabold tabular-nums text-neutral-500">
          {selected.length || '—'}
        </span>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs text-brand-700 ring-1 ring-neutral-200 transition-transform duration-200 ${opened ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {opened && (
        <>
          <button
            type="button"
            aria-label="إغلاق قائمة الأقسام المسؤولة"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpened(false)}
          />
          <div className="absolute start-0 top-full z-40 mt-2 max-h-[min(75vh,24rem)] w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-lift animate-rise sm:p-3">
            <div className="space-y-1">
              {availableDepartments.map((dept) => {
                const isChecked = selected.includes(dept);
                return (
                  <label
                    key={dept}
                    title={dept}
                    className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(dept)}
                      className="h-4 w-4 shrink-0 rounded accent-[#2A317A]"
                    />
                    <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{dept}</span>
                  </label>
                );
              })}
              {!availableDepartments.length && (
                <p className="px-3 py-5 text-center text-sm text-neutral-400">لا توجد أقسام متاحة للاختيار.</p>
              )}
            </div>
          </div>
        </>
      )}

      {!!selected.length && (
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('')}
            className="text-[11px] font-bold text-neutral-400 transition hover:text-brand-700"
          >
            مسح الاختيارات
          </button>
        </div>
      )}
    </div>
  );
}

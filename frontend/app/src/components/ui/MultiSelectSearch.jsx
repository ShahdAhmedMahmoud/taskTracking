import { useEffect, useId, useMemo, useRef, useState } from 'react';

/** تطبيع عربي للبحث: يتجاهل التشكيل وأ/إ/آ وى/ي وة/ه وحالة الحروف */
const norm = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .trim();

const toOpt = (o) => (typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? String(o.value) });

/**
 * اختيار متعدد + بحث في نفس الحقل.
 *  - اكتبي للبحث، اضغطي على عنصر (أو Enter) لإضافته/إزالته.
 *  - allowCreate: لو اللي كتبتيه مش موجود تقدري تضيفيه كقيمة جديدة.
 *  - الكيبورد: ↑ ↓ للتنقل · Enter للاختيار · Backspace يشيل آخر اختيار · Esc يقفل.
 *
 * value: string[]   |   options: string[] أو [{ value, label }]
 */
export default function MultiSelectSearch({
  value = [],
  onChange,
  options = [],
  placeholder = 'ابحثي أو اختاري…',
  allowCreate = false,
  disabled = false,
  label,
  emptyText = 'لا توجد نتائج',
  className = '',
}) {
  const id = useId();
  const root = useRef(null);
  const input = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const opts = useMemo(() => options.map(toOpt), [options]);
  const labelOf = useMemo(() => new Map(opts.map((o) => [o.value, o.label])), [opts]);
  const selected = useMemo(() => new Set(value), [value]);

  const list = useMemo(() => {
    const term = norm(q);
    const base = opts.filter((o) => !term || norm(o.label).includes(term));
    const exact = opts.some((o) => norm(o.label) === term) || value.some((v) => norm(v) === term);
    if (allowCreate && term && !exact) base.push({ value: q.trim(), label: `إضافة «${q.trim()}»`, create: true });
    return base;
  }, [opts, q, allowCreate, value]);

  useEffect(() => { setActive(0); }, [q, open]);

  useEffect(() => {
    if (!open) return undefined;
    const off = (e) => { if (!root.current?.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);

  const toggle = (v) => {
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);
    setQ('');
    input.current?.focus();
  };

  const selectAllShown = () => {
    const add = list.filter((o) => !o.create).map((o) => o.value).filter((v) => !selected.has(v));
    if (add.length) onChange([...value, ...add]);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && list[active]) toggle(list[active].value); else setOpen(true); }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setQ(''); } // يقفل القايمة بس، مش المودال اللي حواليه
    else if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      {label && <label htmlFor={`${id}-in`} className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>}

      <div
        onClick={() => { if (!disabled) { setOpen(true); input.current?.focus(); } }}
        className={`flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 ring-1 transition ${open ? 'ring-2 ring-brand-400' : 'ring-slate-200 hover:ring-brand-200'} ${disabled ? 'opacity-60' : 'cursor-text'}`}
      >
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 py-1 pe-1 ps-2.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
            {labelOf.get(v) ?? v}
            {!disabled && (
              <button type="button" aria-label={`إزالة ${labelOf.get(v) ?? v}`} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="grid h-4 w-4 place-items-center rounded-md text-brand-500 transition hover:bg-brand-100 hover:text-brand-800">
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
              </button>
            )}
          </span>
        ))}
        <input
          id={`${id}-in`}
          ref={input}
          value={q}
          disabled={disabled}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={value.length ? '' : placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && list[active] ? `${id}-o${active}` : undefined}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-1 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300"
        />
        {value.length > 0 && !disabled && (
          <button type="button" aria-label="مسح الكل" onClick={(e) => { e.stopPropagation(); onChange([]); }} className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-slate-100 hover:text-rose-600">مسح</button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-slate-200 animate-rise">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-[11px] font-bold text-slate-400">
            <span>{value.length ? `${value.length} مختار` : `${opts.length} خيار`}</span>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={selectAllShown} className="rounded-md px-1.5 py-0.5 text-brand-600 transition hover:bg-brand-50">تحديد المعروض</button>
          </div>
          <ul id={`${id}-list`} role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto p-1.5">
            {list.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">{emptyText}</li>}
            {list.map((o, i) => {
              const on = selected.has(o.value);
              return (
                <li
                  key={`${o.value}-${o.create ? 'new' : ''}`}
                  id={`${id}-o${i}`}
                  role="option"
                  aria-selected={on}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => toggle(o.value)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${i === active ? 'bg-brand-50 text-brand-800' : 'text-slate-600'}`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
                    {on && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>}
                  </span>
                  <span className={`truncate ${o.create ? 'text-brand-600' : ''}`}>{o.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
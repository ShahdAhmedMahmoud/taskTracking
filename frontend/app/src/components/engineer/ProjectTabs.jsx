import { useMemo, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';
import Modal from '../ui/Modal';
import ProgressRing from '../ui/ProgressRing';
import { ArrowIcon, ChevronDownIcon, SearchIcon, CheckIcon } from '../ui/Icons';
import { PlusIcon } from './EngineerIcons';
import { STATES, stateOf, projectProgress, daysLeft, n } from '../../utils/dashboardData';
import { useData } from '../../hooks/useData';
const metaText = (p) => {
  const k = daysLeft(p.deliveryDate);
  return `${STATES[stateOf(p)].label}${!p.finished && k !== null && k >= 0 ? ` · بعد ${n(k)} يوم` : ''}`;
};

export default function ProjectTabs({ tabs, activeId, onSelect, onAdd, ownerFor, selfId }) {
  const { tasks }= useData();
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState('');
  const touch = useRef(null);

  const idx = tabs.findIndex((p) => p.id === activeId);
  const at = idx < 0 ? 0 : idx;
  const current = tabs[at] || null;
  const go = (d) => {
    const next = tabs[Math.min(Math.max(at + d, 0), tabs.length - 1)];
    if (next) onSelect(next.id);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? tabs.filter((p) => (p.name || '').toLowerCase().includes(term)) : tabs;
  }, [tabs, q]);

  const pr = current ? projectProgress(current, tasks) : null;
  const st = current ? stateOf(current) : null;

  return (
    <div className="mb-5">
      {/* ================= الموبايل: Project Switcher ================= */}
      <div className="md:hidden">
        <div className="rounded-3xl bg-white p-3 shadow-soft ring-1 ring-neutral-200">
          {current && (
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={() => go(-1)} disabled={at <= 0} aria-label="المشروع السابق"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-600 transition active:scale-90 enabled:hover:bg-brand-50 enabled:hover:text-brand-700 disabled:opacity-35"
              >
                <ArrowIcon className="h-5 w-5 rotate-180" />
              </button>

              <button
                type="button" onClick={() => setSheet(true)} aria-label="عرض كل المشاريع"
                onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touch.current === null) return;
                  const dx = e.changedTouches[0].clientX - touch.current;
                  touch.current = null;
                  if (dx > 50) go(1); else if (dx < -50) go(-1); // في الـ RTL السحب لليمين = التالي
                }}
                className="flex min-w-0 flex-1 touch-pan-y items-center gap-3 rounded-2xl px-1.5 py-1 text-start transition active:scale-[.98]"
              >
                <span key={current.id} className="flex min-w-0 flex-1 items-center gap-3 animate-rise">
                  <ProgressRing pct={pr.pct} size={52} stroke={6} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-neutral-900">{current.name || 'مشروع بدون اسم'}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATES[st].color }} />
                      <span className="truncate">{metaText(current)}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold text-brand-600">{n(pr.done)} من {n(pr.total)} مهمة</span>
                  </span>
                </span>
                <ChevronDownIcon className="h-5 w-5 shrink-0 text-neutral-400" />
              </button>

              <button
                type="button" onClick={() => go(1)} disabled={at >= tabs.length - 1} aria-label="المشروع التالي"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-600 transition active:scale-90 enabled:hover:bg-brand-50 enabled:hover:text-brand-700 disabled:opacity-35"
              >
                <ArrowIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {tabs.length > 1 && tabs.length <= 8 && (
            <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
              {tabs.map((p, i) => <span key={p.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === at ? 'w-6 bg-brand-600' : 'w-1.5 bg-neutral-200'}`} />)}
            </div>
          )}

          {onAdd && (
            <button
              type="button" onClick={onAdd}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 py-3 text-sm font-extrabold text-brand-700 transition hover:bg-brand-50 active:scale-[.98]"
            >
              <PlusIcon className="h-4 w-4" />إضافة مشروع
            </button>
          )}
        </div>
      </div>

      {/* ================= الشاشات الأكبر: شريط أفقي ================= */}
      <div className="-mx-1 hidden snap-x gap-3 overflow-x-auto px-1 pb-3 pt-1 md:flex" role="tablist" aria-label="المشاريع">
        {tabs.map((p, ti) => {
          const s = stateOf(p);
          const r = projectProgress(p, tasks);
          const on = p.id === activeId;
          const o = ownerFor ? ownerFor(p) : null;
          return (
            <button
              key={p.id} type="button" role="tab" aria-selected={on} onClick={() => onSelect(p.id)}
              style={{ animationDelay: `${Math.min(ti, 6) * 50}ms` }}
              className={`animate-rise min-w-[12.5rem] max-w-[17rem] shrink-0 snap-start rounded-2xl p-3.5 text-start ring-1 transition duration-300 motion-reduce:transition-none ${on ? '-translate-y-0.5 bg-brand-600 text-white shadow-lift ring-brand-600' : 'bg-white ring-neutral-200 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200'}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/60" style={{ background: STATES[s].color }} />
                <span className="truncate text-sm font-extrabold">{p.name || 'مشروع بدون اسم'}</span>
              </span>
              <span className={`mt-2.5 block h-1.5 overflow-hidden rounded-full ${on ? 'bg-white/25' : 'bg-neutral-100'}`}>
                <span className={`block h-full rounded-full transition-[width] duration-700 ${on ? 'bg-white' : 'bg-gradient-to-l from-brand-400 to-brand-600'}`} style={{ width: `${r.pct}%` }} />
              </span>
              <span className={`mt-1.5 block truncate text-xs font-semibold ${on ? 'text-white/80' : 'text-neutral-400'}`}>{n(r.done)} من {n(r.total)} مهمة · {n(r.pct)}%</span>
              {o && (
                <span className={`mt-1.5 flex items-center gap-1.5 truncate text-xs font-semibold ${on ? 'text-white/80' : 'text-neutral-400'}`}>
                  <Avatar engineer={o} size={16} />{o.id === selfId ? 'مشروعي' : o.name}
                </span>
              )}
            </button>
          );
        })}
        {onAdd && (
          <button type="button" onClick={onAdd} className="flex min-w-[10rem] shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 px-4 text-sm font-bold text-brand-700 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-50">
            <PlusIcon className="h-4 w-4" />إضافة مشروع
          </button>
        )}
      </div>

      {/* ================= قايمة المشاريع (Bottom sheet) ================= */}
      {sheet && (
        <Modal
          title={`المشاريع (${n(tabs.length)})`} onClose={() => { setSheet(false); setQ(''); }}
          footer={onAdd && (
            <button type="button" className="btn-primary w-full !py-3" onClick={() => { setSheet(false); onAdd(); }}>
              <PlusIcon className="h-4 w-4" />إضافة مشروع
            </button>
          )}
        >
          {tabs.length > 6 && (
            <div className="relative mb-3">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-neutral-400"><SearchIcon className="h-4 w-4" /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي عن مشروع..." className="input ps-9" />
            </div>
          )}
          <ul className="space-y-2.5">
            {filtered.length === 0 && <li className="py-8 text-center text-sm text-neutral-400">لا توجد نتائج</li>}
            {filtered.map((p) => {
              const r = projectProgress(p, tasks);
              const s = stateOf(p);
              const on = p.id === activeId;
              return (
                <li key={p.id}>
                  <button
                    type="button" onClick={() => { onSelect(p.id); setSheet(false); setQ(''); }}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 transition active:scale-[.98] ${on ? 'bg-brand-50 ring-brand-300' : 'bg-white ring-neutral-200 hover:ring-brand-200'}`}
                  >
                    <ProgressRing pct={r.pct} size={48} stroke={5} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{p.name || 'مشروع بدون اسم'}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATES[s].color }} />{metaText(p)}
                      </span>
                      {ownerFor && ownerFor(p) && <span className="mt-0.5 block truncate text-xs text-neutral-400">{ownerFor(p).id === selfId ? 'مشروعي' : ownerFor(p).name}</span>}
                    </span>
                    {on && <CheckIcon className="h-5 w-5 shrink-0 text-brand-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </div>
  );
}
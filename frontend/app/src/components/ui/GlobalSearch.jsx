import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { teamLabel } from '../../utils/helpers';
import { SearchIcon } from './Icons';

export default function GlobalSearch() {
  const { teams, engineers } = useData();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); }
      if (e.key === 'Escape') { setOpen(false); input.current?.blur(); }
    };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out = [];
    teams.forEach((t) => t.engineers.forEach((e) => {
      if ((e.name || '').toLowerCase().includes(term)) out.push({ key: `e${e.id}`, kind: 'مهندس', title: e.name, sub: teamLabel(t), to: `/engineers/${e.id}` });
      (engineers[e.id]?.projects || []).forEach((p) => {
        if ((p.name || '').toLowerCase().includes(term)) out.push({ key: `p${p.id}`, kind: 'مشروع', title: p.name, sub: e.name, to: `/engineers/${e.id}` });
      });
    }));
    return out.slice(0, 8);
  }, [q, teams, engineers]);

  const go = (to) => { nav(to); setQ(''); setOpen(false); input.current?.blur(); };

  return (
    <div ref={box} className="relative hidden w-72 md:block lg:w-96">
      <span className="pointer-events-none absolute inset-y-0 start-3.5 grid place-items-center text-neutral-400"><SearchIcon className="h-5 w-5" /></span>
      <input
        ref={input} value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0].to); }}
        placeholder="ابحثي عن مهندس أو مشروع..."
        className="input !rounded-2xl !bg-neutral-50 ps-11 pe-14"
      />
      <kbd className="pointer-events-none absolute inset-y-0 end-3 my-auto hidden h-6 items-center rounded-md border border-neutral-200 bg-white px-1.5 text-xs font-bold text-neutral-400 lg:flex">Ctrl K</kbd>

      {open && q.trim() && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-lift animate-rise">
          {results.length === 0 && <p className="px-4 py-6 text-center text-sm text-neutral-400">مفيش نتائج مطابقة</p>}
          {results.map((r) => (
            <button key={r.key} onClick={() => go(r.to)} className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-brand-50">
              <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-700">{r.kind}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{r.title}</span>
                <span className="block truncate text-xs text-neutral-400">{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
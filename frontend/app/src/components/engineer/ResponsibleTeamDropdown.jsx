import { useMemo, useState } from 'react';
import { parseDepts, serializeDepts } from '../../utils/departments';
import { useData } from '../../hooks/useData';
import { teamLabel } from '../../utils/helpers';

const SEP = ' › ';

/**
 * قسم الدراسات ← الفرق ← المهندسين (داتا حقيقية من useData().teams).
 * القيمة string بنفس صيغة ResponsibleDepartments:
 *   "فريق 1،فريق 2 › أحمد"  (parseDepts / serializeDepts)
 */
export default function ResponsibleTeamDropdown({
  parent = 'قسم الدراسات',
  value,
  onChange,
  disabled = false,
  teamFilter = null, // اختياري: (team) => boolean لو عايزة بعض الفرق بس
}) {
  const { teams } = useData() || {};
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [q, setQ] = useState('');

  const selected = useMemo(() => parseDepts(value), [value]);

  const list = useMemo(() => {
    const src = Array.isArray(teams) ? teams : [];
    return (teamFilter ? src.filter(teamFilter) : src).map((team) => ({
      id: team.id,
      name: teamLabel(team),
      engineers: Array.isArray(team.engineers) ? team.engineers : [],
    }));
  }, [teams, teamFilter]);

  const term = q.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!term) return list;
    return list
      .map((t) => {
        const teamHit = t.name.toLowerCase().includes(term);
        const engineers = teamHit ? t.engineers : t.engineers.filter((e) => String(e.name).toLowerCase().includes(term));
        return teamHit || engineers.length ? { ...t, engineers } : null;
      })
      .filter(Boolean);
  }, [list, term]);

  const commit = (next) => onChange(serializeDepts(next));
  const toggle = (path) =>
    commit(selected.includes(path) ? selected.filter((x) => x !== path) : [...selected, path]);

  const countOf = (teamName) =>
    selected.filter((x) => x === teamName || x.startsWith(teamName + SEP)).length;

  const toggleExpand = (id) =>
    setExpanded((p) => {
      const x = new Set(p);
      if (x.has(id)) x.delete(id);
      else x.add(id);
      return x;
    });

  const toggleAllEngineers = (t) => {
    const paths = t.engineers.map((e) => `${t.name}${SEP}${e.name}`);
    const allOn = paths.every((p) => selected.includes(p));
    commit(allOn ? selected.filter((x) => !paths.includes(x)) : [...new Set([...selected, ...paths])]);
  };

  return (
    <div className="min-w-0">
      {/* الزر + ملخص الاختيارات (بيعمل wrap مش scroll) */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={opened}
        onClick={() => setOpened((v) => !v)}
        className={`flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border bg-gradient-to-br from-white to-neutral-50 px-3 py-2 text-start shadow-sm transition duration-200 hover:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 ${opened ? 'border-brand-300 ring-2 ring-brand-100' : 'border-neutral-200'}`}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.length ? (
            selected.map((item) => (
              <span key={item} className="max-w-full break-words rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold leading-snug text-brand-800 ring-1 ring-brand-100">
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm font-semibold text-neutral-400">اختاري الفريق أو المهندس</span>
          )}
        </span>
        <span className="shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-extrabold tabular-nums text-neutral-500">
          {selected.length || '—'}
        </span>
        <span
          aria-hidden="true"
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs text-brand-700 ring-1 ring-neutral-200 transition-transform duration-200 ${opened ? 'rotate-180' : ''}`}
        >
          ⌄
        </span>
      </button>

      {/* القايمة جوه الصفحة (مش absolute) عشان متتقصش جوه المودال */}
      {opened && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm animate-rise">
          {/* الأب: قسم الدراسات */}
          <div className="flex items-center justify-between gap-2 bg-brand-50 px-3 py-2.5">
            <span className="min-w-0 break-words text-sm font-extrabold text-brand-900">{parent}</span>
            <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-brand-700 ring-1 ring-brand-100">
              {list.length} فريق
            </span>
          </div>

          {/* بحث */}
          <div className="border-b border-neutral-100 p-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحثي عن فريق أو مهندس…"
              className="h-10 w-full rounded-xl bg-white px-3 text-sm font-semibold text-neutral-700 outline-none ring-1 ring-neutral-200 placeholder:text-neutral-300 focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto p-2 sm:max-h-80 sm:p-3">
            {visible.map((t) => {
              const open = !!term || expanded.has(t.id);
              const teamOn = selected.includes(t.name);
              const cnt = countOf(t.name);
              const allOn = t.engineers.length > 0 && t.engineers.every((e) => selected.includes(`${t.name}${SEP}${e.name}`));

              return (
                <div key={t.id} className={`rounded-xl ring-1 transition ${cnt ? 'bg-brand-50/40 ring-brand-200' : 'bg-white ring-neutral-200'}`}>
                  {/* صف الفريق: بالضغط عليه بيفتح المهندسين */}
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggleExpand(t.id)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-start"
                  >
                    <span className="min-w-0 flex-1 break-words text-sm font-extrabold leading-snug text-neutral-800">{t.name}</span>
                    {cnt > 0 && (
                      <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-brand-700 ring-1 ring-brand-100">
                        {cnt}
                      </span>
                    )}
                    <span className="shrink-0 text-[11px] font-semibold text-neutral-400">{t.engineers.length} مهندس</span>
                    <span aria-hidden="true" className={`shrink-0 text-xs text-brand-700 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  {open && (
                    <div className="border-t border-brand-100 px-2 pb-2 pt-2">
                      {/* اختيار الفريق كله */}
                      <label className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold leading-snug transition hover:bg-white ${teamOn ? 'bg-white text-brand-800 ring-1 ring-brand-200' : 'text-neutral-700'}`}>
                        <input type="checkbox" checked={teamOn} onChange={() => toggle(t.name)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
                        <span className="min-w-0 flex-1 break-words">اختيار كل الفريق · {t.name}</span>
                      </label>

                      {t.engineers.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleAllEngineers(t)}
                            className="my-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-brand-700 transition hover:bg-white"
                          >
                            {allOn ? 'إلغاء تحديد كل المهندسين' : 'تحديد كل المهندسين'}
                          </button>
                          <ul className="grid gap-1 sm:grid-cols-2">
                            {t.engineers.map((eng) => {
                              const path = `${t.name}${SEP}${eng.name}`;
                              const on = selected.includes(path);
                              return (
                                <li key={eng.id ?? path}>
                                  <label className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold leading-snug transition hover:bg-white ${on ? 'bg-white text-brand-800 ring-1 ring-brand-200' : 'text-neutral-600'}`}>
                                    <input type="checkbox" checked={on} onChange={() => toggle(path)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
                                    <span className="min-w-0 flex-1 break-words">{eng.name}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <p className="px-2 py-2 text-xs text-neutral-400">لا يوجد مهندسون في هذا الفريق.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!visible.length && (
              <p className="px-3 py-6 text-center text-sm text-neutral-400">
                {list.length ? 'مفيش نتايج مطابقة.' : 'لا توجد فرق متاحة للاختيار.'}
              </p>
            )}
          </div>
        </div>
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
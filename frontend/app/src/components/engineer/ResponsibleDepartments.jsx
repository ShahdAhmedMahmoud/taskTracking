// import { useMemo, useState } from 'react';
// import { parseDepts, serializeDepts } from '../../utils/departments';
// import { useData } from '../../hooks/useData';
// import { teamLabel } from '../../utils/helpers';

// const departmentOf = (team) => team.type === 'hasr' ? 'قسم الحصر' : team.division === 'saudi' ? 'قسم السعودية' : 'الفرق الرئيسية';

// export default function ResponsibleDepartments({ value, onChange, disabled }) {
//   const { teams } = useData();
//   const [opened, setOpened] = useState(false);
//   const selected = useMemo(() => parseDepts(value), [value]);
//   const groups = useMemo(() => {
//     const byDepartment = new Map();
//     teams.forEach((team) => {
//       const department = departmentOf(team);
//       if (!byDepartment.has(department)) byDepartment.set(department, []);
//       byDepartment.get(department).push(team);
//     });
//     return [...byDepartment.entries()];
//   }, [teams]);
//   const toggle = (path) => {
//     const next = selected.includes(path) ? selected.filter((item) => item !== path) : [...selected, path];
//     onChange(serializeDepts(next));
//   };

//   return (
//     <div className="relative">
//       <button type="button" disabled={disabled} aria-expanded={opened} onClick={() => setOpened((v) => !v)}
//         className={`flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border bg-gradient-to-br from-white to-neutral-50 px-3 py-2 text-start shadow-sm transition duration-200 hover:border-brand-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 ${opened ? 'border-brand-300 ring-2 ring-brand-100' : 'border-neutral-200'}`}>
//         <span title={selected.join('، ')} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap">
//           {selected.length ? selected.map((item) => <span key={item} className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 ring-1 ring-brand-100">{item}</span>) : <span className="text-sm font-semibold text-neutral-400">اختاري القسم أو الفريق أو المهندس</span>}
//         </span>
//         <span className="shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-extrabold tabular-nums text-neutral-500">{selected.length || '—'}</span>
//         <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs text-brand-700 ring-1 ring-neutral-200 transition-transform duration-200 ${opened ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
//       </button>
//       {opened && <>
//         <button type="button" aria-label="إغلاق قائمة المسؤولين" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpened(false)} />
//         <div className="absolute start-0 top-full z-40 mt-2 max-h-[min(75vh,24rem)] w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-lift animate-rise sm:p-3">
//           {groups.map(([department, departmentTeams]) => (
//             <details key={department} className="group/department rounded-xl" open>
//               <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-extrabold text-brand-900 transition hover:bg-brand-100 [&::-webkit-details-marker]:hidden">
//                 {department}<span className="text-xs text-brand-500 transition-transform group-open/department:rotate-180">⌄</span>
//               </summary>
//               <div className="space-y-1 py-1">
//                 {departmentTeams.map((team) => {
//                   const teamName = teamLabel(team);
//                   const teamSelected = selected.includes(teamName);
//                   return <details key={team.id} className="group/team ms-2 rounded-lg">
//                     <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 [&::-webkit-details-marker]:hidden">
//                       <span className="grid h-4 w-4 place-items-center rounded border border-neutral-300 text-[10px] text-white transition group-open/team:border-brand-600 group-open/team:bg-brand-600">⌄</span>
//                       <span title={teamName} className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{teamName}</span>
//                     </summary>
//                     <div className="ms-7 border-s border-neutral-100 py-1 ps-2">
//                       <label title={teamName} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-700 hover:bg-brand-50">
//                         <input type="checkbox" checked={teamSelected} onChange={() => toggle(teamName)} className="h-4 w-4 shrink-0 accent-brand-700" />
//                         <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">اختيار كل الفريق · {teamName}</span>
//                       </label>
//                       {team.engineers.map((engineer) => {
//                         const path = `${teamName} › ${engineer.name}`;
//                         return <label key={engineer.id} title={engineer.name} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-600 hover:bg-brand-50">
//                           <input type="checkbox" checked={selected.includes(path)} onChange={() => toggle(path)} className="h-4 w-4 shrink-0 accent-brand-700" />
//                           <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{engineer.name}</span>
//                         </label>;
//                       })}
//                       {!team.engineers.length && <p className="px-2 py-1 text-xs text-neutral-400">لا يوجد مهندسون في هذا الفريق.</p>}
//                     </div>
//                   </details>;
//                 })}
//               </div>
//             </details>
//           ))}
//           {!groups.length && <p className="px-3 py-5 text-center text-sm text-neutral-400">لا توجد فرق متاحة للاختيار.</p>}
//         </div>
//       </>}
//       {!!selected.length && <div className="mt-1.5 flex justify-end"><button type="button" disabled={disabled} onClick={() => onChange('')} className="text-[11px] font-bold text-neutral-400 transition hover:text-brand-700">مسح الاختيارات</button></div>}
//     </div>
//   );
// }



import { useMemo, useState } from 'react';
import { parseDepts, serializeDepts } from '../../utils/departments';
import { useData } from '../../hooks/useData';
import { teamLabel } from '../../utils/helpers';

const departmentOf = (team) => team.type === 'hasr' ? 'قسم الحصر' : team.division === 'saudi' ? 'قسم السعودية' : 'الفرق الرئيسية';

/**
 * inline=false (الافتراضي): نفس الشكل القديم بالظبط (قايمة منسدلة absolute).
 * inline=true: القايمة بتتفتح جوه الصفحة تحت الزرار، والأسماء بتعمل wrap
 *              — مناسب للمودال والموبايل عشان مفيش حاجة تتقص أو تركب على بعض.
 */
export default function ResponsibleDepartments({ value, onChange, disabled, inline = false }) {
  const { teams } = useData();
  const [opened, setOpened] = useState(false);
  const selected = useMemo(() => parseDepts(value), [value]);
  const groups = useMemo(() => {
    const byDepartment = new Map();
    teams.forEach((team) => {
      const department = departmentOf(team);
      if (!byDepartment.has(department)) byDepartment.set(department, []);
      byDepartment.get(department).push(team);
    });
    return [...byDepartment.entries()];
  }, [teams]);
  const toggle = (path) => {
    const next = selected.includes(path) ? selected.filter((item) => item !== path) : [...selected, path];
    onChange(serializeDepts(next));
  };

  const textCls = inline ? 'break-words leading-snug' : 'overflow-x-auto whitespace-nowrap';

  return (
    <div className={inline ? 'min-w-0' : 'relative'}>
      <button type="button" disabled={disabled} aria-expanded={opened} onClick={() => setOpened((v) => !v)}
        className={`flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl border bg-gradient-to-br from-white to-neutral-50 px-3 py-2 text-start shadow-sm transition duration-200 hover:border-brand-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60 ${opened ? 'border-brand-300 ring-2 ring-brand-100' : 'border-neutral-200'}`}>
        <span title={selected.join('، ')} className={`flex min-w-0 flex-1 items-center gap-1.5 ${inline ? 'flex-wrap' : 'overflow-x-auto whitespace-nowrap'}`}>
          {selected.length
            ? selected.map((item) => <span key={item} className={`rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800 ring-1 ring-brand-100 ${inline ? 'max-w-full break-words leading-snug' : 'shrink-0'}`}>{item}</span>)
            : <span className="text-sm font-semibold text-neutral-400">اختاري القسم أو الفريق أو المهندس</span>}
        </span>
        <span className="shrink-0 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-extrabold tabular-nums text-neutral-500">{selected.length || '—'}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs text-brand-700 ring-1 ring-neutral-200 transition-transform duration-200 ${opened ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
      </button>
      {opened && <>
        {!inline && <button type="button" aria-label="إغلاق قائمة المسؤولين" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpened(false)} />}
        <div className={inline
          ? 'mt-2 max-h-72 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm animate-rise sm:max-h-80 sm:p-3'
          : 'absolute start-0 top-full z-40 mt-2 max-h-[min(75vh,24rem)] w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-lift animate-rise sm:p-3'}>
          {groups.map(([department, departmentTeams]) => (
            <details key={department} className="group/department rounded-xl" open>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-extrabold text-brand-900 transition hover:bg-brand-100 [&::-webkit-details-marker]:hidden">
                {department}<span className="text-xs text-brand-500 transition-transform group-open/department:rotate-180">⌄</span>
              </summary>
              <div className="space-y-1 py-1">
                {departmentTeams.map((team) => {
                  const teamName = teamLabel(team);
                  const teamSelected = selected.includes(teamName);
                  return <details key={team.id} className="group/team ms-2 rounded-lg">
                    <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 [&::-webkit-details-marker]:hidden">
                      <span className="grid h-4 w-4 place-items-center rounded border border-neutral-300 text-[10px] text-white transition group-open/team:border-brand-600 group-open/team:bg-brand-600">⌄</span>
                      <span title={teamName} className={`min-w-0 flex-1 ${textCls}`}>{teamName}</span>
                    </summary>
                    <div className="ms-7 border-s border-neutral-100 py-1 ps-2">
                      <label title={teamName} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-700 hover:bg-brand-50">
                        <input type="checkbox" checked={teamSelected} onChange={() => toggle(teamName)} className="h-4 w-4 shrink-0 accent-brand-700" />
                        <span className={`min-w-0 flex-1 ${textCls}`}>اختيار كل الفريق · {teamName}</span>
                      </label>
                      {team.engineers.map((engineer) => {
                        const path = `${teamName} › ${engineer.name}`;
                        return <label key={engineer.id} title={engineer.name} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-neutral-600 hover:bg-brand-50">
                          <input type="checkbox" checked={selected.includes(path)} onChange={() => toggle(path)} className="h-4 w-4 shrink-0 accent-brand-700" />
                          <span className={`min-w-0 flex-1 ${textCls}`}>{engineer.name}</span>
                        </label>;
                      })}
                      {!team.engineers.length && <p className="px-2 py-1 text-xs text-neutral-400">لا يوجد مهندسون في هذا الفريق.</p>}
                    </div>
                  </details>;
                })}
              </div>
            </details>
          ))}
          {!groups.length && <p className="px-3 py-5 text-center text-sm text-neutral-400">لا توجد فرق متاحة للاختيار.</p>}
        </div>
      </>}
      {!!selected.length && <div className="mt-1.5 flex justify-end"><button type="button" disabled={disabled} onClick={() => onChange('')} className="text-[11px] font-bold text-neutral-400 transition hover:text-brand-700">مسح الاختيارات</button></div>}
    </div>
  );
}
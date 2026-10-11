import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icons';
import { templatesService } from '../../services/templatesService';
import { normalizeAr } from '../../utils/departments';

const blankState = () => ({ status: false, review: false, applicable: false, dueDate: '', department: '', notes: '' });

/**
 * كارت "قائمة المهام":
 *   الضغط على الكارت -> قايمة القوالب (مجمعة حسب القسم) -> اختيار قالب -> اختيار المهام اللي هتتطبق على المشروع -> تطبيق.
 *   بعد التطبيق بتظهر المهام المختارة بس، وتقدري تعدّلي الاختيار في أي وقت.
 *
 * Props:
 *   project    المشروع الحالي
 *   tasks      المهام القياسية (من useData)
 *   edit       (fn(project)) => void   نفس edit بتاع EngineerPage
 *   renderTask (task, state) => ReactNode  اعرضي بيها TaskItem الحالي لكل مهمة مختارة
 *   renderCustom () => ReactNode (اختياري)  المهام المخصصة + زر إضافة مهمة
 */
export default function TaskTemplatesPanel({ project, tasks, edit, renderTask, renderCustom }) {
  const [view, setView] = useState('list'); // list | templates | pick
  const [templates, setTemplates] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [tpl, setTpl] = useState(null);          // القالب المفتوح (بعناصره)
  const [sel, setSel] = useState(new Set());     // المهام المختارة وقت الاختيار
  const [q, setQ] = useState('');
  const [tplQ, setTplQ] = useState('');
  const [dept, setDept] = useState('all');
  const [busy, setBusy] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);

  const currentTplId = project.templateId || templatesService.localTemplateId(project.id) || 'temp1';
  const stateOf = (id) => project.tasks?.[id] || blankState();
  const selectedIds = useMemo(() => tasks.filter((t) => stateOf(t.id).applicable).map((t) => t.id), [tasks, project.tasks]); // eslint-disable-line
  const selectedTasks = tasks.filter((t) => selectedIds.includes(t.id));
  const excludedTasks = tasks.filter((t) => !selectedIds.includes(t.id));
  const doneCount = selectedTasks.filter((t) => stateOf(t.id).status).length;
  const pct = selectedTasks.length ? Math.round((doneCount / selectedTasks.length) * 100) : 0;
  const currentTpl = templates?.find((t) => t.id === currentTplId);

  useEffect(() => {
    let on = true;
    templatesService.list({ tasks }).then((l) => on && setTemplates(l)).catch((e) => on && setLoadError(e.message));
    return () => { on = false; };
  }, [tasks]);

  /* ---------- الخطوات ---------- */
  const openTemplates = () => { setView('templates'); setTplQ(''); setDept('all'); };

  const openPick = async (summary) => {
    setBusy(true);
    try {
      const full = await templatesService.get(summary.id, { tasks });
      const inTemplate = new Set(full.items.map((i) => i.taskId));
      const sameAsCurrent = summary.id === currentTplId && selectedIds.length > 0;
      setTpl(full);
      // لو نفس القالب الحالي نبدأ من اختيارك، وإلا من الاختيار الافتراضي للقالب
      setSel(new Set(sameAsCurrent ? selectedIds.filter((id) => inTemplate.has(id)) : full.items.filter((i) => i.defaultApplicable).map((i) => i.taskId)));
      setQ('');
      setView('pick');
    } catch (e) { setLoadError(e.message); }
    finally { setBusy(false); }
  };

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const inTpl = useMemo(() => new Set((tpl?.items || []).map((i) => i.taskId)), [tpl]);
  const tplTasks = useMemo(() => tasks.filter((t) => inTpl.has(t.id)), [tasks, inTpl]);
  const visible = tplTasks.filter((t) => !q || normalizeAr(`${t.title} ${t.desc || ''}`).includes(normalizeAr(q)));
  const droppedDone = tplTasks.filter((t) => !sel.has(t.id) && stateOf(t.id).status).length;

  const apply = () => {
    edit((p) => {
      p.tasks ??= {};
      tasks.forEach((t) => {
        p.tasks[t.id] ??= blankState();
        p.tasks[t.id].applicable = sel.has(t.id); // المهمة المنجزة بتحتفظ بحالتها حتى لو استبعدتيها
      });
      p.templateId = tpl.id;
    });
    templatesService.setLocalTemplateId(project.id, tpl.id);
    setView('list');
  };

  const quickToggle = (id, value) => edit((p) => { p.tasks[id] ??= blankState(); p.tasks[id].applicable = value; });

  /* ---------- الكارت الرئيسي ---------- */
  const card = (
    <button
      type="button"
      onClick={view === 'list' ? openTemplates : () => setView('list')}
      aria-expanded={view !== 'list'}
      className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-start ring-1 ring-neutral-200 transition hover:ring-brand-300 hover:shadow-soft sm:p-5"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-soft transition group-hover:scale-105"><Icon name="layers" className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold text-brand-900">قائمة المهام</span>
        <span className="mt-0.5 block truncate text-sm text-neutral-500">
          {currentTpl ? `${currentTpl.code} · ${currentTpl.department?.name}` : 'اختاري القالب المناسب لقسمك'} — {selectedTasks.length} مهمة مختارة من {tasks.length}
        </span>
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <span className="block h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </span>
      </span>
      <span className="hidden shrink-0 rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 sm:inline-flex">
        {view === 'list' ? 'تغيير القالب / تعديل الاختيار' : 'إغلاق'}
      </span>
    </button>
  );

  /* ---------- الخطوة 1: القوالب ---------- */
  const departments = [...new Map((templates || []).map((t) => [t.department?.id, t.department])).values()].filter(Boolean);
  const shownTemplates = (templates || []).filter((t) => (dept === 'all' || t.department?.id === dept) && (!tplQ || normalizeAr(`${t.name} ${t.code} ${t.description || ''}`).includes(normalizeAr(tplQ))));

  const templatesView = (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-extrabold text-brand-900">اختاري قالب المهام</h3>
        <div className="relative ms-auto w-full sm:w-64">
          <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={tplQ} onChange={(e) => setTplQ(e.target.value)} placeholder="ابحثي عن قالب…" className="w-full rounded-xl bg-neutral-50 py-2 pe-3 ps-9 text-sm outline-none ring-1 ring-neutral-200 transition focus:bg-white focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {departments.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="أقسام الشركة">
          {[{ id: 'all', name: 'كل الأقسام' }, ...departments].map((d) => (
            <button key={d.id} type="button" role="tab" aria-selected={dept === d.id} onClick={() => setDept(d.id)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${dept === d.id ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{d.name}</button>
          ))}
        </div>
      )}

      {!templates && !loadError && <p className="py-8 text-center text-sm text-neutral-400">جاري تحميل القوالب…</p>}
      {loadError && <p className="rounded-xl bg-neutral-50 p-4 text-center text-sm text-neutral-600 ring-1 ring-neutral-200">تعذر تحميل القوالب: {loadError}</p>}
      {templates && !shownTemplates.length && <p className="py-8 text-center text-sm text-neutral-400">لا توجد قوالب مطابقة.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shownTemplates.map((t) => {
          const on = t.id === currentTplId;
          return (
            <button key={t.id} type="button" disabled={busy} onClick={() => openPick(t)} className={`relative flex flex-col gap-2 rounded-2xl p-4 text-start ring-1 transition hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60 ${on ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-neutral-200 hover:ring-brand-300'}`}>
              <span className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-600 px-2 py-0.5 text-xs font-extrabold text-white">{t.code}</span>
                <span className="text-xs font-semibold text-neutral-500">{t.department?.name}</span>
                {on && <span className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-brand-700"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />الحالي</span>}
              </span>
              <span className="text-sm font-extrabold text-neutral-900">{t.name}</span>
              {t.description && <span className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{t.description}</span>}
              <span className="mt-auto pt-1 text-xs font-bold text-brand-700">{t.taskCount} مهمة قياسية · اضغطي للاختيار</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ---------- الخطوة 2: اختيار المهام ---------- */
  const pickView = tpl && (
    <div className="rounded-2xl bg-white ring-1 ring-neutral-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 p-4 sm:p-5">
        <button type="button" onClick={() => setView('templates')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-50"><Icon name="back" className="h-4 w-4" />القوالب</button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-brand-900">{tpl.code} — {tpl.name}</p>
          <p className="text-xs text-neutral-500">حددي المهام اللي هتتطبق على «{project.name || 'هذا المشروع'}»</p>
        </div>
        <span className="ms-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold tabular-nums text-brand-800 ring-1 ring-brand-100">{sel.size} / {tplTasks.length}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3 sm:px-5">
        <div className="relative w-full sm:w-64">
          <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي في المهام…" className="w-full rounded-xl bg-neutral-50 py-2 pe-3 ps-9 text-sm outline-none ring-1 ring-neutral-200 transition focus:bg-white focus:ring-2 focus:ring-brand-500" />
        </div>
        <button type="button" onClick={() => setSel(new Set(tplTasks.map((t) => t.id)))} className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">تحديد الكل</button>
        <button type="button" onClick={() => setSel(new Set())} className="rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-50">إلغاء الكل</button>
        <button type="button" onClick={() => setSel(new Set(tpl.items.filter((i) => i.defaultApplicable).map((i) => i.taskId)))} className="rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-50">الاختيار الافتراضي للقالب</button>
      </div>

      <ul className="max-h-[56vh] divide-y divide-neutral-100 overflow-y-auto">
        {visible.map((t) => {
          const on = sel.has(t.id);
          const done = stateOf(t.id).status;
          return (
            <li key={t.id}>
              <label className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors sm:px-5 ${on ? 'bg-brand-50/50' : 'hover:bg-neutral-50'}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(t.id)} className="peer sr-only" />
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 bg-white'}`}>{on && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
                <span className="w-7 shrink-0 pt-0.5 text-xs font-extrabold tabular-nums text-neutral-400">{String(t.id).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-bold ${on ? 'text-neutral-900' : 'text-neutral-500'}`}>{t.title}{done && <span className="ms-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-extrabold text-brand-700">منجزة</span>}</span>
                  {t.desc && <span className="mt-0.5 line-clamp-1 block text-xs text-neutral-400">{t.desc}</span>}
                </span>
              </label>
            </li>
          );
        })}
        {!visible.length && <li className="py-10 text-center text-sm text-neutral-400">لا توجد مهام مطابقة للبحث.</li>}
      </ul>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-neutral-100 bg-white/95 p-4 backdrop-blur sm:px-5">
        {droppedDone > 0 && <p className="text-xs font-semibold text-neutral-600">{droppedDone} مهمة منجزة هتتشال من الحسبة (حالتها بتتحفظ).</p>}
        <div className="ms-auto flex gap-2">
          <button type="button" onClick={() => setView('list')} className="rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-50">إلغاء</button>
          <button type="button" onClick={apply} disabled={!sel.size} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50">تطبيق على المشروع ({sel.size})</button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="space-y-4" aria-label="قائمة المهام">
      {card}
      {view === 'templates' && templatesView}
      {view === 'pick' && pickView}

      {view === 'list' && (
        <>
          <div className="space-y-3">
            {selectedTasks.map((t) => <div key={t.id}>{renderTask(t, stateOf(t.id))}</div>)}
            {!selectedTasks.length && (
              <div className="rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center">
                <p className="text-sm font-bold text-brand-900">لسه ما اخترتيش مهام لهذا المشروع</p>
                <button type="button" onClick={openTemplates} className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-brand-700">اختاري القالب والمهام</button>
              </div>
            )}
          </div>

          {renderCustom?.()}

          {excludedTasks.length > 0 && (
            <div className="rounded-2xl bg-neutral-50 ring-1 ring-neutral-200">
              <button type="button" onClick={() => setShowExcluded((s) => !s)} aria-expanded={showExcluded} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-neutral-600">
                <Icon name="chevron" className={`h-4 w-4 transition-transform duration-200 ${showExcluded ? 'rotate-180' : ''}`} />
                مهام غير مختارة لهذا المشروع ({excludedTasks.length})
              </button>
              {showExcluded && (
                <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
                  {excludedTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-500">
                      <span className="w-7 text-xs font-extrabold tabular-nums text-neutral-400">{String(t.id).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <button type="button" onClick={() => quickToggle(t.id, true)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"><Icon name="plus" className="h-3.5 w-3.5" />إضافة للمشروع</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
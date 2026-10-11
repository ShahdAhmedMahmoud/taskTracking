import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../hooks/useData';
import { useUI } from '../../hooks/useUI';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import MultiSelectSearch from '../ui/MultiSelectSearch';
import { n } from '../../utils/dashboardData';
import {
  taskId, taskName, taskDepts, resolveIds, collectDepartments, newTemplateId,
  sameSet, cleanResp, normAr, DEFAULT_TEMPLATE,
} from '../../utils/taskTemplates';

const CURRENT = '__current';

const Chip = ({ children, tone = 'brand' }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tone === 'brand' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'bg-slate-100 text-slate-500'}`}>{children}</span>
);

const Check = ({ on }) => (
  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white ring-slate-300'}`}>
    {on && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>}
  </span>
);

/**
 * نافذة اختيار قالب المهام:
 *  1) قايمة القوالب (مفلترة بالقسم) → 2) المهام القياسية بـ checkbox مع بحث + فلتر القسم المسؤول
 *  → "تطبيق على المشروع" بيرجّع { ids, resp, templateId, templateName } لـ onApply.
 */
export default function TaskTemplatePicker({ project, onApply, onClose, canManage }) {
  const { tasks } = useData();
  const { confirm } = useUI();
  const { templates, loading, persisted, saveTemplate, deleteTemplate } = useTaskTemplates();

  const [step, setStep] = useState('templates');
  const [active, setActive] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [resp, setResp] = useState({});
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState([]);
  const [tplFilter, setTplFilter] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saveAs, setSaveAs] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const allDepts = useMemo(
    () => collectDepartments(tasks, templates, Object.values(resp).flat()),
    [tasks, templates, resp],
  );

  const currentIds = useMemo(
    () => tasks.filter((t) => project.tasks?.[taskId(t)]?.applicable).map(taskId),
    [tasks, project],
  );
  const currentResp = useMemo(() => {
    const out = {};
    tasks.forEach((t) => { const r = project.tasks?.[taskId(t)]?.responsible; if (Array.isArray(r)) out[taskId(t)] = r; });
    return out;
  }, [tasks, project]);

  const open = (tpl) => {
    setActive(tpl);
    setSel(new Set(resolveIds(tpl, tasks)));
    setResp({ ...(tpl.responsible || {}) });
    setQ(''); setDeptFilter([]); setEditing(null); setSaveAs(null);
    setStep('tasks');
  };
  const openCurrent = () => open({ id: CURRENT, name: 'المهام الحالية للمشروع', departments: [], taskIds: currentIds, responsible: currentResp });

  const visibleTpls = templates.filter((tpl) => !tplFilter.length || (tpl.departments || []).some((d) => tplFilter.includes(d)));

  const term = normAr(q);
  const visible = tasks.filter((t) => {
    const depts = taskDepts(t, resp[taskId(t)]);
    const okText = !term || normAr(taskName(t)).includes(term) || depts.some((d) => normAr(d).includes(term));
    const okDept = !deptFilter.length || depts.some((d) => deptFilter.includes(d));
    return okText && okDept;
  });

  const toggle = (id) => setSel((prev) => { const nx = new Set(prev); if (nx.has(id)) nx.delete(id); else nx.add(id); return nx; });
  const setShown = (on) => setSel((prev) => {
    const nx = new Set(prev);
    visible.forEach((t) => (on ? nx.add(taskId(t)) : nx.delete(taskId(t))));
    return nx;
  });
  const resetToTemplate = () => { if (active) { setSel(new Set(resolveIds(active, tasks))); setResp({ ...(active.responsible || {}) }); } };

  const isTemplate = active && active.id !== CURRENT;
  const changed = isTemplate && (
    !sameSet(sel, new Set(resolveIds(active, tasks)))
    || JSON.stringify(cleanResp(resp)) !== JSON.stringify(cleanResp(active.responsible || {}))
  );

  const apply = () => {
    onApply({
      ids: sel,
      resp: cleanResp(resp),
      templateId: isTemplate ? active.id : project.templateId,
      templateName: isTemplate ? active.name : project.templateName,
    });
    onClose();
  };

  const updateTemplate = async () => {
    setBusy(true);
    const next = { ...active, taskIds: [...sel], responsible: cleanResp(resp) };
    const ok = await saveTemplate(next);
    setBusy(false);
    if (ok) setActive(next);
  };

  const createTemplate = async () => {
    const name = (saveAs.name || '').trim();
    if (!name) return;
    setBusy(true);
    const tpl = { id: newTemplateId(), name, departments: saveAs.departments, taskIds: [...sel], responsible: cleanResp(resp) };
    const ok = await saveTemplate(tpl);
    setBusy(false);
    if (ok) { setActive(tpl); setSaveAs(null); }
  };

  const removeTemplate = async (tpl) => {
    const ok = await confirm({ title: '🗑️ حذف القالب', message: `هيتحذف القالب «${tpl.name}». المشاريع اللي اتطبّق عليها مش هتتأثر.`, confirmText: 'حذف القالب' });
    if (ok) await deleteTemplate(tpl.id);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="قائمة المهام" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift animate-rise sm:rounded-3xl">
        {/* ===== Header ===== */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          {step === 'tasks' && (
            <button type="button" onClick={() => setStep('templates')} aria-label="رجوع للقوالب" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-extrabold text-slate-800">{step === 'templates' ? 'قائمة المهام — اختاري القالب' : active?.name}</h2>
            <p className="text-xs font-semibold text-slate-400">
              {step === 'templates' ? 'القوالب مقسّمة حسب القسم' : `${n(sel.size)} من ${n(tasks.length)} مهمة مختارة للمشروع`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 'templates' && (
            <>
              {!persisted && (
                <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700 ring-1 ring-amber-200">
                  حفظ القوالب لسه مش مفعّل (الـ endpoint <span dir="ltr">/api/templates</span> مش موجود). تقدري تستخدمي القالب الأساسي وتطبّقيه على المشروع، لكن القوالب الجديدة مش هتتحفظ.
                </p>
              )}
              <MultiSelectSearch label="القسم" value={tplFilter} onChange={setTplFilter} options={allDepts} placeholder="فلترة القوالب بالقسم…" />

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                <li>
                  <button type="button" onClick={openCurrent} className="h-full w-full rounded-2xl border-2 border-dashed border-brand-200 p-4 text-start transition hover:-translate-y-0.5 hover:bg-brand-50/50">
                    <p className="text-sm font-extrabold text-brand-700">تعديل المهام الحالية</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{n(currentIds.length)} مهمة مفعّلة في المشروع دلوقتي</p>
                  </button>
                </li>
                {loading && <li className="grid place-items-center rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-400">جاري تحميل القوالب…</li>}
                {visibleTpls.map((tpl) => {
                  const count = resolveIds(tpl, tasks).length;
                  const applied = project.templateId === tpl.id;
                  return (
                    <li key={tpl.id} className="relative">
                      <button type="button" onClick={() => open(tpl)} className={`h-full w-full rounded-2xl p-4 text-start ring-1 transition hover:-translate-y-0.5 hover:shadow-soft ${applied ? 'bg-brand-50/60 ring-brand-300' : 'bg-white ring-slate-200 hover:ring-brand-200'}`}>
                        <p className="flex items-center gap-2 pe-7 text-sm font-extrabold text-slate-800">
                          <span className="truncate">{tpl.name}</span>
                          {applied && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white">مطبّق</span>}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{n(count)} مهمة</p>
                        <span className="mt-2.5 flex flex-wrap gap-1">
                          {(tpl.departments || []).length ? tpl.departments.map((d) => <Chip key={d}>{d}</Chip>) : <Chip tone="muted">كل الأقسام</Chip>}
                        </span>
                      </button>
                      {canManage && !tpl.builtIn && tpl.id !== DEFAULT_TEMPLATE.id && (
                        <button type="button" onClick={() => removeTemplate(tpl)} aria-label={`حذف ${tpl.name}`} className="absolute end-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600">
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" /></svg>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {!loading && visibleTpls.length === 0 && <p className="py-6 text-center text-sm text-slate-400">مفيش قوالب للقسم ده</p>}
            </>
          )}

          {step === 'tasks' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="tpl-search" className="mb-1.5 block text-xs font-bold text-slate-500">بحث في المهام</label>
                  <input id="tpl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم المهمة أو القسم…" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
                </div>
                <MultiSelectSearch label="القسم المسؤول" value={deptFilter} onChange={setDeptFilter} options={allDepts} placeholder="فلترة بالقسم المسؤول…" />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-400">{n(visible.length)} معروضة</span>
                <button type="button" onClick={() => setShown(true)} className="rounded-lg px-2.5 py-1.5 text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50">تحديد المعروض</button>
                <button type="button" onClick={() => setShown(false)} className="rounded-lg px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">إلغاء المعروض</button>
                <button type="button" onClick={resetToTemplate} className="rounded-lg px-2.5 py-1.5 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">استرجاع اختيار القالب</button>
              </div>

              <ul className="mt-3 space-y-2">
                {visible.map((t) => {
                  const id = taskId(t);
                  const on = sel.has(id);
                  const depts = taskDepts(t, resp[id]);
                  return (
                    <li key={id} className={`rounded-2xl ring-1 transition-colors ${on ? 'bg-brand-50/50 ring-brand-200' : 'bg-white ring-slate-100'}`}>
                      <div className="flex items-start gap-3 p-3">
                        <button type="button" role="checkbox" aria-checked={on} aria-label={taskName(t)} onClick={() => toggle(id)} className="mt-0.5"><Check on={on} /></button>
                        <span className="min-w-0 flex-1 cursor-pointer" onClick={() => toggle(id)}>
                          <span className="block text-sm font-bold text-slate-800">{taskName(t)}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {depts.length ? depts.map((d) => <Chip key={d}>{d}</Chip>) : <span className="text-[11px] font-semibold text-slate-300">بدون قسم مسؤول</span>}
                          </span>
                        </span>
                        <button type="button" aria-label="تعديل القسم المسؤول" aria-expanded={editing === id} onClick={() => setEditing(editing === id ? null : id)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${editing === id ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-brand-700'}`}>
                          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" /></svg>
                        </button>
                      </div>
                      {editing === id && (
                        <div className="border-t border-brand-100 px-3 pb-3 pt-2.5">
                          <MultiSelectSearch
                            label="القسم المسؤول"
                            value={depts}
                            options={allDepts}
                            allowCreate
                            placeholder="ابحثي أو أضيفي قسم…"
                            onChange={(v) => setResp((r) => ({ ...r, [id]: v }))}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
                {visible.length === 0 && <li className="py-8 text-center text-sm text-slate-400">مفيش مهام مطابقة للبحث</li>}
              </ul>

              {saveAs && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="mb-3 text-sm font-extrabold text-slate-700">حفظ كقالب جديد ({n(sel.size)} مهمة)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="tpl-name" className="mb-1.5 block text-xs font-bold text-slate-500">اسم القالب</label>
                      <input id="tpl-name" value={saveAs.name} onChange={(e) => setSaveAs({ ...saveAs, name: e.target.value })} placeholder="مثال: قالب العقارات" className="h-[2.75rem] w-full rounded-xl bg-white px-3 text-sm font-semibold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-400" />
                    </div>
                    <MultiSelectSearch label="القسم" value={saveAs.departments} onChange={(v) => setSaveAs({ ...saveAs, departments: v })} options={allDepts} allowCreate placeholder="اختاري القسم/الأقسام…" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busy || !saveAs.name.trim()} onClick={createTemplate} className="btn-primary disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ القالب'}</button>
                    <button type="button" onClick={() => setSaveAs(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-white">إلغاء</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== Footer ===== */}
        {step === 'tasks' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-5 py-3.5">
            <button type="button" onClick={apply} className="btn-primary">تطبيق على المشروع ({n(sel.size)})</button>
            {canManage && changed && (
              <button type="button" disabled={busy} onClick={updateTemplate} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:opacity-60">{busy ? 'جاري الحفظ…' : 'حفظ التعديل على القالب'}</button>
            )}
            {canManage && !saveAs && (
              <button type="button" onClick={() => setSaveAs({ name: '', departments: active?.departments || [] })} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">حفظ كقالب جديد</button>
            )}
            <span className="ms-auto text-xs font-semibold text-slate-400">{n(tasks.length - sel.size)} مهمة مش مطلوبة</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
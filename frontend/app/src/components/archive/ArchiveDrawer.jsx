import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/EngineerIcons';
import { STATES, n, stateOf } from '../../utils/dashboardData';
import { parseDepts } from '../../utils/departments';

/* نفس منطق projectStats القديم: بنحسب المهام اللي applicable بس */
export function snapshotStats(snap, tasks) {
  let done = 0;
  let total = 0;
  tasks.forEach((t) => { const s = snap?.tasks?.[t.id]; if (s?.applicable) { total += 1; if (s.status) done += 1; } });
  (snap?.customTasks || []).forEach((c) => { if (c.applicable) { total += 1; if (c.status) done += 1; } });
  return { done, total, remaining: total - done, pct: total ? Math.round((done / total) * 100) : 0 };
}

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

function Ring({ pct }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t); }, [pct]);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-brand-100" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-brand-600 transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-extrabold tabular-nums text-brand-900">{n(pct)}%</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-neutral-100">
      <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
      <div className="mt-0.5 text-sm font-bold text-neutral-800">{children}</div>
    </div>
  );
}

export default function ArchiveDrawer({ row, detail, info, tasks, busy, onClose, onRestore, onDelete }) {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState('overview');
  const [tf, setTf] = useState('all');

  const snap = detail?.snapshot || row.snapshot || null;
  const hasr = detail?.hasr || null;
  const files = detail?.files || null;
  const stats = useMemo(() => snapshotStats(snap, tasks), [snap, tasks]);
  const stKey = snap ? stateOf(snap) : null;
  const st = (stKey && STATES[stKey]) || null;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const rows = useMemo(() => {
    const std = tasks.map((t) => ({ key: t.id, title: t.title, custom: false, s: snap?.tasks?.[t.id] }));
    const cus = (snap?.customTasks || []).map((c) => ({ key: c.id, title: c.title, custom: true, s: c }));
    return [...std, ...cus].filter((x) => x.s).filter((x) => {
      if (tf === 'done') return x.s.applicable && x.s.status;
      if (tf === 'todo') return x.s.applicable && !x.s.status;
      if (tf === 'off') return !x.s.applicable;
      return true;
    });
  }, [snap, tasks, tf]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`تفاصيل ${row.projectName}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-[#3C3C3B]/50 backdrop-blur-[2px] transition-opacity duration-300 ${entered ? 'opacity-100' : 'opacity-0'}`} />

      <aside dir="rtl" className={`absolute inset-y-0 left-0 flex w-full max-w-xl flex-col bg-white shadow-lift transition-transform duration-300 ease-out motion-reduce:transition-none ${entered ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* رأس */}
        <header className="flex items-start gap-3 border-b border-neutral-100 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-neutral-400">مشروع مؤرشف</p>
            <h2 className="mt-0.5 text-xl font-extrabold leading-snug text-brand-900">{row.projectName || 'مشروع بدون اسم'}</h2>
            {st && <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1" style={{ color: st.color, borderColor: st.color }}><span className="h-2 w-2 rounded-full" style={{ background: st.color }} />{st.label}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100"><Icon name="x" className="h-5 w-5" /></button>
        </header>

        {/* تبويبات */}
        <div className="flex gap-1 border-b border-neutral-100 px-5 pt-2" role="tablist">
          {[['overview', 'نظرة عامة'], ['tasks', `المهام (${n(rows.length)})`]].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative px-4 py-2.5 text-sm font-bold transition ${tab === k ? 'text-brand-700' : 'text-neutral-400 hover:text-neutral-600'}`}>
              {l}
              <span className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 transition-opacity ${tab === k ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* تبع مين */}
              <section className="rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
                <p className="mb-3 text-xs font-bold text-brand-700">تبع أنهي فريق ومهندس</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-extrabold text-white">{(info.engineerName || '؟').trim().charAt(0)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-neutral-900">{info.engineerName}</p>
                    <p className="truncate text-sm text-neutral-500">{info.teamName}{info.manager ? ` · مدير الفريق: ${info.manager}` : ''}</p>
                  </div>
                </div>
                {!info.engineerExists && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200">المهندس غير موجود حاليًا في الفرق — عند الاسترجاع هتختاري مهندس بديل.</p>}
              </section>

              {/* التقدم */}
              {snap ? (
                <section className="flex items-center gap-5 rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                  <Ring pct={stats.pct} />
                  <div className="grid flex-1 grid-cols-3 gap-2 text-center">
                    {[['منجزة', stats.done], ['متبقية', stats.remaining], ['الإجمالي', stats.total]].map(([l, v]) => (
                      <div key={l} className="rounded-xl bg-neutral-50 py-2 ring-1 ring-neutral-100"><p className="text-xl font-extrabold tabular-nums text-brand-900">{n(v)}</p><p className="text-[11px] font-semibold text-neutral-400">{l}</p></div>
                    ))}
                  </div>
                </section>
              ) : (
                <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 ring-1 ring-neutral-200">لا توجد نسخة تفصيلية (Snapshot) محفوظة لهذا السجل. تفاصيل المهام هتظهر لما الـ Backend يحفظها وقت الأرشفة.</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="تاريخ الأرشفة">{fmtDateTime(row.archivedAt)}</Field>
                <Field label="تمت الأرشفة بواسطة">{row.archivedBy || '—'}</Field>
                <Field label="تاريخ التسليم">{fmtDate(snap?.deliveryDate)}</Field>
                <Field label="تاريخ الاستفسارات">{fmtDate(snap?.inquiryDate)}</Field>
              </div>

              {hasr && (
                <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                  <p className="mb-2 text-sm font-extrabold text-brand-900">حالة الحصر وقت الأرشفة</p>
                  <p className="text-sm text-neutral-600">{hasr.hasWork === false ? 'لا يوجد عمل حصر' : hasr.hasWork == null ? 'لم يُحدد' : hasr.hasrDone ? 'تم الحصر' : 'جاري الحصر'}{hasr.hasrDueDate ? ` · ميعاد: ${fmtDate(hasr.hasrDueDate)}` : ''}</p>
                  {hasr.hasrNotes && <p className="mt-1 text-sm text-neutral-500">{hasr.hasrNotes}</p>}
                </section>
              )}

              {files && (files.attachments?.length > 0 || files.tFiles?.length > 0) && (
                <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                  <p className="mb-2 text-sm font-extrabold text-brand-900">الملفات</p>
                  <ul className="space-y-1.5">
                    {(files.attachments || []).map((f) => (
                      <li key={f.id}><a href={f.downloadUrl} download className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-brand-50"><Icon name="file" className="h-4 w-4 text-brand-600" /><span className="truncate">{f.attachmentName || f.originalFileName}</span></a></li>
                    ))}
                    {(files.tFiles || []).map((f) => <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-700"><Icon name="folder" className="h-4 w-4 text-brand-600" /><span className="truncate">{f.name} · {n(f.rounds?.length || 0)} جولة</span></li>)}
                  </ul>
                </section>
              )}
              {!files && row.filesCount > 0 && <p className="text-xs text-neutral-400">{n(row.filesCount)} ملفات مرتبطة بالمشروع (هتظهر بالتفصيل لما endpoint التفاصيل يجهز).</p>}
            </div>
          )}

          {tab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[['all', 'الكل'], ['done', 'منجزة'], ['todo', 'متبقية'], ['off', 'غير أساسية']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setTf(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition ${tf === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-brand-300'}`}>{l}</button>
                ))}
              </div>
              {!snap && <p className="py-10 text-center text-sm text-neutral-400">لا توجد تفاصيل مهام محفوظة.</p>}
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li key={`${r.custom ? 'c' : 's'}${r.key}`} className={`rounded-xl p-3 ring-1 ${r.s.applicable ? 'bg-white ring-neutral-200' : 'bg-neutral-50 ring-neutral-100'}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${r.s.status ? 'bg-brand-600 text-white' : 'border-2 border-neutral-300'}`}>{r.s.status && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3.5} />}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold ${r.s.applicable ? 'text-neutral-900' : 'text-neutral-400'}`}>{r.title}{r.custom && <span className="ms-2 text-[10px] font-bold text-brand-600">مضافة</span>}{!r.s.applicable && <span className="ms-2 text-[10px] font-bold text-neutral-400">غير أساسية</span>}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.s.review && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">روجعت</span>}
                          {parseDepts(r.s.department).map((d) => <span key={d} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{d}</span>)}
                          {r.s.dueDate && <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{fmtDate(r.s.dueDate)}</span>}
                        </div>
                        {r.s.notes && <p className="mt-1.5 text-xs text-neutral-500">{r.s.notes}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {snap && !rows.length && <p className="py-10 text-center text-sm text-neutral-400">لا توجد مهام في هذا التصنيف.</p>}
            </div>
          )}
        </div>

        {/* إجراءات */}
        <footer className="flex flex-wrap gap-2 border-t border-neutral-100 bg-white p-4">
          <button type="button" disabled={busy} onClick={onRestore} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"><Icon name="restore" className="h-4 w-4" />استرجاع كمشروع جاري</button>
          <button type="button" disabled={busy} onClick={onDelete} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"><Icon name="trash" className="h-4 w-4" />حذف نهائي</button>
        </footer>
      </aside>
    </div>
  );
}
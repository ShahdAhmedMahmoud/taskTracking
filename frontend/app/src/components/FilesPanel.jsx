import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../services/filesService';
import { useUI } from '../hooks/useUI';
import FormModal from './ui/FormModal';
import Modal from './ui/Modal';
import Loader from './ui/Loader';
import { LayersIcon, PlusIcon, TrashIcon, TickIcon } from './engineer/EngineerIcons';
import { n } from '../utils/dashboardData';

const size = (bytes) => { const value = Number(bytes) || 0; return value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`; };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const roundMarker = (id) => `[delivery-round:${id}]`;

export default function FilesPanel({ project, user, attachmentsOnly = false }) {
  const { toast, confirm } = useUI();
  const [files, setFiles] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const syncingRounds = useRef(false);

  const load = useCallback(async () => {
    try { setFiles(await api.fetchProjectFiles(project.id)); }
    catch (error) { toast('error', error.message); }
  }, [project.id, toast]);
  useEffect(() => { setFiles(null); load(); }, [load]);

  // Keep the project's delivery rounds as the source of truth, while using the
  // existing files API to persist each round's T files and version history.
  useEffect(() => {
    if (attachmentsOnly || !files || syncingRounds.current) return;
    const projectRounds = project.rounds?.length ? project.rounds : [{ id: 'round-1', title: 'الجولة 1', date: project.deliveryDate || '' }];
    const missing = projectRounds.filter((round) =>
      round.id && !(files.tFiles || []).some((group) => group.description === roundMarker(round.id))
    );
    if (!missing.length) return;
    syncingRounds.current = true;
    (async () => {
      try {
        for (const round of missing) {
          await api.createTFile(project.id, { name: round.title || 'جولة تسليم', description: roundMarker(round.id) }, user);
        }
        await load();
      } catch (error) {
        toast('error', `تعذر تجهيز ملفات جولات التسليم: ${error.message}`, 5000);
      } finally { syncingRounds.current = false; }
    })();
  }, [attachmentsOnly, files, project.id, project.rounds, project.deliveryDate, user, load, toast]);

  const run = async (action, message) => {
    setBusy(true);
    try { await action(); await load(); toast('success', message); }
    catch (error) { toast('error', error.message, 5000); }
    finally { setBusy(false); }
  };
  const ask = async (title, message, action, successMessage) => {
    if (await confirm({ title, message, confirmText: 'حذف' })) run(action, successMessage);
  };
  const pickVersions = (fileId) => {
    if (busy) return;
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = '.xlsx,.xls,.pdf,.png';
    input.onchange = () => {
      const selected = Array.from(input.files || []);
      if (!selected.length) return;
      run(async () => { for (const file of selected) await api.uploadVersion(fileId, file, user); }, selected.length > 1 ? `تم رفع ${n(selected.length)} إصدارات` : 'تم رفع الإصدار');
    };
    input.click();
  };

  const ctx = `المشروع: ${project.name || 'بدون اسم'}`;
  const projectRounds = project.rounds?.length ? project.rounds : [{ id: 'round-1', title: 'الجولة 1', date: project.deliveryDate || '' }];
  const deliveryGroups = (files?.tFiles || []).filter((group) => projectRounds.some((round) => group.description === roundMarker(round.id)));
  const unlinkedGroups = (files?.tFiles || []).filter((group) => !deliveryGroups.some((linked) => linked.id === group.id));
  const FileActions = ({ name, url, type, onDelete }) => (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" disabled={busy} className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-neutral-200 transition hover:bg-brand-50 disabled:opacity-50" onClick={() => setModal({ type: 'preview', name, url, ext: (type || '').toLowerCase() })}>معاينة</button>
      <a className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-neutral-200 transition hover:bg-brand-50" href={url} download>تنزيل</a>
      <button type="button" disabled={busy} className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-50 disabled:opacity-50" onClick={onDelete}>حذف</button>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-l from-brand-50 via-white to-brand-50/70 p-5 sm:p-6">
        <span aria-hidden className="pointer-events-none absolute -end-10 -top-16 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"><LayersIcon className="h-6 w-6" /></span>
            <div className="min-w-0"><h3 className="text-lg font-extrabold text-brand-950">{attachmentsOnly ? 'مرفقات المشروع' : 'ملفات المشروع وإصداراته'}</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{attachmentsOnly ? 'الملفات المساندة المرتبطة بالمشروع.' : 'ملفات T داخل جولات التسليم وإصداراتها.'}</p></div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="button" disabled={busy} className="btn-ghost inline-flex flex-1 items-center justify-center gap-2 sm:flex-none" onClick={() => setModal({ type: 'attachment' })}><PlusIcon className="h-4 w-4" />مرفق</button>
          </div>
        </div>
      </div>

      {!files ? <div className="p-5"><Loader text="جاري تحميل ملفات المشروع..." /></div> : (
        <div className={`grid gap-5 p-4 sm:p-5 ${attachmentsOnly ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.8fr)]'}`}>
          {!attachmentsOnly && <>
          <section className="min-w-0 rounded-2xl border border-brand-100 bg-neutral-50/60 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><h4 className="font-extrabold text-neutral-900">جولات التسليم وملفات T</h4><p className="mt-1 text-xs text-neutral-500">ارفعي نسخًا متعددة للملف نفسه مع الاحتفاظ بسجل الإصدارات السابقة.</p></div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">{n(deliveryGroups.length)} جولة</span>
            </div>

            {deliveryGroups.length || unlinkedGroups.length ? (
              <div className="space-y-4">
                {[...deliveryGroups, ...unlinkedGroups].map((round, roundIndex) => {
                  const linkedRound = projectRounds.find((item) => round.description === roundMarker(item.id));
                  return (
                  <article key={round.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-gradient-to-l from-brand-50/80 to-white p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-sm">{n(roundIndex + 1)}</span>
                        <div className="min-w-0"><p className="text-[11px] font-bold text-brand-600">{linkedRound?.title || `جولة تسليم ${n(roundIndex + 1)}`}</p><h5 className="truncate font-extrabold text-neutral-900">{round.name}</h5><p className="mt-0.5 text-[11px] text-neutral-400">{linkedRound?.date ? `موعد التسليم: ${dateLabel(linkedRound.date)}` : `أنشأها ${round.createdBy || '—'} · ${dateLabel(round.createdAt)}`}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-neutral-500 ring-1 ring-neutral-200">{n(round.rounds?.length || 0)} ملف T</span>
                        <button type="button" disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-50" onClick={() => setModal({ type: 'tfile', round })}><PlusIcon className="h-3.5 w-3.5" />إضافة T File</button>
                        {!linkedRound && <button type="button" disabled={busy} aria-label="حذف جولة الملفات" className="grid h-9 w-9 place-items-center rounded-xl text-neutral-400 ring-1 ring-neutral-200 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" onClick={() => ask('حذف جولة الملفات', `سيتم حذف «${round.name}» مع كل ملفات T وإصداراتها. لا يمكن التراجع عن ذلك.`, () => api.deleteTFile(round.id, user), 'تم حذف الجولة وملفاتها')}><TrashIcon className="h-4 w-4" /></button>}
                      </div>
                    </div>

                    {(round.rounds || []).length ? (
                      <div className="space-y-3 p-3 sm:p-4">
                        {round.rounds.map((tFile, tIndex) => {
                          const versions = tFile.versions || [];
                          const current = versions.find((version) => version.isCurrentVersion) || versions.at(-1);
                          return (
                            <article key={tFile.id} className="rounded-2xl border border-neutral-200 bg-white p-3.5 transition hover:border-brand-200 sm:p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">T{n(tIndex + 1)}</span>
                                  <div className="min-w-0"><h6 className="truncate font-extrabold text-neutral-800">{tFile.name}</h6><p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{tFile.description || 'ملف فني تابع لجولة التسليم'}</p><p className="mt-1 text-[11px] font-semibold text-neutral-400">{n(versions.length)} إصدار · {current ? `الحالي: V${n(current.versionNumber)}` : 'بانتظار أول إصدار'}</p></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="button" disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-50" onClick={() => pickVersions(tFile.id)}><PlusIcon className="h-3.5 w-3.5" />رفع إصدار</button>
                                  <button type="button" disabled={busy} aria-label="حذف ملف T" className="grid h-9 w-9 place-items-center rounded-xl text-neutral-400 ring-1 ring-neutral-200 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" onClick={() => ask('حذف ملف T', `حذف «${tFile.name}» مع جميع إصداراته؟`, () => api.deleteRound(tFile.id, user), 'تم حذف ملف T وإصداراته')}><TrashIcon className="h-4 w-4" /></button>
                                </div>
                              </div>

                              {versions.length ? (
                                <ol className="mt-4 space-y-2 border-s-2 border-neutral-100 ps-3">
                                  {[...versions].sort((a, b) => b.versionNumber - a.versionNumber).map((version) => (
                                    <li key={version.id} className={`rounded-xl p-3 ${version.isCurrentVersion ? 'bg-brand-50/70 ring-1 ring-brand-100' : 'bg-neutral-50'}`}>
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-2.5">
                                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${version.isCurrentVersion ? 'bg-brand-600 text-white' : 'bg-white text-neutral-500 ring-1 ring-neutral-200'}`}>{version.isCurrentVersion ? <TickIcon className="h-4 w-4" /> : `V${n(version.versionNumber)}`}</span>
                                          <div className="min-w-0"><p className="break-all text-xs font-bold text-neutral-800">{version.originalFileName}</p><p className="mt-1 text-[11px] text-neutral-500">V{n(version.versionNumber)} · {size(version.fileSize)} · {dateLabel(version.uploadedAt)}{version.uploadedBy ? ` · ${version.uploadedBy}` : ''}</p>{version.isCurrentVersion && <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-extrabold text-brand-800">الإصدار الحالي</span>}</div>
                                        </div>
                                        <FileActions name={version.originalFileName} url={version.downloadUrl} type={version.fileType} onDelete={() => ask('حذف الإصدار', `حذف V${version.versionNumber} نهائيًا؟`, () => api.deleteVersion(version.id, user), 'تم حذف الإصدار')} />
                                      </div>
                                    </li>
                                  ))}
                                </ol>
                              ) : <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 px-3 py-4 text-center text-xs font-semibold text-neutral-400">لم تُرفع إصدارات بعد. ارفعي الإصدار الأول لبدء سجل الملف.</div>}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="m-4 rounded-2xl border-2 border-dashed border-neutral-200 px-4 py-7 text-center"><p className="text-sm font-bold text-neutral-600">ابدئي بإضافة أول ملف T للجولة</p><p className="mt-1 text-xs text-neutral-400">بعدها تقدري ترفعي له إصدارات متعددة.</p><button type="button" disabled={busy} className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-50" onClick={() => setModal({ type: 'tfile', round })}>+ إضافة T File</button></div>
                    )}
                  </article>
                );})}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-brand-200 bg-white px-5 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><LayersIcon className="h-7 w-7" /></span>
                <h5 className="mt-4 font-extrabold text-neutral-800">لا توجد جولات تسليم بعد</h5>
                <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-500">أنشئي جولة من قسم جولات التسليم بالمشروع. ستظهر هنا تلقائيًا لإضافة ملفات T وإصداراتها.</p>
              </div>
            )}
          </section>
          </>}

          <section className={`min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 ${attachmentsOnly ? 'border-0 p-0' : ''}`}>
            <div className="mb-4 flex items-center justify-between gap-2"><div><h4 className="font-extrabold text-neutral-900">مرفقات المشروع</h4><p className="mt-1 text-xs text-neutral-500">ملفات مساندة غير مرتبطة بجولة</p></div><span className="rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-bold text-neutral-500 ring-1 ring-neutral-200">{n(files.attachments?.length || 0)}</span></div>
            {(files.attachments || []).length ? <div className="space-y-2.5">{files.attachments.map((attachment) => (
              <article key={attachment.id} className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
                <p className="truncate text-sm font-extrabold text-neutral-800">{attachment.attachmentName || attachment.originalFileName}</p><p className="mt-1 break-all text-xs text-neutral-500">{attachment.originalFileName}</p><p className="mt-1 text-[11px] text-neutral-400">{attachment.fileType} · {size(attachment.fileSize)} · V{n(attachment.version)}</p>
                <div className="mt-3"><FileActions name={attachment.originalFileName} url={attachment.downloadUrl} type={attachment.fileType} onDelete={() => ask('حذف المرفق', `حذف «${attachment.attachmentName || attachment.originalFileName}» نهائيًا؟`, () => api.deleteAttachment(attachment.id, user), 'تم حذف المرفق')} /></div>
              </article>
            ))}</div> : <div className="rounded-xl bg-neutral-50 px-3 py-6 text-center text-xs text-neutral-400">لا توجد مرفقات للمشروع.</div>}
          </section>
        </div>
      )}

      {modal?.type === 'attachment' && <FormModal title="إضافة مرفق للمشروع" context={ctx} submitText="رفع المرفق" onClose={() => setModal(null)} fields={[
        { name: 'name', label: 'اسم المرفق', placeholder: 'مثال: خطاب العميل' }, { name: 'notes', label: 'ملاحظات' },
        { name: 'file', label: 'الملف', type: 'file', required: true, accept: '.xlsx,.xls,.pdf,.png', hint: 'Excel · PDF · PNG — حتى 25 MB' },
      ]} onSubmit={async (value) => { await api.uploadAttachment(project.id, { file: value.file, name: value.name, notes: value.notes }, user); await load(); toast('success', 'تم رفع المرفق'); }} />}
      {modal?.type === 'tfile' && <FormModal title="إضافة T File للجولة" context={`المشروع: ${project.name || 'بدون اسم'} · الجولة: ${modal.round.name}`} submitText="إضافة الملف" onClose={() => setModal(null)} fields={[
        { name: 'name', label: 'اسم T File', required: true, placeholder: 'مثال: المخططات المعمارية' }, { name: 'description', label: 'وصف الملف', type: 'textarea' },
      ]} onSubmit={async (value) => { await api.createRound(modal.round.id, value, user); await load(); toast('success', 'تمت إضافة T File للجولة'); }} />}
      {modal?.type === 'preview' && <Modal size="xl" title={modal.name} onClose={() => setModal(null)}>{(() => {
        const src = `${modal.url}${modal.url.includes('?') ? '&' : '?'}inline=true`;
        if (['.png', '.jpg', '.jpeg', '.webp'].includes(modal.ext)) return <img src={src} alt={modal.name} className="mx-auto max-h-[72vh] rounded-xl" />;
        if (modal.ext === '.pdf') return <iframe src={src} title={modal.name} className="h-[72vh] w-full rounded-xl border" />;
        return <div className="py-10 text-center"><p className="mb-3 text-neutral-500">المعاينة غير متاحة لهذا النوع.</p><a className="btn-primary" href={modal.url} download>تنزيل الملف</a></div>;
      })()}</Modal>}
    </section>
  );
}

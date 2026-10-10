import { useCallback, useEffect, useState } from 'react';
import * as api from '../services/filesService';
import { useUI } from '../hooks/useUI';
import FormModal from './ui/FormModal';
import Modal from './ui/Modal';
import Loader from './ui/Loader';

const size = (b) => { const v = Number(b) || 0; return v < 1024 ? `${v} B` : v < 1048576 ? `${(v / 1024).toFixed(1)} KB` : `${(v / 1048576).toFixed(1)} MB`; };

export default function FilesPanel({ project, user }) {
  const { toast, confirm } = useUI();
  const [files, setFiles] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try { setFiles(await api.fetchProjectFiles(project.id)); } catch (e) { toast('error', e.message); }
  }, [project.id, toast]);
  useEffect(() => { setFiles(null); load(); }, [load]);

  const run = async (fn, msg) => { try { await fn(); await load(); toast('success', msg); } catch (e) { toast('error', e.message, 5000); } };
  const ask = async (title, message, fn, msg) => { if (await confirm({ title, message, confirmText: 'حذف' })) run(fn, msg); };
  const pickVersion = (roundId) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls,.pdf,.png';
    i.onchange = () => i.files[0] && run(() => api.uploadVersion(roundId, i.files[0], user), 'تم رفع النسخة');
    i.click();
  };

  const ctx = `المشروع: ${project.name || 'بدون اسم'}`;
  const FileActions = ({ name, url, type, onDelete }) => (
    <div className="flex flex-wrap gap-1.5">
      <button className="btn-ghost !px-3 !py-1 !text-xs" onClick={() => setModal({ type: 'preview', name, url, ext: (type || '').toLowerCase() })}>عرض</button>
      <a className="btn-ghost !px-3 !py-1 !text-xs" href={url} download>تنزيل</a>
      <button className="btn-danger !px-3 !py-1 !text-xs" onClick={onDelete}>حذف</button>
    </div>
  );

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">📎 مرفقات و T Files</h3>
          <p className="text-xs text-slate-500">كل اللي هنا تابع للمشروع الحالي فقط.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setModal({ type: 'attachment' })}>+ مرفق</button>
          <button className="btn-ghost" onClick={() => setModal({ type: 'tfile' })}>+ T File</button>
        </div>
      </div>

      {!files ? <Loader text="جاري تحميل الملفات..." /> : (
        <div className="space-y-5">
          <div>
            <h4 className="mb-2 text-sm font-extrabold text-slate-600">المرفقات</h4>
            {(files.attachments || []).length ? (
              <div className="space-y-2">
                {files.attachments.map((a) => (
                  <div key={a.id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <b className="block truncate text-sm">{a.attachmentName || a.originalFileName}</b>
                      <span className="text-xs text-slate-500">{a.originalFileName} · {a.fileType} · {size(a.fileSize)} · إصدار {a.version}</span>
                    </div>
                    <FileActions name={a.originalFileName} url={a.downloadUrl} type={a.fileType}
                      onDelete={() => ask('حذف المرفق', `حذف "${a.attachmentName || a.originalFileName}" نهائيًا؟`, () => api.deleteAttachment(a.id, user), 'تم حذف المرفق')} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">لا توجد مرفقات.</p>}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-extrabold text-slate-600">T Files</h4>
            {(files.tFiles || []).length ? (
              <div className="space-y-3">
                {files.tFiles.map((t) => (
                  <article key={t.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><b>{t.name}</b><span className="ms-2 text-xs text-slate-500">{t.rounds?.length || 0} جولة · {t.createdBy}</span></div>
                      <div className="flex gap-1.5">
                        <button className="btn-ghost !px-3 !py-1 !text-xs" onClick={() => setModal({ type: 'round', tFile: t })}>+ Round</button>
                        <button className="btn-danger !px-3 !py-1 !text-xs" onClick={() => ask('حذف T File', 'هيتحذف مع كل الـ Rounds والـ Versions. متأكدة؟', () => api.deleteTFile(t.id, user), 'تم الحذف')}>حذف</button>
                      </div>
                    </div>
                    {(t.rounds || []).map((r) => (
                      <div key={r.id} className="mt-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <b className="text-sm">Round {r.roundNumber}: {r.name}</b>
                          <div className="flex gap-1.5">
                            <button className="btn-ghost !px-3 !py-1 !text-xs" onClick={() => pickVersion(r.id)}>رفع Version</button>
                            <button className="btn-danger !px-3 !py-1 !text-xs" onClick={() => ask('حذف Round', 'هيتحذف مع كل الـ Versions. متأكدة؟', () => api.deleteRound(r.id, user), 'تم الحذف')}>حذف</button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {(r.versions || []).length ? r.versions.map((v) => (
                            <div key={v.id} className={`flex flex-col gap-2 rounded-lg bg-white p-2 sm:flex-row sm:items-center sm:justify-between ${v.isCurrentVersion ? 'ring-1 ring-emerald-300' : ''}`}>
                              <span className="text-xs text-slate-600">Version {v.versionNumber} · {v.originalFileName} · {size(v.fileSize)} {v.isCurrentVersion && <b className="text-emerald-600">· الحالية</b>}</span>
                              <FileActions name={v.originalFileName} url={v.downloadUrl} type={v.fileType}
                                onDelete={() => ask('حذف Version', 'حذف هذه النسخة نهائيًا؟', () => api.deleteVersion(v.id, user), 'تم الحذف')} />
                            </div>
                          )) : <p className="text-xs text-slate-400">لا توجد نسخ.</p>}
                        </div>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">لا توجد T Files.</p>}
          </div>
        </div>
      )}

      {modal?.type === 'attachment' && (
        <FormModal title="إضافة مرفق" context={ctx} submitText="رفع المرفق" onClose={() => setModal(null)}
          fields={[
            { name: 'name', label: 'اسم المرفق', placeholder: 'مثال: فاتورة' },
            { name: 'notes', label: 'ملاحظات' },
            { name: 'file', label: 'الملف', type: 'file', required: true, accept: '.xlsx,.xls,.pdf,.png', hint: 'Excel · PDF · PNG — حتى 25 MB' },
          ]}
          onSubmit={async (v) => { await api.uploadAttachment(project.id, { file: v.file, name: v.name, notes: v.notes }, user); await load(); toast('success', 'تم رفع المرفق'); }} />
      )}
      {modal?.type === 'tfile' && (
        <FormModal title="إضافة T File" context={ctx} submitText="إنشاء" onClose={() => setModal(null)}
          fields={[{ name: 'name', label: 'اسم T File', required: true }, { name: 'description', label: 'الوصف' }]}
          onSubmit={async (v) => { await api.createTFile(project.id, v, user); await load(); toast('success', 'تم إنشاء T File'); }} />
      )}
      {modal?.type === 'round' && (
        <FormModal title="إضافة Round" context={`T File: ${modal.tFile.name}`} submitText="إنشاء" onClose={() => setModal(null)}
          fields={[{ name: 'name', label: 'اسم Round', required: true }, { name: 'description', label: 'الوصف' }]}
          onSubmit={async (v) => { await api.createRound(modal.tFile.id, v, user); await load(); toast('success', 'تم إنشاء Round'); }} />
      )}
      {modal?.type === 'preview' && (
        <Modal wide title={modal.name} onClose={() => setModal(null)}>
          {(() => {
            const src = `${modal.url}${modal.url.includes('?') ? '&' : '?'}inline=true`;
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(modal.ext)) return <img src={src} alt={modal.name} className="mx-auto max-h-[70vh] rounded-xl" />;
            if (modal.ext === '.pdf') return <iframe src={src} title={modal.name} className="h-[70vh] w-full rounded-xl border" />;
            return <div className="py-10 text-center"><p className="mb-3 text-slate-500">المعاينة غير متاحة لهذا النوع.</p><a className="btn-primary" href={modal.url} download>تنزيل الملف</a></div>;
          })()}
        </Modal>
      )}
    </section>
  );
}
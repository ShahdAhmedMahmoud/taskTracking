import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../../services/filesService';
import { useUI } from '../../hooks/useUI';
import FormModal from '../ui/FormModal';
import { PlusIcon, TrashIcon } from './EngineerIcons';
import { n } from '../../utils/dashboardData';

const marker = (id) => `[delivery-round:${id}]`;
const size = (bytes) => { const value = Number(bytes) || 0; return value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`; };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function RoundTFiles({ project, round, user }) {
  const { toast, confirm } = useUI();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const creatingGroup = useRef(false);
  const load = useCallback(async () => {
    try { setData(await api.fetchProjectFiles(project.id)); }
    catch (error) { toast('error', error.message); }
  }, [project.id, toast]);
  useEffect(() => { load(); }, [load]);

  const groups = data?.tFiles || [];
  const group = groups.find((item) => item.description === marker(round.id));
  useEffect(() => {
    if (!data || group || creatingGroup.current) return;
    creatingGroup.current = true;
    api.createTFile(project.id, { name: round.title || 'جولة تسليم', description: marker(round.id) }, user)
      .then(load)
      .catch((error) => toast('error', `تعذر تجهيز ملفات الجولة: ${error.message}`, 5000))
      .finally(() => { creatingGroup.current = false; });
  }, [data, group, project.id, round.id, round.title, user, load, toast]);

  const addTFile = async (value) => {
    setBusy(true);
    try {
      const target = group || await api.createTFile(project.id, { name: round.title || 'جولة تسليم', description: marker(round.id) }, user);
      await api.createRound(target.id, value, user);
      await load(); setShowForm(false); toast('success', 'تمت إضافة ملف T للجولة');
    } catch (error) { toast('error', error.message, 5000); }
    finally { setBusy(false); }
  };
  const upload = (tFileId) => {
    if (busy) return;
    const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = '.xlsx,.xls,.pdf,.png';
    input.onchange = async () => {
      const selected = Array.from(input.files || []); if (!selected.length) return;
      setBusy(true);
      try { for (const file of selected) await api.uploadVersion(tFileId, file, user); await load(); toast('success', selected.length > 1 ? `تم رفع ${n(selected.length)} إصدارات` : 'تم رفع الإصدار'); }
      catch (error) { toast('error', error.message, 5000); }
      finally { setBusy(false); }
    };
    input.click();
  };
  const removeTFile = async (item) => {
    if (!await confirm({ title: 'حذف ملف T', message: `حذف «${item.name}» وجميع إصداراته؟`, confirmText: 'حذف' })) return;
    setBusy(true); try { await api.deleteRound(item.id, user); await load(); toast('success', 'تم حذف ملف T وإصداراته'); }
    catch (error) { toast('error', error.message, 5000); } finally { setBusy(false); }
  };

  return <section className="mt-4 rounded-2xl border border-brand-100 bg-neutral-50/70 p-3 sm:p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div><h4 className="text-sm font-extrabold text-brand-900">ملفات T للجولة</h4><p className="mt-0.5 text-xs text-neutral-500">كل ملف له سجل إصدارات مستقل</p></div>
      <button type="button" disabled={busy} onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-brand-700 disabled:opacity-50"><PlusIcon className="h-3.5 w-3.5" />إضافة T File</button>
    </div>
    {!data ? <p className="py-4 text-center text-xs text-neutral-400">جاري تحميل الملفات...</p> : !group ? <p className="py-4 text-center text-xs text-neutral-400">جاري تجهيز الجولة...</p> : group.rounds?.length ? <div className="space-y-2.5">
      {group.rounds.map((item, index) => {
        const versions = [...(item.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
        const current = versions.find((version) => version.isCurrentVersion) || versions[0];
        return <article key={item.id} className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex min-w-0 items-start gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">T{n(index + 1)}</span><div className="min-w-0"><h5 className="truncate text-sm font-extrabold text-neutral-800">{item.name}</h5><p className="mt-1 text-[11px] text-neutral-500">{n(versions.length)} إصدار · {current ? `الحالي V${n(current.versionNumber)}` : 'بانتظار أول إصدار'}</p></div></div>
            <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => upload(item.id)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">رفع إصدار</button><button type="button" disabled={busy} onClick={() => removeTFile(item)} aria-label="حذف ملف T" className="grid h-9 w-9 place-items-center rounded-lg text-neutral-400 ring-1 ring-neutral-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"><TrashIcon className="h-4 w-4" /></button></div>
          </div>
          {versions.length > 0 && <ol aria-label={`إصدارات ${item.name}`} className="mt-3 max-h-40 space-y-1.5 overflow-y-auto border-s-2 border-neutral-100 ps-3 pe-1">{versions.map((version) => <li key={version.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs ${version.isCurrentVersion ? 'bg-brand-50' : 'bg-neutral-50'}`}><span className="min-w-0"><b className="break-all text-neutral-800">V{n(version.versionNumber)} · {version.originalFileName}</b><span className="mt-0.5 block text-[10px] text-neutral-500">{size(version.fileSize)} · {dateLabel(version.uploadedAt)}{version.uploadedBy ? ` · ${version.uploadedBy}` : ''}</span></span><div className="flex items-center gap-2"><a className="font-bold text-brand-700 hover:underline" href={version.downloadUrl} download>تنزيل</a><button type="button" disabled={busy} onClick={async () => { if (await confirm({ title: 'حذف الإصدار', message: `حذف V${n(version.versionNumber)}؟`, confirmText: 'حذف' })) { setBusy(true); try { await api.deleteVersion(version.id, user); await load(); } catch (error) { toast('error', error.message); } finally { setBusy(false); } } }} className="font-bold text-rose-600 hover:underline disabled:opacity-50">حذف</button></div></li>)}</ol>}
        </article>;
      })}
    </div> : <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-3 py-5 text-center text-xs text-neutral-500">لسه مفيش ملفات T في الجولة دي. أضيفي أول ملف لبدء سجل الإصدارات.</div>}
    {showForm && <FormModal title="إضافة T File للجولة" context={`${project.name || 'المشروع'} · ${round.title || 'جولة التسليم'}`} submitText="إضافة الملف" onClose={() => setShowForm(false)} fields={[{ name: 'name', label: 'اسم T File', required: true, placeholder: 'مثال: المخططات المعمارية' }, { name: 'description', label: 'وصف الملف', type: 'textarea' }]} onSubmit={addTFile} />}
  </section>;
}

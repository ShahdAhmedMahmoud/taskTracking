import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { Empty } from '../components/ui/Loader';
import { daysLeft, fmtDate, toneChip } from '../utils/dates';
import { byDelivery, teamLabel } from '../utils/helpers';

export default function HasrPage() {
  const { teamId: p } = useParams();
  const { session } = useAuth();
  const { teams, hasr, saveHasr, loadHasr } = useData();
  const { confirm } = useUI();
  const teamId = session.role === 'team' ? session.id : p;
  const team = teams.find((t) => t.id === teamId);

  useEffect(() => { if (team && !hasr[team.id]) loadHasr(team.id).catch(() => {}); }, [team?.id]); // eslint-disable-line

  if (session.role === 'engineer') return <Navigate to="/my-tasks" replace />;
  if (!team || team.type !== 'hasr') return <Empty icon="🔎" title="القسم غير موجود" />;

  const list = (hasr[team.id] || []).slice().sort(byDelivery);
  const upd = (id, patch) => saveHasr(team.id, (hasr[team.id] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = async (item) => {
    if (await confirm({ title: '🗑 حذف من الحصر', message: `حذف المشروع "${item.name}" من قائمة الحصر؟`, confirmText: 'حذف المشروع' }))
      saveHasr(team.id, (hasr[team.id] || []).filter((x) => x.id !== item.id));
  };
  const stat = (f) => list.filter(f).length;

  return (
    <>
      <PageHeader back={session.role === 'dept'} title={`${teamLabel(team)} — قسم الحصر`} subtitle="المشاريع بتتضاف هنا تلقائيًا بمجرد حفظها من أي مهندس — مفيش إضافة يدوية." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="📥" label="الواردة" value={list.length} />
        <StatCard icon="⏳" label="لم يُحدد بعد" value={stat((x) => x.hasWork == null)} tone="amber" />
        <StatCard icon="🔧" label="جاري العمل" value={stat((x) => x.hasWork === true && !x.hasrDone)} tone="sky" />
        <StatCard icon="✅" label="تم الحصر" value={stat((x) => x.hasWork === true && x.hasrDone)} tone="brand" />
      </div>

      {list.length ? (
        <div className="space-y-3">
          {list.map((item, i) => {
            const di = daysLeft(item.deliveryDate);
            return (
              <div key={item.id} className="card animate-fade-up p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-xs font-extrabold text-neutral-500">{i + 1}</div>
                  <div className="min-w-0 flex-1"><h4 className="truncate font-extrabold">{item.name}</h4><p className="text-xs text-neutral-500">{item.addedBy && `أضافه: ${item.addedBy} · `}التسليم: {fmtDate(item.deliveryDate)}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneChip[di.tone]}`}>{di.text}</span>
                  <button onClick={() => remove(item)} className="rounded-lg p-2 text-neutral-400 hover:bg-brand-50 hover:text-brand-600">🗑</button>
                </div>
                {item.projectNote && <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 px-3.5 py-3"><p className="text-[11px] font-extrabold text-brand-700">ملحوظة المشروع من المهندس{item.addedBy ? ` · ${item.addedBy}` : ''}</p><p className="mt-1 text-sm leading-6 text-neutral-700">{item.projectNote}</p></div>}
                <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-neutral-100 pt-4">
                  <div><span className="label">هل يوجد عمل حصر؟</span>
                    <div className="flex gap-2">
                      <button onClick={() => upd(item.id, { hasWork: true })} className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ${item.hasWork === true ? toneChip.emerald : 'bg-white text-neutral-500 ring-neutral-200'}`}>✓ نعم، يوجد عمل</button>
                      <button onClick={() => upd(item.id, { hasWork: false, hasrDueDate: '' })} className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ${item.hasWork === false ? toneChip.rose : 'bg-white text-neutral-500 ring-neutral-200'}`}>✗ لا يوجد عمل</button>
                    </div></div>
                  {item.hasWork === true && (
                    <>
                      <div><span className="label">ميعاد تسليم الحصر</span><input type="date" className="input" value={item.hasrDueDate || ''} onChange={(e) => upd(item.id, { hasrDueDate: e.target.value })} /></div>
                      <div><span className="label">حالة التنفيذ</span>
                        <button onClick={() => upd(item.id, { hasrDone: !item.hasrDone })} className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ${item.hasrDone ? toneChip.emerald : 'bg-white text-neutral-500 ring-neutral-200'}`}>{item.hasrDone ? '✅ تم الحصر — إلغاء' : '✓ تم الحصر'}</button></div>
                    </>
                  )}
                  {item.hasWork == null && <span className="text-xs text-neutral-400">⏳ لم يُحدد بعد</span>}
                  <div className="min-w-[220px] flex-1"><span className="label">ملاحظات (تظهر للمهندس المسؤول)</span>
                    <input key={item.id + (item.hasrNotes || '')} className="input" defaultValue={item.hasrNotes || ''} placeholder="اكتبي ملاحظتك هنا" onBlur={(e) => e.target.value !== (item.hasrNotes || '') && upd(item.id, { hasrNotes: e.target.value })} /></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty icon="📐" title="لسه مفيش مشاريع وصلت هنا" text="أي مشروع جديد يتضاف ويتحفظ في أي فريق هيظهر هنا تلقائيًا." />}
    </>
  );
}

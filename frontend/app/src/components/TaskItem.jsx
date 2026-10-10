import { useState } from 'react';

function Toggle({ on, onClick, onText, offText, tone = 'emerald' }) {
  const onCls = { emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-300', indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-300' }[tone];
  return (
    <button onClick={onClick} className={`rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition ${on ? onCls : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'}`}>
      {on ? onText : offText}
    </button>
  );
}

export default function TaskItem({ number, title, desc, state, onChange, label, custom, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card animate-fade-up border-s-4 p-4 transition ${state.status ? 'border-s-emerald-400' : 'border-s-slate-200'} ${state.applicable ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-500">{String(number).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-bold">{title}</h5>
            {custom && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">مهمة مضافة</span>}
            {desc && <button onClick={() => setOpen(!open)} className="text-xs font-bold text-indigo-600">{open ? 'إخفاء' : 'التفاصيل'}</button>}
          </div>
          {open && <p className="mt-1 text-sm leading-7 text-slate-500">{desc}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div><span className="label">الحالة</span><Toggle on={state.status} onClick={() => onChange('status', !state.status)} onText="☑ تم" offText="☐ لم يتم" /></div>
        <div><span className="label">المراجعة</span><Toggle on={state.review} tone="indigo" onClick={() => onChange('review', !state.review)} onText="☑ روجعت" offText="☐ لم تراجع" /></div>
        <div><span className="label">ينطبق؟</span><Toggle on={state.applicable} onClick={() => onChange('applicable', !state.applicable)} onText="✓ أساسي" offText="غير أساسي" /></div>
        <div className="w-full sm:w-40">
          <span className="label">{label('dueDate', 'ميعاد الانتهاء')}</span>
          <input type="date" className="input" value={state.dueDate || ''} onChange={(e) => onChange('dueDate', e.target.value)} />
        </div>
        <div className="w-full sm:w-40">
          <span className="label">{label('department', 'القسم المسؤول')}</span>
          <input className="input" defaultValue={state.department || ''} placeholder="اسم القسم" onBlur={(e) => e.target.value !== state.department && onChange('department', e.target.value)} />
        </div>
        <div className="min-w-[200px] flex-1">
          <span className="label">{label('notes', 'ملاحظات')}</span>
          <input className="input" defaultValue={state.notes || ''} placeholder="اكتبي ملاحظتك هنا" onBlur={(e) => e.target.value !== state.notes && onChange('notes', e.target.value)} />
        </div>
        {onDelete && <button className="btn-danger" onClick={onDelete}>🗑 حذف</button>}
      </div>
    </div>
  );
}
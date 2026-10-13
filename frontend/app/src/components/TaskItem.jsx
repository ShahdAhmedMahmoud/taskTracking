import { useState } from 'react';
import ResponsibleDepartments from './engineer/ResponsibleDepartments';
import ResponsibleDepartmentDropdown from './engineer/ResponsibleDepartmentDropdown';

function Toggle({ on, onClick, onText, offText, tone = 'brand' }) {
  const onCls = { emerald: 'bg-brand-50 text-brand-700 ring-brand-300', brand: 'bg-brand-50 text-brand-700 ring-brand-300', indigo: 'bg-brand-50 text-brand-700 ring-brand-300' }[tone] || 'bg-brand-50 text-brand-700 ring-brand-300';
  return (
    <button onClick={onClick} className={`rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition ${on ? onCls : 'bg-white text-neutral-500 ring-neutral-200 hover:bg-neutral-50'}`}>
      {on ? onText : offText}
    </button>
  );
}

export default function TaskItem({ number, title, desc, state, onChange, label, custom, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`card animate-fade-up border-s-4 p-4 transition ${state.status ? 'border-s-brand-500' : 'border-s-neutral-200'} ${state.applicable ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-xs font-extrabold text-neutral-500">{String(number).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-bold">{title}</h5>
            {custom && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">مهمة مضافة</span>}
            {desc && <button onClick={() => setOpen(!open)} className="text-xs font-bold text-brand-600">{open ? 'إخفاء' : 'التفاصيل'}</button>}
          </div>
          {open && <p className="mt-1 text-sm leading-7 text-neutral-500">{desc}</p>}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        <div><span className="label">الحالة</span><Toggle on={state.status} onClick={() => onChange('status', !state.status)} onText="☑ تم" offText="☐ لم يتم" /></div>
        <div><span className="label">المراجعة</span><Toggle on={state.review} tone="brand" onClick={() => onChange('review', !state.review)} onText="☑ روجعت" offText="☐ لم تراجع" /></div>
        <div><span className="label">ينطبق؟</span><Toggle on={state.applicable} onClick={() => onChange('applicable', !state.applicable)} onText="✓ أساسي" offText="غير أساسي" /></div>
        <div className="min-w-0">
          <span className="label">{label('dueDate', 'ميعاد الانتهاء')}</span>
          <input type="date" className="input" value={state.dueDate || ''} onChange={(e) => onChange('dueDate', e.target.value)} />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="label">الفريق المسؤول</span>
          <ResponsibleDepartments value={state.team || ''} onChange={(value) => onChange('team', value)} />
        </div>
        {/* */}
        <div className="min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <span className="label">{label('notes', 'ملاحظات')}</span>
          <input className="input" defaultValue={state.notes || ''} placeholder="اكتبي ملاحظتك هنا" onBlur={(e) => e.target.value !== state.notes && onChange('notes', e.target.value)} />
        </div>
        {onDelete && <button className="btn-danger" onClick={onDelete}>🗑 حذف</button>}
      </div>
    </div>
  );
}

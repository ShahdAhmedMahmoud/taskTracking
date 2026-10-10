import { useState } from 'react';
import Modal from './Modal';

export default function FormModal({ title, context, fields, submitText = 'حفظ', onSubmit, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (n, v) => setValues((s) => ({ ...s, [n]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.name]);
    if (missing) return setError(`${missing.label} مطلوب`);
    setBusy(true); setError('');
    try { await onSubmit(values); onClose(); }
    catch (err) { setError(err.message || 'حصل خطأ'); setBusy(false); }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {context && <div className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">{context}</div>}
        {fields.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}{f.required && ' *'}</label>
            {f.type === 'select' ? (
              <select className="input" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">— اختاري —</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'file' ? (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 hover:border-indigo-400">
                <b>{values[f.name]?.name || 'اختاري الملف'}</b>
                <span className="text-xs">{f.hint}</span>
                <input type="file" hidden accept={f.accept} onChange={(e) => set(f.name, e.target.files[0])} />
              </label>
            ) : f.type === 'textarea' ? (
              <textarea className="input" rows={3} value={values[f.name]} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
            ) : (
              <input className="input" type={f.type || 'text'} autoFocus={f === fields[0]} value={values[f.name]} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
            )}
          </div>
        ))}
        {error && <p className="text-sm font-bold text-rose-600">⚠ {error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" disabled={busy}>{busy ? '...' : submitText}</button>
        </div>
      </form>
    </Modal>
  );
}
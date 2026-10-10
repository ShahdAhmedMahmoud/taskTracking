// import { createContext, useCallback, useContext, useState } from 'react';
// import Modal from '../components/ui/Modal';

// const UICtx = createContext(null);
// export const useUI = () => useContext(UICtx);

// const toastTone = {
//   success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
//   error: 'border-rose-200 bg-rose-50 text-rose-700',
//   info: 'border-indigo-200 bg-white text-slate-700',
// };

// export function UIProvider({ children }) {
//   const [toasts, setToasts] = useState([]);
//   const [dialog, setDialog] = useState(null);

//   const toast = useCallback((type, message, ms = 3200) => {
//     const id = Math.random().toString(36).slice(2);
//     setToasts((t) => [...t, { id, type, message }]);
//     setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
//   }, []);

//   const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
//   const answer = (v) => { dialog.resolve(v); setDialog(null); };

//   return (
//     <UICtx.Provider value={{ toast, confirm }}>
//       {children}
//       <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
//         {toasts.map((t) => (
//           <div key={t.id} className={`animate-fade-up pointer-events-auto max-w-md rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg ${toastTone[t.type] || toastTone.info}`}>
//             {t.type === 'success' ? '✓ ' : t.type === 'error' ? '⚠ ' : ''}{t.message}
//           </div>
//         ))}
//       </div>
//       {dialog && (
//         <Modal title={dialog.title} onClose={() => answer(false)}>
//           <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{dialog.message}</p>
//           <div className="mt-5 flex justify-end gap-2">
//             <button className="btn-ghost" onClick={() => answer(false)}>إلغاء</button>
//             <button className={dialog.primary ? 'btn-primary' : 'btn bg-rose-600 text-white hover:bg-rose-700'} onClick={() => answer(true)}>
//               {dialog.confirmText || 'تأكيد'}
//             </button>
//           </div>
//         </Modal>
//       )}
//     </UICtx.Provider>
//   );
// }

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../components/ui/Modal';
import { CheckIcon, AlertIcon, InfoIcon, CloseIcon } from '../components/ui/Icons';

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

const TONES = {
  success: { Icon: CheckIcon, ring: 'border-emerald-200', accent: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
  error:   { Icon: AlertIcon, ring: 'border-rose-200',    accent: 'bg-rose-500',    icon: 'bg-rose-50 text-rose-600' },
  warning: { Icon: AlertIcon, ring: 'border-amber-200',   accent: 'bg-amber-500',   icon: 'bg-amber-50 text-amber-600' },
  info:    { Icon: InfoIcon,  ring: 'border-slate-200',   accent: 'bg-brand-500',   icon: 'bg-brand-50 text-brand-600' },
};
const MAX_TOASTS = 4;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const timers = useRef({});
  const resolver = useRef(null);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((type, message, ms = 3200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message, ms }].slice(-MAX_TOASTS));
    timers.current[id] = setTimeout(() => dismiss(id), ms);
  }, [dismiss]);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current?.(false); // أي مربع مفتوح قبله يتقفل بـ "لا"
    resolver.current = resolve;
    setDialog(opts);
  }), []);

  const answer = (v) => {
    resolver.current?.(v);
    resolver.current = null;
    setDialog(null);
  };

  // value ثابت: من غير ده كل toast كان بيعمل re-render لكل اللي بيستهلك useUI (يعني التطبيق كله)
  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UICtx.Provider value={value}>
      {children}

      {/* ===== Toasts ===== */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2.5 px-4">
        {toasts.map((t) => {
          const tone = TONES[t.type] || TONES.info;
          const { Icon } = tone;
          return (
            <div key={t.id} role="status" className={`pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border bg-white py-3 pe-3 ps-5 shadow-lift animate-rise ${tone.ring}`}>
              <span className={`absolute inset-y-0 start-0 w-1.5 ${tone.accent}`} />
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></span>
              <p className="min-w-0 flex-1 text-sm font-bold leading-6 text-slate-700">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="إغلاق" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-slate-600">
                <CloseIcon className="h-4 w-4" />
              </button>
              <span className={`toast-bar absolute inset-x-0 bottom-0 h-0.5 origin-right opacity-60 ${tone.accent}`} style={{ animationDuration: `${t.ms}ms` }} />
            </div>
          );
        })}
      </div>

      {/* ===== Confirm ===== */}
      {dialog && (
        <Modal
          size="sm"
          title={dialog.title || 'تأكيد'}
          onClose={() => answer(false)}
          footer={(
            <div className="flex justify-end gap-2">
              {/* الـ focus على "إلغاء" في العمليات الخطرة عشان Enter بالغلط ما يحذفش حاجة */}
              <button type="button" className="btn-ghost" autoFocus={!dialog.primary} onClick={() => answer(false)}>{dialog.cancelText || 'إلغاء'}</button>
              <button type="button" className={dialog.primary ? 'btn-primary' : 'btn-danger'} autoFocus={!!dialog.primary} onClick={() => answer(true)}>{dialog.confirmText || 'تأكيد'}</button>
            </div>
          )}
        >
          <div className="flex items-start gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${dialog.primary ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-600'}`}>
              {dialog.primary ? <InfoIcon className="h-6 w-6" /> : <AlertIcon className="h-6 w-6" />}
            </span>
            <p className="whitespace-pre-line pt-1 text-base leading-7 text-slate-600">{dialog.message}</p>
          </div>
        </Modal>
      )}
    </UICtx.Provider>
  );
}
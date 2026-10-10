// import { useEffect } from 'react';
// import { createPortal } from 'react-dom';

// export default function Modal({ title, onClose, children, wide }) {
//   useEffect(() => {
//     const h = (e) => e.key === 'Escape' && onClose?.();
//     window.addEventListener('keydown', h);
//     return () => window.removeEventListener('keydown', h);
//   }, [onClose]);

//   return createPortal(
//     <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
//          onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
//       <div className={`animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
//         {title && (
//           <div className="mb-4 flex items-center justify-between gap-3">
//             <h3 className="text-lg font-extrabold">{title}</h3>
//             <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
//           </div>
//         )}
//         {children}
//       </div>
//     </div>,
//     document.body
//   );
// }

import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

export default function Modal({ title, onClose, children, size = 'md', footer }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // عشان الـ effect ميتعادش لو الأب بعت arrow جديدة كل render

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    window.addEventListener('keydown', onKey);
    // لو فيه input عليه autoFocus جوه المودال، ما نسرقش منه الـ focus
    if (panel.current && !panel.current.contains(document.activeElement)) panel.current.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none animate-rise sm:rounded-3xl ${SIZES[size] || SIZES.md}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <button type="button" onClick={() => onClose?.()} aria-label="إغلاق"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && <footer className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>
  );
}
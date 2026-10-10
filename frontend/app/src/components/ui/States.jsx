import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { homeFor } from '../../utils/helpers';
import { AlertIcon } from './Icons';

export function Spinner({ className = 'h-6 w-6' }) {
  return <span className={`${className} inline-block animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600`} role="status" aria-label="جاري التحميل" />;
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export function LoadingScreen({ text = 'جاري تحميل البيانات...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-5 text-center animate-rise">
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-lift">
          <img src="/assets/logo.png" alt="" className="h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="absolute -inset-1.5 animate-spin rounded-[1.75rem] border-[3px] border-transparent border-t-brand-500" />
        </div>
        <p className="text-base font-bold text-slate-600">{text}</p>
        <div className="w-full space-y-2.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mx-auto h-3 w-4/5" />
          <Skeleton className="mx-auto h-3 w-3/5" />
        </div>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-6">
      <div className="card w-full max-w-md p-8 text-center animate-rise">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600"><AlertIcon className="h-8 w-8" /></span>
        <h1 className="mt-5 text-xl font-extrabold">تعذّر تحميل البيانات</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">تأكدي إن الخادم شغال وإن الاتصال سليم، وبعدين حاولي تاني.</p>
        {message && <p dir="auto" className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-start font-mono text-xs text-slate-400">{message}</p>}
        {onRetry && <button type="button" onClick={onRetry} className="btn-primary mt-6 w-full !py-3">إعادة المحاولة</button>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      {Icon && <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500"><Icon className="h-8 w-8" /></span>}
      <p className="text-lg font-extrabold text-slate-700">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-7 text-slate-400">{hint}</p>}
      {action}
    </div>
  );
}

export function NotFoundPage() {
  const { session } = useAuth();
  const { teams } = useData();
  return (
    <div className="grid min-h-[70vh] place-items-center p-6">
      <div className="text-center animate-rise">
        <p className="bg-gradient-to-l from-emerald-400 to-brand-700 bg-clip-text text-8xl font-extrabold text-transparent">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">الصفحة دي مش موجودة</h1>
        <p className="mt-2 text-slate-500">ممكن الرابط اتغيّر أو الصفحة اتنقلت.</p>
        <Link to={homeFor(session, teams)} className="btn-primary mt-6 !px-6 !py-3">الرجوع للرئيسية</Link>
      </div>
    </div>
  );
}
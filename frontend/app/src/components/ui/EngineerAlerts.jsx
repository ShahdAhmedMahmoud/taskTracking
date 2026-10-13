import { Link } from 'react-router-dom';
import { BellIcon, ClockIcon } from './Icons';
import { useEngineerAlerts } from '../../services/engineerAlerts';
import { timeAgo } from '../../utils/dates';
import { n } from '../../utils/dashboardData';

const STYLE = {
  danger: { ring: 'ring-rose-200 bg-rose-50/60', icon: 'bg-rose-100 text-rose-600', pill: 'bg-rose-100 text-rose-700' },
  warn: { ring: 'ring-amber-200 bg-amber-50/60', icon: 'bg-amber-100 text-amber-600', pill: 'bg-amber-100 text-amber-700' },
  info: { ring: 'ring-brand-100 bg-white', icon: 'bg-brand-50 text-brand-600', pill: 'bg-brand-50 text-brand-700' },
};

/**
 * تنبيهات المواعيد + إشعارات المدراء.
 * الاستخدام: حطيه فوق محتوى صفحة الإشعارات: <EngineerAlerts />
 */
export default function EngineerAlerts() {
  const { items, unread, markIds, markAll } = useEngineerAlerts();
  const newItems = items.filter((item) => !item.read);
  const readItems = items.filter((item) => item.read);

  const renderItems = (list, isNew) => list.length ? <ul className="space-y-2.5">{list.map((a, i) => {
    const s = STYLE[a.level] || STYLE.info;
    const Icon = a.kind === 'deadline' ? ClockIcon : BellIcon;
    return <li key={a.id} className={`flex items-start gap-3 rounded-2xl p-4 ring-1 animate-rise transition duration-300 hover:-translate-y-0.5 hover:shadow-sm ${s.ring} ${isNew ? 'ring-2 ring-brand-200' : 'opacity-80'}`} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.icon}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="min-w-0 flex-1 text-sm font-extrabold">{a.title}</p>{isNew ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span> : <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">مقروء</span>}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{a.message}</p><div className="mt-2 flex flex-wrap items-center gap-2">{a.projectId && <Link to={`/my-tasks?p=${a.projectId}`} onClick={() => markIds([a.id])} className={`rounded-lg px-3 py-1 text-xs font-extrabold transition hover:opacity-80 ${s.pill}`}>فتح المشروع</Link>}{isNew && <button type="button" onClick={() => markIds([a.id])} className="rounded-lg px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-white">تعليم كمقروء</button>}{a.kind !== 'deadline' && <time title={new Date(a.at).toLocaleString('ar-EG')} className="text-xs text-slate-400">{timeAgo(a.at)}</time>}</div>
      </div>
    </li>;
  })}</ul> : <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">لا توجد تنبيهات {isNew ? 'جديدة' : 'مقروءة'}.</p>;

  return (
    <section className="mb-6 rounded-3xl border border-neutral-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs font-extrabold text-brand-700">تنبيهات شخصية</span><h2 className="mt-1 text-lg font-black text-neutral-900">المواعيد وتحديثات المدراء</h2><p className="mt-1 text-sm text-neutral-500">{n(unread)} جديد من أصل {n(items.length)} تنبيه</p></div>{unread > 0 && <button type="button" onClick={markAll} className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100">تعليم الكل كمقروء</button>}</div>
      {items.length ? <div className="space-y-5"><section><h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-neutral-700"><span className="h-2 w-2 rounded-full bg-brand-600" />جديدة <span className="text-xs text-neutral-400">{n(newItems.length)}</span></h3>{renderItems(newItems, true)}</section><section><h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-neutral-700"><span className="h-2 w-2 rounded-full bg-neutral-300" />تمت قراءتها <span className="text-xs text-neutral-400">{n(readItems.length)}</span></h3>{renderItems(readItems, false)}</section></div>
        : <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-500">لا توجد تنبيهات الآن. ستظهر التنبيهات عند اقتراب موعد مهمة أو وصول تحديث من المدير.</div>}
    </section>
  );
}

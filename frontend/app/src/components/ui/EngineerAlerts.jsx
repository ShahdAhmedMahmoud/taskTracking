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

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">تنبيهات المواعيد والمدراء</h2>
          <p className="text-sm text-slate-400">{unread ? `${n(unread)} غير مقروء` : 'كله مقروء'}</p>
        </div>
        {unread > 0 && <button type="button" onClick={markAll} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50">تعليم الكل كمقروء</button>}
      </div>

      {items.length === 0 ? (
        <div className="card py-10 text-center text-sm text-slate-400">مفيش تنبيهات دلوقتي. هتظهر هنا لما يفضل يوم على أي موعد، أو لما مدير يضيف لك مشروع أو يكتب ملحوظة.</div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((a, i) => {
            const s = STYLE[a.level] || STYLE.info;
            const Icon = a.kind === 'deadline' ? ClockIcon : BellIcon;
            return (
              <li key={a.id} className={`flex items-start gap-3 rounded-2xl p-4 ring-1 animate-rise transition duration-300 ${s.ring} ${a.read ? 'opacity-70' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.icon}`}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${a.read ? 'font-semibold' : 'font-extrabold'}`}>{a.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{a.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {a.projectId && <Link to={`/my-tasks?p=${a.projectId}`} onClick={() => markIds([a.id])} className={`rounded-lg px-3 py-1 text-xs font-extrabold transition hover:opacity-80 ${s.pill}`}>فتح المشروع</Link>}
                    {!a.read && <button type="button" onClick={() => markIds([a.id])} className="rounded-lg px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-white">تعليم كمقروء</button>}
                    {a.kind !== 'deadline' && <span className="text-xs text-slate-400">{timeAgo(a.at)}</span>}
                  </div>
                </div>
                {!a.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label="غير مقروء" />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
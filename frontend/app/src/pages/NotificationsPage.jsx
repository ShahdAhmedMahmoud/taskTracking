import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';
import { Empty } from '../components/ui/Loader';
import EngineerAlerts from '../components/ui/EngineerAlerts';
import { useEngineerAlerts } from '../services/engineerAlerts';
import Panel from '../components/ui/Panel';
import { BellIcon, CheckIcon } from '../components/ui/Icons';
import { timeAgo } from '../utils/dates';
import { n } from '../utils/dashboardData';

function NotificationSection({ title, items, onOpen, unread }) {
  return <Panel title={title} subtitle={`${n(items.length)} إشعار`}>
    {items.length ? <div className="space-y-2">{items.map((item) => <button key={item.id} type="button" onClick={() => onOpen(item)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm ${unread ? 'border-brand-200 bg-brand-50/40' : 'border-neutral-200 bg-white'}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${unread ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-500'}`}><BellIcon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="text-sm font-extrabold text-neutral-800">{item.title || 'إشعار جديد'}</b>{unread && <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-extrabold text-white">جديد</span>}<time title={new Date(item.createdAt).toLocaleString('ar-EG')} className="ms-auto text-xs font-medium text-neutral-400">{timeAgo(item.createdAt)}</time></span><span className="mt-1 block text-sm leading-6 text-neutral-600">{item.message}</span>{item.projectId && <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand-700">فتح المشروع <span aria-hidden="true">←</span></span>}</span>
      {!unread && <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-neutral-300" />}
    </button>)}</div> : <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">لا توجد إشعارات {unread ? 'جديدة' : 'مقروءة'}.</p>}
  </Panel>;
}
export default function NotificationsPage() {
  const { items, unread: systemUnread, markRead, markAll } = useNotifications();
  const alerts = useEngineerAlerts();
  const { engineers } = useData();
  const { session } = useAuth();
  const nav = useNavigate();

  const newItems = items.filter((item) => !item.readAt);
  const readItems = items.filter((item) => !!item.readAt);
  const totalUnread = systemUnread + alerts.unread;

  const open = async (n) => {
    if (!n.readAt) await markRead(n.id).catch(() => {});
    if (n.projectId && engineers[session.id]?.projects.some((p) => p.id === n.projectId)) {
      localStorage.setItem('tender-dashboard-active-project:' + session.id, n.projectId);
      nav('/my-tasks');
    }
  };

  return (
    <>
      <PageHeader title="مركز الإشعارات" subtitle={totalUnread ? `لديك ${n(totalUnread)} إشعار جديد` : 'تابعي تنبيهات المواعيد وتحديثات المشاريع من هنا.'}
        actions={totalUnread > 0 && <button className="btn-ghost inline-flex items-center gap-2" onClick={() => { markAll().catch(() => {}); alerts.markAll(); }}><CheckIcon className="h-4 w-4" />تعليم الكل كمقروء</button>} />
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><BellIcon className="h-5 w-5" /></span><span><b className="block text-xl font-black tabular-nums text-brand-900">{n(totalUnread)}</b><span className="text-xs font-bold text-neutral-500">إشعار جديد</span></span></div>
        <div className="card p-4"><b className="block text-xl font-black tabular-nums text-neutral-800">{n(items.length + alerts.items.length)}</b><span className="text-xs font-bold text-neutral-500">إجمالي الإشعارات والتنبيهات</span></div>
        <div className="card p-4"><b className="block text-xl font-black tabular-nums text-neutral-800">{n(readItems.length + alerts.items.filter((item) => item.read).length)}</b><span className="text-xs font-bold text-neutral-500">تمت قراءتها</span></div>
      </section>
      <EngineerAlerts />
      {items.length ? <div className="mt-6 space-y-5">
        <NotificationSection title="الإشعارات الجديدة" items={newItems} onOpen={open} unread />
        <NotificationSection title="الإشعارات المقروءة" items={readItems} onOpen={open} unread={false} />
      </div> : <Empty icon="🔔" title="لا توجد إشعارات حالياً" text="ستظهر هنا تحديثات المشاريع والمواعيد." />}
    </>
  );
}

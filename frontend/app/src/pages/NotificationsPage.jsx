import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';
import { Empty } from '../components/ui/Loader';

export default function NotificationsPage() {
  const { items, unread, markRead, markAll } = useNotifications();
  const { engineers } = useData();
  const { session } = useAuth();
  const nav = useNavigate();

  const open = async (n) => {
    if (!n.readAt) await markRead(n.id).catch(() => {});
    if (n.projectId && engineers[session.id]?.projects.some((p) => p.id === n.projectId)) {
      localStorage.setItem('tender-dashboard-active-project:' + session.id, n.projectId);
      nav('/my-tasks');
    }
  };

  return (
    <>
      <PageHeader title="مركز الإشعارات" subtitle={unread ? `${unread} إشعار غير مقروء` : 'كله مقروء ✨'}
        actions={<button className="btn-ghost" onClick={markAll}>تحديد الكل كمقروء</button>} />
      {items.length ? (
        <div className="space-y-2">
          {items.map((n) => (
            <article key={n.id} onClick={() => open(n)} className={`card-hover flex items-start gap-3 p-4 ${n.readAt ? '' : 'border-indigo-200 bg-indigo-50/50'}`}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.readAt ? 'bg-slate-100' : 'bg-indigo-100'}`}>🔔</div>
              <div className="min-w-0 flex-1"><strong>{n.title}</strong><p className="mt-0.5 text-sm text-slate-600">{n.message}</p></div>
              <time className="shrink-0 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('ar-EG')}</time>
            </article>
          ))}
        </div>
      ) : <Empty icon="🔔" title="لا توجد إشعارات حالياً" />}
    </>
  );
}
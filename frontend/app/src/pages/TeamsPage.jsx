import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import PageHeader from '../components/ui/PageHeader';
import ProgressRing from '../components/ui/ProgressRing';
import Avatar from '../components/ui/Avatar';
import { teamLabel } from '../utils/helpers';
import { teamStats } from '../utils/stats';
import { n } from '../utils/dashboardData';

export default function TeamsPage() {
  const { teams, engineers, tasks, hasr } = useData();
  const nav = useNavigate();
  return (
    <>
      <PageHeader back title={`أداء الفرق والأقسام (${teams.length})`} subtitle="اضغطي على أي فريق لعرض التفاصيل" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map((t) => {
          if (t.type === 'hasr') {
            const list = hasr[t.id] || [];
            const closed = list.filter((x) => x.hasWork === false || x.hasrDone).length;
            return (
              <div key={t.id} onClick={() => nav(`/hasr/${t.id}`)} className="card-hover animate-fade-up p-5">
                <div className="flex items-center justify-between"><h3 className="font-extrabold">📐 قسم {t.label}</h3><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{list.length} مشروع</span></div>
                <p className="mt-1 text-sm text-neutral-500">مدير القسم: {t.manager}</p>
                <p className="mt-4 text-sm font-bold text-neutral-600">محسومة: {closed}/{list.length}</p>
              </div>
            );
          }
          const s = teamStats(t, engineers, tasks);
          return (
            <div key={t.id} onClick={() => nav(`/teams/${t.id}`)} className="card-hover animate-fade-up overflow-hidden p-5">
              <div className="mb-4 h-1.5 rounded-full bg-brand-600" />
              <div className="flex items-center gap-4">
                <ProgressRing pct={s.pct} size={76} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-extrabold">{t.division === 'saudi' ? '🇸🇦 ' : ''}{teamLabel(t)}</h3>
                  <p className="truncate text-sm text-neutral-500">مدير الفريق: {t.manager}</p>
                  <p className="mt-1 text-xs font-bold text-neutral-500">{s.done}/{s.total} مهمة · {s.pct}% إنجاز</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-400">{n(t.engineers.length)} مهندسين</p>
                </div>
              </div>
              <div className="mt-4 flex -space-x-2 space-x-reverse">{t.engineers.slice(0, 7).map((e) => <Avatar key={e.id} engineer={e} size={30} />)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

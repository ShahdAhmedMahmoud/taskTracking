import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { initAlerts, processEngineerData } from '../../services/engineerAlerts';
import { fetchHasr } from '../../services/hasrService';

/**
 * بيتحط مرة واحدة في AppLayout (للمهندس بس).
 * كل 45 ثانية بيقرا بيانات المهندس من الـ endpoint الموجود أصلًا ويحدّث التنبيهات.
 */
export default function EngineerAlertsWatcher() {
  const { session } = useAuth();
  const { tasks, teams } = useData();
  const tk = useRef(tasks);
  const roster = useRef(teams);
  tk.current = tasks;
  roster.current = teams;

  useEffect(() => {
    if (session?.role !== 'engineer') return undefined;
    initAlerts(session.id);
    let dead = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/dashboard/engineers/${encodeURIComponent(session.id)}`, { cache: 'no-store' });
        if (!res.ok || dead) return;
        const data = await res.json();
        const team = roster.current.find((item) => item.engineers?.some((engineer) => engineer.id === session.id));
        const hasrTeam = roster.current.find((item) => item.type === 'hasr');
        const hasr = team && hasrTeam ? await fetchHasr(hasrTeam.id) : [];
        if (!dead) processEngineerData(data, tk.current, hasr);
      } catch { /* هنحاول تاني بعد شوية */ }
    };
    run();
    const id = setInterval(() => { if (document.visibilityState === 'visible') run(); }, 45000);
    return () => { dead = true; clearInterval(id); };
  }, [session?.role, session?.id]);

  return null;
}

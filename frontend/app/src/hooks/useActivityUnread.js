import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useData } from './useData';
import { activityService } from '../services/activityService';

/** عدد الإشعارات غير المقروءة لمدير القسم — للـ badge على الجرس في الـ header. */
export function useActivityUnread(intervalMs = 45000) {
  const { session } = useAuth();
  const { teams } = useData();
  const [unread, setUnread] = useState(0);
  const isDept = session?.role === 'dept';

  const people = useMemo(
    () => teams.flatMap((t) => t.engineers.map((e) => ({ engineerId: e.id, name: e.name, teamId: t.id, teamName: t.label ? `فريق ${t.label}` : t.id }))),
    [teams],
  );

  const refresh = useCallback(async () => {
    if (!isDept) return;
    try { setUnread((await activityService.unreadCount({ people })).unread || 0); } catch { /* هنحاول في الدورة اللي بعدها */ }
  }, [isDept, people]);

  useEffect(() => {
    if (!isDept) return undefined;
    refresh();
    const id = setInterval(() => { if (!document.hidden) refresh(); }, intervalMs);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [isDept, refresh, intervalMs]);

  return { unread, refresh, setUnread };
}
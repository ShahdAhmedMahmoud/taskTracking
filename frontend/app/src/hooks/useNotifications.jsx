import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchNotifications, markReadApi, markAllReadApi } from '../services/notificationService';
import { useAuth } from './useAuth';
import { useUI } from './useUI';

const Ctx = createContext({ unread: 0, items: [] });
export const useNotifications = () => useContext(Ctx);

export function NotificationsProvider({ children }) {
  const { session } = useAuth();
  const { toast } = useUI();
  const [state, setState] = useState({ unread: 0, items: [] });
  const seen = useRef(null);
  const isEng = session?.role === 'engineer';

  const load = useCallback(async () => {
    if (!isEng) return;
    try {
      const next = await fetchNotifications(session.id);
      const items = next.items || [];
      if (seen.current) {
        items.filter((i) => !seen.current.has(i.id) && !i.readAt)
          .forEach((i) => toast('info', `🔔 ${i.title || 'إشعار جديد'}: ${i.message || ''}`, 9000));
      }
      seen.current = new Set(items.map((i) => i.id));
      setState(next);
    } catch (e) { console.error(e); }
  }, [isEng, session?.id, toast]);

  useEffect(() => {
    seen.current = null; setState({ unread: 0, items: [] });
    if (!isEng) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, isEng]);

  const markRead = async (id) => { await markReadApi(session.id, id); await load(); };
  const markAll = async () => { await markAllReadApi(session.id); await load(); };

  return <Ctx.Provider value={{ ...state, markRead, markAll }}>{children}</Ctx.Provider>;
}
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
  // Keep local reads authoritative across overlapping polling requests. A fetch
  // that started before the click must not put the notification back as unread.
  const readOverrides = useRef(new Set());
  const isEng = session?.role === 'engineer';

  const load = useCallback(async () => {
    if (!isEng) return;
    try {
      const next = await fetchNotifications(session.id);
      const items = (next.items || []).map((item) => readOverrides.current.has(item.id) && !item.readAt
        ? { ...item, readAt: new Date().toISOString() }
        : item);
      if (seen.current) {
        items.filter((i) => !seen.current.has(i.id) && !i.readAt)
          .forEach((i) => toast('info', `🔔 ${i.title || 'إشعار جديد'}: ${i.message || ''}`, 9000));
      }
      seen.current = new Set(items.map((i) => i.id));
      setState({ ...next, items, unread: items.filter((item) => !item.readAt).length });
    } catch (e) { console.error(e); }
  }, [isEng, session?.id, toast]);

  useEffect(() => {
    seen.current = null; readOverrides.current.clear(); setState({ unread: 0, items: [] });
    if (!isEng) return;
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, isEng]);

  const markRead = async (id) => {
    readOverrides.current.add(id);
    setState((current) => ({ ...current, unread: Math.max(0, current.unread - (current.items.some((item) => item.id === id && !item.readAt) ? 1 : 0)), items: current.items.map((item) => item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item) }));
    try { await markReadApi(session.id, id); } catch (e) { console.error(e); }
    await load();
  };
  const markAll = async () => {
    state.items.forEach((item) => readOverrides.current.add(item.id));
    setState((current) => ({ ...current, unread: 0, items: current.items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })) }));
    try { await markAllReadApi(session.id); } catch (e) { console.error(e); }
    await load();
  };

  return <Ctx.Provider value={{ ...state, markRead, markAll }}>{children}</Ctx.Provider>;
}

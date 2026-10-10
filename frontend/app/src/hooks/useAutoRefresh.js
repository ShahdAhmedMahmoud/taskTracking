import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useData } from './useData';

export default function useAutoRefresh(ms = 30000) {
  const { session } = useAuth();
  const { refreshFor } = useData();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => refreshFor(session, pathname).catch(() => {}), ms);
    return () => clearInterval(t);
  }, [session, pathname, refreshFor, ms]);
}
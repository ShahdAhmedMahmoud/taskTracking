import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchAuth, saveAuth, hashPassword } from '../services/authService';
import { useData } from './useData';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);
const KEY = 'tender-dashboard-session';

export function AuthProvider({ children }) {
  const { teams, deptManager, status, loadScoped } = useData();
  const [auth, setAuth] = useState({ engineers: {}, teams: {}, dept: null });
  const [session, setSession] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const authRef = useRef(auth); authRef.current = auth;
  const restored = useRef(false);

  const hashFor = (role, id) => (role === 'dept' ? auth.dept : role === 'team' ? auth.teams?.[id] : auth.engineers?.[id]);

  const nameFor = (role, id) => {
    if (role === 'dept') return deptManager;
    if (role === 'team') return teams.find((t) => t.id === id)?.manager;
    return teams.flatMap((t) => t.engineers).find((e) => e.id === id)?.name;
  };

  const withHash = (role, id, hash) => {
    const a = structuredClone(authRef.current);
    a.teams = a.teams || {}; a.engineers = a.engineers || {};
    if (role === 'dept') a.dept = hash;
    else { const bag = role === 'team' ? a.teams : a.engineers; if (hash) bag[id] = hash; else delete bag[id]; }
    return a;
  };
  const persist = async (next) => { setAuth(next); await saveAuth(next); };

  useEffect(() => {
    if (!session) return;
    const name = nameFor(session.role, session.id);
    if (name && name !== session.name) setSession((current) => current ? { ...current, name } : current);
  }, [teams, deptManager, session?.role, session?.id, session?.name]);

  const enter = useCallback(async (role, id) => {
    await loadScoped({ role, id });
    setSession({ role, id, name: nameFor(role, id) });
    try { localStorage.setItem(KEY, JSON.stringify({ role, id })); } catch { /* ignore */ }
  }, [loadScoped, teams, deptManager]); // eslint-disable-line

  /* استرجاع الجلسة */
  useEffect(() => {
    if (status.loading || status.error || restored.current) return;
    restored.current = true;
    (async () => {
      try {
        const a = await fetchAuth(); setAuth(a);
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        const valid = saved && (saved.role === 'dept'
          || (saved.role === 'team' && teams.some((t) => t.id === saved.id))
          || (saved.role === 'engineer' && teams.some((t) => t.engineers.some((e) => e.id === saved.id))));
        if (valid) await enter(saved.role, saved.id); else localStorage.removeItem(KEY);
      } catch { localStorage.removeItem(KEY); }
      finally { setRestoring(false); }
    })();
  }, [status, teams, enter]);

  const login = async (role, id, p1, p2) => {
    const existing = hashFor(role, id);
    if (!existing) {
      if (!p1 || p1.length < 4) return 'كلمة المرور لازم تكون 4 حروف/أرقام على الأقل';
      if (p1 !== p2) return 'كلمتا المرور غير متطابقتين';
      await persist(withHash(role, id, await hashPassword(p1)));
    } else if ((await hashPassword(p1 || '')) !== existing) return 'كلمة المرور غير صحيحة';
    await enter(role, id);
    return null;
  };

  const resetViaDept = async (role, id, deptPass) => {
    if (!auth.dept || (await hashPassword(deptPass || '')) !== auth.dept) return 'كلمة مرور مدير القسم غير صحيحة';
    await persist(withHash(role, id, null));
    return null;
  };

  const changePassword = async (oldP, n1, n2) => {
    const current = hashFor(session.role, session.id);
    if (current && (await hashPassword(oldP || '')) !== current) return 'كلمة المرور الحالية غير صحيحة';
    if (!n1 || n1.length < 4) return 'كلمة المرور الجديدة لازم تكون 4 حروف/أرقام على الأقل';
    if (n1 !== n2) return 'كلمتا المرور الجديدتان غير متطابقتين';
    await persist(withHash(session.role, session.id, await hashPassword(n1)));
    return null;
  };

  const removeHash = (role, id) => persist(withHash(role, id, null));
  const logout = () => { localStorage.removeItem(KEY); setSession(null); };

  return (
    <AuthCtx.Provider value={{ session, restoring, hashFor, login, resetViaDept, changePassword, removeHash, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

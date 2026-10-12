import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchBootstrap, fetchDashConfig, fetchFields } from '../services/configService';
import { fetchRoster, saveRoster } from '../services/rosterService';
import { fetchEngineer, saveEngineerApi, archiveProjectApi } from '../services/engineerService';
import { fetchHasr, saveHasrApi } from '../services/hasrService';
import { normField, normalizeEngineer } from '../utils/helpers';
import { useUI } from './useUI';

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function DataProvider({ children }) {
  const { toast } = useUI();
  const [status, setStatus] = useState({ loading: true, error: null });
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [config, setConfig] = useState(null);
  const [deptManager, setDeptManager] = useState('');
  const [engineers, setEngineers] = useState({});
  const [hasr, setHasr] = useState({});
  const [dirty, setDirty] = useState({});

  const engRef = useRef({}); engRef.current = engineers;
  const teamsRef = useRef([]); teamsRef.current = teams;
  const tasksRef = useRef([]); tasksRef.current = tasks;
  const hasrRef = useRef({}); hasrRef.current = hasr;
  const dirtyRef = useRef({}); dirtyRef.current = dirty;
  const timers = useRef({});
  const saveRef = useRef(null);

  /* ---------- bootstrap ---------- */
  const init = useCallback(async () => {
    setStatus({ loading: true, error: null });
    try {
      const b = await fetchBootstrap();
      setTeams(b.teams); setTasks(b.tasks); setDeptManager(b.config?.deptManager || '');
      const cfg = (await fetchDashConfig()) || {};
      try {
        const f = (await fetchFields()).map((x) => ({ ...normField(x), scope: x.scope || x.Scope }));
        const by = (s) => f.filter((x) => x.scope === s);
        cfg.taskFields = cfg.taskFields?.length ? cfg.taskFields : by('task');
        cfg.customTaskFields = cfg.customTaskFields?.length ? cfg.customTaskFields : by('customTask');
        cfg.hasrFields = cfg.hasrFields?.length ? cfg.hasrFields : by('hasr');
      } catch { /* optional */ }
      setConfig(cfg);
      setStatus({ loading: false, error: null });
    } catch (e) {
      setStatus({ loading: false, error: e.message });
    }
  }, []);
  useEffect(() => { init(); }, [init]);

  const fieldLabel = (scope, id, fb) => {
    const key = scope === 'task' ? 'taskFields' : scope === 'customTask' ? 'customTaskFields' : 'hasrFields';
    return config?.[key]?.find((x) => x.id === id)?.label || fb;
  };
  const outcomeLabel = (id, fb) => config?.outcomes?.find((x) => x.id === id)?.label || fb;

  /* ---------- roster ---------- */
  const reloadRoster = useCallback(async () => {
    const r = await fetchRoster();
    if (Array.isArray(r?.teams) && r.teams.length) setTeams(r.teams);
  }, []);

  const updateTeams = useCallback(async (fn) => {
    const next = structuredClone(teamsRef.current);
    const out = fn(next);
    setTeams(next);
    try { await saveRoster(next); toast('success', 'تم حفظ تغييرات الفريق — أصبحت مرئية للجميع'); return out ?? true; }
    catch (e) { toast('error', 'فشل حفظ بيانات الفريق: ' + e.message); return false; }
  }, [toast]);

  const patchEngineerInfo = useCallback((engId, patch) => {
    setTeams((ts) => ts.map((t) => ({ ...t, engineers: t.engineers.map((e) => (e.id === engId ? { ...e, ...patch } : e)) })));
  }, []);

  /* ---------- engineers ---------- */
  const loadEngineer = useCallback(async (id, force) => {
    if (engRef.current[id] && !force) return engRef.current[id];
    const data = normalizeEngineer(await fetchEngineer(id), tasksRef.current);
    setEngineers((p) => ({ ...p, [id]: data }));
    return data;
  }, []);

  const loadMany = useCallback(async (ids, force) => {
    for (const id of ids) {
      try { await loadEngineer(id, force); } catch { /* keep going */ }
      await sleep(150); // نفس فكرة الأصل: متبعتش burst من الريكوستات
    }
  }, [loadEngineer]);

  const mutate = useCallback((engId, fn) => {
    setEngineers((prev) => {
      const cur = prev[engId];
      if (!cur) return prev;
      const next = structuredClone(cur);
      fn(next);
      return { ...prev, [engId]: next };
    });
    setDirty((d) => ({ ...d, [engId]: true }));
    clearTimeout(timers.current[engId]);
    timers.current[engId] = setTimeout(() => saveRef.current?.(engId), 900);
  }, []);

  /* ---------- hasr ---------- */
  const loadHasr = useCallback(async (teamId) => {
    const list = await fetchHasr(teamId);
    const seen = new Map();
    list.forEach((i) => {
      const item = { hasrDone: false, hasrNotes: '', ...i };
      const prev = seen.get(item.id);
      if (!prev || (item.hasrDone && !prev.hasrDone) || (prev.hasWork == null && item.hasWork != null)) seen.set(item.id, item);
    });
    setHasr((h) => ({ ...h, [teamId]: [...seen.values()] }));
  }, []);

  const saveHasr = useCallback(async (teamId, list) => {
    setHasr((h) => ({ ...h, [teamId]: list }));
    try { await saveHasrApi(teamId, list); toast('success', 'تم الحفظ — أصبحت التحديثات مرئية للجميع'); return true; }
    catch (e) { toast('error', 'فشل الحفظ: ' + e.message, 5000); return false; }
  }, [toast]);

  /* ---------- save engineer (+ auto-sync مع قسم الحصر) ---------- */
  const saveEngineer = useCallback(async (engId) => {
    clearTimeout(timers.current[engId]);
    const data = engRef.current[engId];
    if (!data) return false;
    const ts = teamsRef.current;
    const now = new Date().toISOString();
    const synced = new Set();
    try {
      const unsynced = data.projects.filter((p) => !p.hasrSynced);
      const hasrTeam = ts.find((t) => t.type === 'hasr');
      if (hasrTeam && (unsynced.length || data.projects.some((p) => p.note))) {
        const eng = ts.flatMap((t) => t.engineers).find((e) => e.id === engId);
        const list = await fetchHasr(hasrTeam.id);
        let hasrChanged = false;
        data.projects.forEach((p) => {
          const id = 'sync_' + p.id;
          const index = list.findIndex((x) => x.id === id);
          if (index < 0 && !p.hasrSynced) {
            list.push({ id, name: p.name || 'مشروع بدون اسم', deliveryDate: p.deliveryDate || '', addedBy: eng?.name || '', hasWork: null, hasrDueDate: '', hasrDone: false, hasrNotes: '', projectNote: p.note || '' });
            hasrChanged = true;
          } else if (index >= 0 && p.note && list[index].projectNote !== p.note) {
            list[index] = { ...list[index], projectNote: p.note };
            hasrChanged = true;
          }
          if (!p.hasrSynced) synced.add(p.id);
        });
        if (hasrChanged) {
          await saveHasrApi(hasrTeam.id, list);
          setHasr((h) => ({ ...h, [hasrTeam.id]: list }));
        }
      }
      const payload = { ...data, lastSaved: now, projects: data.projects.map((p) => (synced.has(p.id) ? { ...p, hasrSynced: true } : p)) };
      await saveEngineerApi(engId, payload);
      setEngineers((prev) => {
        const cur = prev[engId];
        return { ...prev, [engId]: { ...cur, lastSaved: now, projects: cur.projects.map((p) => (synced.has(p.id) ? { ...p, hasrSynced: true } : p)) } };
      });
      setDirty((d) => ({ ...d, [engId]: false }));
      toast('success', 'تم الحفظ — أصبحت التحديثات مرئية للجميع', 1600);
      return true;
    } catch (e) {
      toast('error', /rate limit/i.test(e.message) ? 'الخادم مشغول مؤقتًا، انتظري نصف دقيقة وحاولي تاني.' : 'فشل الحفظ: ' + e.message, 6000);
      return false;
    }
  }, [toast]);
  saveRef.current = saveEngineer;

  const archiveProject = useCallback(async (engId, projId, by) => {
    try {
      await archiveProjectApi(engId, projId, by);
      setEngineers((prev) => ({ ...prev, [engId]: { ...prev[engId], projects: prev[engId].projects.filter((p) => p.id !== projId) } }));
      setHasr((h) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, v.filter((x) => x.id !== 'sync_' + projId)])));
      toast('success', 'تمت أرشفة المشروع وإخفاؤه من القوائم');
      return true;
    } catch (e) { toast('error', 'فشل حذف المشروع: ' + e.message, 6000); return false; }
  }, [toast]);

  /* ---------- engineers CRUD (roster) ---------- */
  const createEngineer = useCallback(async (teamId, info) => {
    const newId = teamId + 'e_' + Date.now().toString(36);
    const ok = await updateTeams((ts) => {
      ts.find((t) => t.id === teamId).engineers.push({ id: newId, name: info.name, companyEmail: info.companyEmail || '', phoneNumber: info.phoneNumber || '', employeeCode: info.employeeCode || '', photoData: null });
    });
    if (ok) await loadEngineer(newId).catch(() => {});
    return ok;
  }, [updateTeams, loadEngineer]);

  const deleteEngineer = useCallback(async (teamId, engId) => {
    const ok = await updateTeams((ts) => { const t = ts.find((x) => x.id === teamId); t.engineers = t.engineers.filter((e) => e.id !== engId); });
    if (ok) setEngineers((p) => { const n = { ...p }; delete n[engId]; return n; });
    return ok;
  }, [updateTeams]);

  /* ---------- scoped loading + refresh ---------- */
  const loadScoped = useCallback(async (session) => {
    const ts = teamsRef.current;
    await Promise.all(ts.filter((t) => t.type === 'hasr').map((t) => loadHasr(t.id)));
    if (session.role === 'dept') await loadMany(ts.flatMap((t) => t.engineers.map((e) => e.id)));
    else if (session.role === 'team') {
      const t = ts.find((x) => x.id === session.id);
      if (t && t.type !== 'hasr') await loadMany(t.engineers.map((e) => e.id));
    } else await loadEngineer(session.id, true);
  }, [loadHasr, loadMany, loadEngineer]);

  const refreshFor = useCallback(async (session, pathname) => {
    if (Object.values(dirtyRef.current).some(Boolean)) return; // مفيش clobber لتعديلات لسه متحفظتش
    const ts = teamsRef.current;
    await Promise.all(ts.filter((t) => t.type === 'hasr').map((t) => loadHasr(t.id)));
    if (session.role === 'engineer') return loadEngineer(session.id, true);
    if (session.role === 'team') {
      const t = ts.find((x) => x.id === session.id);
      return t && t.type !== 'hasr' ? loadMany(t.engineers.map((e) => e.id), true) : undefined;
    }
    const m = pathname.match(/^\/engineers\/([^/]+)/);
    if (m) return loadEngineer(decodeURIComponent(m[1]), true);
    return loadMany(ts.flatMap((t) => t.engineers.map((e) => e.id)), true);
  }, [loadHasr, loadEngineer, loadMany]);

  return (
    <DataCtx.Provider value={{
      status, init, teams, tasks, config, setConfig, deptManager, engineers, hasr, dirty,
      fieldLabel, outcomeLabel, reloadRoster, updateTeams, patchEngineerInfo,
      loadEngineer, loadMany, mutate, saveEngineer, archiveProject, createEngineer, deleteEngineer,
      loadHasr, saveHasr, loadScoped, refreshFor,
    }}>
      {children}
    </DataCtx.Provider>
  );
}

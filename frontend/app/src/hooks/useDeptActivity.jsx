import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useData } from './useData';
import { teamLabel } from '../utils/helpers';
import { GROUP, snapEngineer, snapHasr, diffEngineer, diffHasr, mergeEvents } from '../utils/activityDiff';

const K = { events: 'tender-dept-activity:events', snap: 'tender-dept-activity:snap', seen: 'tender-dept-activity:seen', start: 'tender-dept-activity:start' };
const POLL_MS = 45000;

const DEFAULT = {
  enabled: false, events: [], unseen: 0, seenAt: 0, startedAt: 0, lastCheck: 0, checking: false,
  markAllSeen() {}, clear() {}, checkNow() {},
};
const Ctx = createContext(DEFAULT);
export const useDeptActivity = () => useContext(Ctx);

const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* الـ quota */ } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const taskName = (t) => t.name ?? t.title ?? t.label ?? t.text ?? String(t.id);

export function DeptActivityProvider({ children }) {
  const { session } = useAuth();
  const { teams, engineers, hasr, tasks, dirty, loadMany, loadHasr, outcomeLabel } = useData();
  const { pathname } = useLocation();
  const enabled = session?.role === 'dept';

  const [events, setEvents] = useState(() => read(K.events, []));
  const [startedAt] = useState(() => { const s = read(K.start, 0); if (s) return s; const now = Date.now(); write(K.start, now); return now; });
  const [seenAt, setSeenAt] = useState(() => read(K.seen, 0) || startedAt);
  const [lastCheck, setLastCheck] = useState(0);
  const [checking, setChecking] = useState(false);

  const snapRef = useRef(null);
  if (snapRef.current === null) snapRef.current = read(K.snap, { eng: {}, hasr: {} });
  const objRef = useRef(new Map());     // آخر object عالجناه لكل مهندس (عشان ما نعيدش الشغل)
  const touched = useRef(new Set());    // مهندسين عدّلت عليهم أنا (مدير القسم): تعديلاتي مش إشعارات
  const busy = useRef(false);
  const latest = useRef({});
  latest.current = { teams, dirty, loadMany, loadHasr };

  const lab = useCallback((k) => outcomeLabel(k, k === 'won' ? 'فوز' : 'خسارة'), [outcomeLabel]);
  const tmap = useMemo(() => new Map(tasks.map((t) => [t.id, taskName(t)])), [tasks]);

  /* ---------- مقارنة بيانات المهندسين ---------- */
  useEffect(() => {
    if (!enabled) return;
    const snap = snapRef.current;
    const now = Date.now();
    const fresh = [];
    let changed = false;
    const ctx = { taskName: (id) => tmap.get(id) || 'مهمة', lab };

    teams.forEach((t) => t.engineers.forEach((e) => {
      const d = engineers[e.id];
      if (!d) return; // لسه ما اتحمّلش: مش معناها اتحذف
      const isDirty = !!dirty[e.id];
      if (objRef.current.get(e.id) === d && !isDirty && !touched.current.has(e.id)) return;
      objRef.current.set(e.id, d);

      const next = snapEngineer(d);
      const prev = snap.eng[e.id];
      const silent = !prev || isDirty || touched.current.has(e.id); // أول مرة، أو أنا اللي بعدّل
      if (isDirty) touched.current.add(e.id); else touched.current.delete(e.id);

      if (!silent) {
        const parsed = Date.parse(d.lastSaved);
        const at = Number.isFinite(parsed) && parsed <= now + 60000 ? parsed : now;
        diffEngineer(prev, next, ctx).forEach((ev, i) => fresh.push({
          ...ev, id: `${e.id}:${ev.projectId}:${ev.kind}:${now}:${i}`, group: GROUP[ev.kind],
          actorId: e.id, actorName: e.name, teamId: t.id, teamName: teamLabel(t), at, detectedAt: now,
        }));
      }
      if (!prev || !same(prev, next)) { snap.eng[e.id] = next; changed = true; }
    }));

    if (changed) write(K.snap, snap);
    if (fresh.length) setEvents((cur) => mergeEvents(cur, fresh));
  }, [enabled, teams, engineers, dirty, tmap, lab]);

  /* ---------- مقارنة قسم الحصر ---------- */
  useEffect(() => {
    if (!enabled) return;
    const snap = snapRef.current;
    const now = Date.now();
    const fresh = [];
    let changed = false;
    const onHasrPage = pathname.startsWith('/hasr'); // لو أنا على صفحة الحصر، تعديلاتي مش إشعارات

    teams.filter((t) => t.type === 'hasr').forEach((t) => {
      const list = hasr[t.id];
      if (!list) return;
      const next = snapHasr(list);
      const prev = snap.hasr[t.id];
      if (prev && !onHasrPage) {
        diffHasr(prev, next).forEach((ev, i) => fresh.push({
          ...ev, id: `hasr:${t.id}:${ev.projectId}:${ev.kind}:${now}:${i}`, group: GROUP[ev.kind],
          actorId: null, actorName: `قسم ${t.label || 'الحصر'}`, teamId: t.id, teamName: teamLabel(t), at: now, detectedAt: now,
        }));
      }
      if (!prev || !same(prev, next)) { snap.hasr[t.id] = next; changed = true; }
    });

    if (changed) write(K.snap, snap);
    if (fresh.length) setEvents((cur) => mergeEvents(cur, fresh));
  }, [enabled, teams, hasr, pathname]);

  useEffect(() => { if (enabled) write(K.events, events); }, [events, enabled]);

  /* ---------- فحص دوري ---------- */
  const poll = useCallback(async () => {
    if (busy.current || document.hidden) return;
    const { teams: ts, dirty: dr, loadMany: lm, loadHasr: lh } = latest.current;
    if (Object.values(dr).some(Boolean)) return; // مفيش clobber لتعديلات لسه متحفظتش
    busy.current = true;
    setChecking(true);
    try {
      await lm(ts.flatMap((t) => t.engineers.map((e) => e.id)), true);
      await Promise.all(ts.filter((t) => t.type === 'hasr').map((t) => lh(t.id)));
      setLastCheck(Date.now());
    } catch { /* هنحاول في الدورة الجاية */ } finally {
      busy.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(poll, POLL_MS);
    const onVis = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis); };
  }, [enabled, poll]);

  const markAllSeen = useCallback(() => { const t = Date.now(); setSeenAt(t); write(K.seen, t); }, []);
  const clear = useCallback(() => { setEvents([]); write(K.events, []); }, []);
  const unseen = useMemo(() => events.filter((e) => e.detectedAt > seenAt).length, [events, seenAt]);

  const value = useMemo(
    () => ({ enabled, events, unseen, seenAt, startedAt, lastCheck, checking, markAllSeen, clear, checkNow: poll }),
    [enabled, events, unseen, seenAt, startedAt, lastCheck, checking, markAllSeen, clear, poll],
  );

  return <Ctx.Provider value={enabled ? value : DEFAULT}>{children}</Ctx.Provider>;
}
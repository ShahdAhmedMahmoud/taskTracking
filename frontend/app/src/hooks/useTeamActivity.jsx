import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useData } from './useData';
import { teamLabel } from '../utils/helpers';
import { diffEngineer, diffHasr, GROUP, mergeEvents, snapEngineer, snapHasr } from '../utils/activityDiff';

const DEFAULT = { enabled: false, events: [], unseen: 0, checking: false, markAllSeen() {}, checkNow() {} };
const Ctx = createContext(DEFAULT);
export const useTeamActivity = () => useContext(Ctx);

const read = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function TeamActivityProvider({ children }) {
  const { session } = useAuth();
  const { teams, engineers, hasr, tasks, dirty, loadMany, loadHasr, outcomeLabel } = useData();
  const team = teams.find((item) => item.id === session?.id && item.type !== 'hasr');
  const teamId = session?.role === 'team' ? team?.id : null;
  const enabled = !!teamId;
  const [events, setEvents] = useState([]);
  const [seenAt, setSeenAt] = useState(0);
  const [readyFor, setReadyFor] = useState(null);
  const [checking, setChecking] = useState(false);
  const snapRef = useRef({});
  const hasrSnapRef = useRef({});
  const busy = useRef(false);

  const eventsKey = teamId ? `tender-team-activity:${teamId}:events` : '';
  const snapKey = teamId ? `tender-team-activity:${teamId}:snapshot` : '';
  const seenKey = teamId ? `tender-team-activity:${teamId}:seen` : '';

  useEffect(() => {
    if (!teamId) { setEvents([]); setSeenAt(0); setReadyFor(null); return; }
    snapRef.current = read(snapKey, {});
    hasrSnapRef.current = read(`${snapKey}:hasr`, {});
    setEvents(read(eventsKey, []));
    setSeenAt(read(seenKey, 0));
    setReadyFor(teamId);
  }, [teamId, eventsKey, snapKey, seenKey]);

  const taskNames = useMemo(() => new Map(tasks.map((item) => [item.id, item.title || item.name || `مهمة ${item.id}`])), [tasks]);
  const labelOutcome = useCallback((key) => outcomeLabel(key, key === 'won' ? 'فوز' : key === 'lost' ? 'خسارة' : 'معلق'), [outcomeLabel]);
  useEffect(() => {
    if (!enabled || readyFor !== teamId || !team) return;
    const members = team.engineers;
    if (!members.length || members.some((member) => !engineers[member.id])) return;
    const snap = snapRef.current;
    const fresh = [];
    let changed = false;
    members.forEach((member) => {
      const data = engineers[member.id];
      if (dirty[member.id]) return;
      const next = snapEngineer(data);
      const prev = snap[member.id];
      if (prev && !same(prev, next)) {
        const at = Date.now();
        diffEngineer(prev, next, { taskName: (id) => taskNames.get(Number(id)) || taskNames.get(id) || 'مهمة', lab: labelOutcome })
          .forEach((event, index) => fresh.push({
            ...event,
            id: `${member.id}:${event.projectId}:${event.kind}:${at}:${index}`,
            actorId: member.id,
            actorName: member.name,
            teamId,
            teamName: teamLabel(team),
            at,
            detectedAt: at,
          }));
      }
      if (!prev || !same(prev, next)) { snap[member.id] = next; changed = true; }
    });
    if (changed) { snapRef.current = snap; write(snapKey, snap); }
    if (fresh.length) setEvents((current) => mergeEvents(current, fresh, 250));
  }, [enabled, readyFor, teamId, team, engineers, dirty, taskNames, labelOutcome, snapKey]);

  useEffect(() => {
    if (!enabled || readyFor !== teamId) return;
    const snap = hasrSnapRef.current;
    const fresh = [];
    let changed = false;
    teams.filter((item) => item.type === 'hasr').forEach((hasrTeam) => {
      const list = hasr[hasrTeam.id];
      if (!list) return;
      const next = snapHasr(list);
      const prev = snap[hasrTeam.id];
      if (prev) {
        const at = Date.now();
        diffHasr(prev, next).forEach((event, index) => fresh.push({
          ...event,
          id: `hasr:${hasrTeam.id}:${event.projectId}:${event.kind}:${at}:${index}`,
          group: GROUP[event.kind], actorId: null,
          actorName: teamLabel(hasrTeam), teamId, teamName: teamLabel(team), at, detectedAt: at,
        }));
      } else {
        // The earlier team feed did not snapshot Hasr. Surface current completions once
        // during migration instead of silently losing the first completed status.
        const at = Date.now();
        Object.entries(next).forEach(([id, state], index) => {
          const [hasWork, done, , , name] = state.split('\u0001');
          if (done !== '1') return;
          fresh.push({
            id: `hasr:${hasrTeam.id}:${id.replace(/^sync_/, '')}:hasr_done:baseline`,
            kind: 'hasr_done', group: GROUP.hasr_done,
            projectId: id.replace(/^sync_/, ''), project: name || 'مشروع بدون اسم',
            title: 'تم الحصر للمشروع', items: hasWork === '1' ? ['تم الحصر'] : [],
            actorId: null, actorName: teamLabel(hasrTeam), teamId, teamName: teamLabel(team), at: at + index, detectedAt: at + index,
          });
        });
      }
      if (!prev || !same(prev, next)) { snap[hasrTeam.id] = next; changed = true; }
    });
    if (changed) { hasrSnapRef.current = snap; write(`${snapKey}:hasr`, snap); }
    if (fresh.length) setEvents((current) => mergeEvents(current, fresh, 250));
  }, [enabled, readyFor, teamId, team, teams, hasr, snapKey]);

  useEffect(() => { if (enabled && readyFor === teamId) write(eventsKey, events); }, [enabled, readyFor, teamId, eventsKey, events]);
  useEffect(() => { if (enabled && readyFor === teamId) write(seenKey, seenAt); }, [enabled, readyFor, teamId, seenKey, seenAt]);

  const markAllSeen = useCallback(() => {
    const time = Date.now();
    write(seenKey, time);
    setSeenAt(time);
  }, [seenKey]);
  const checkNow = useCallback(async () => {
    if (!enabled || !team || busy.current) return;
    busy.current = true;
    setChecking(true);
    try {
      await Promise.all([
        loadMany(team.engineers.map((member) => member.id), true),
        ...teams.filter((item) => item.type === 'hasr').map((item) => loadHasr(item.id)),
      ]);
    }
    finally { busy.current = false; setChecking(false); }
  }, [enabled, team, teams, loadMany, loadHasr]);

  useEffect(() => {
    if (!enabled || readyFor !== teamId) return undefined;
    const poll = () => {
      if (document.visibilityState !== 'visible' || Object.values(dirty).some(Boolean)) return;
      checkNow();
    };
    const timer = setInterval(poll, 45000);
    return () => clearInterval(timer);
  }, [enabled, readyFor, teamId, dirty, checkNow]);
  const unseen = useMemo(() => events.filter((event) => event.detectedAt > seenAt).length, [events, seenAt]);
  const value = useMemo(() => ({ enabled, events, unseen, seenAt, checking, markAllSeen, checkNow }), [enabled, events, unseen, seenAt, checking, markAllSeen, checkNow]);
  return <Ctx.Provider value={enabled ? value : DEFAULT}>{children}</Ctx.Provider>;
}

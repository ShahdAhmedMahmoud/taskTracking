import { byDelivery } from './helpers';

export const pctOf = (d, t) => (t ? Math.round((d / t) * 1000) / 10 : 0);

export function projectStats(project, tasks) {
  let done = 0, total = 0;
  tasks.forEach((t) => {
    const st = project.tasks?.[t.id];
    if (st?.applicable) { total++; if (st.status) done++; }
  });
  (project.customTasks || []).forEach((c) => { if (c.applicable) { total++; if (c.status) done++; } });
  return { done, total, remaining: total - done, pct: pctOf(done, total) };
}

export function engineerStats(data, tasks) {
  let done = 0, total = 0;
  (data?.projects || []).forEach((p) => { const s = projectStats(p, tasks); done += s.done; total += s.total; });
  return { done, total, remaining: total - done, pct: pctOf(done, total) };
}

export function engineerSummary(data) {
  const projects = data?.projects || [];
  const finished = projects.filter((p) => p.finished);
  return {
    totalProjects: projects.length, finished: finished.length, ongoing: projects.length - finished.length,
    won: finished.filter((p) => p.outcome === 'won').length, lost: finished.filter((p) => p.outcome === 'lost').length,
  };
}

export function teamStats(team, engineers, tasks) {
  let done = 0, total = 0;
  team.engineers.forEach((e) => { const s = engineerStats(engineers[e.id], tasks); done += s.done; total += s.total; });
  return { done, total, remaining: total - done, pct: pctOf(done, total) };
}

export function getAllProjects(teams, engineers, tasks) {
  const list = [];
  teams.forEach((t) => t.engineers.forEach((e) => {
    engineers[e.id]?.projects?.forEach((p) => list.push({ team: t, eng: e, project: p, stats: projectStats(p, tasks) }));
  }));
  return list.sort(byDelivery);
}
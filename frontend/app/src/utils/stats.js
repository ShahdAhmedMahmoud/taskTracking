import { byDelivery } from './helpers';
import { projectProgress } from './dashboardData';
export const pctOf = (d, t) => (t ? Math.round((d / t) * 1000) / 10 : 0);

export function taskDurationHours(task) {
  if (!task?.startDate || !task?.startTime || !task?.dueDate || !task?.dueTime) return 0;
  const hours = (new Date(`${task.dueDate}T${task.dueTime}`) - new Date(`${task.startDate}T${task.startTime}`)) / 3600000;
  return Number.isFinite(hours) && hours >= 0 ? Math.round(hours * 100) / 100 : 0;
}

export function projectStats(project, tasks) {
  const r = projectProgress(project, tasks);
  const completedHours = [
    ...Object.values(project?.tasks || {}),
    ...(project?.customTasks || []),
  ].filter((task) => task?.applicable && task?.status).reduce((sum, task) => sum + taskDurationHours(task), 0);
  return { ...r, remaining: r.total - r.done, completedHours };
}
// export function projectStats(project, tasks) {
//   let done = 0, total = 0;
//   tasks.forEach((t) => {
//     const st = project.tasks?.[t.id];
//     if (st?.applicable) { total++; if (st.status) done++; }
//   });
//   (project.customTasks || []).forEach((c) => { if (c.applicable) { total++; if (c.status) done++; } });
//   return { done, total, remaining: total - done, pct: pctOf(done, total) };
// }

export function engineerStats(data, tasks) {
  let done = 0, total = 0, completedHours = 0;
  (data?.projects || []).forEach((p) => { const s = projectStats(p, tasks); done += s.done; total += s.total; completedHours += s.completedHours; });
  return { done, total, remaining: total - done, pct: pctOf(done, total), completedHours };
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
  let done = 0, total = 0, completedHours = 0;
  team.engineers.forEach((e) => { const s = engineerStats(engineers[e.id], tasks); done += s.done; total += s.total; completedHours += s.completedHours; });
  return { done, total, remaining: total - done, pct: pctOf(done, total), completedHours };
}

export function getAllProjects(teams, engineers, tasks) {
  const list = [];
  teams.forEach((t) => t.engineers.forEach((e) => {
    engineers[e.id]?.projects?.forEach((p) => list.push({ team: t, eng: e, project: p, stats: projectStats(p, tasks) }));
  }));
  return list.sort(byDelivery);
}

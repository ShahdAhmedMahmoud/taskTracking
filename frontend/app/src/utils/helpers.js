export const mainTeams = (teams) => teams.filter((t) => (t.division || 'main') === 'main');
export const teamLabel = (t) => (t.label ? `فريق ${t.label}` : `فريق ${String(t.id).slice(1)}`);
export const safePhoto = (v) => (typeof v === 'string' && v.startsWith('data:image/') && v.length <= 2800000 ? v : '');
export const byDelivery = (a, b) => {
  const da = a.project?.deliveryDate ?? a.deliveryDate;
  const db = b.project?.deliveryDate ?? b.deliveryDate;
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return new Date(da) - new Date(db);
};

export const homeFor = (session, teams = []) => {
  if (!session) return '/login';
  if (session.role === 'dept') return '/';
  if (session.role === 'engineer') return '/my-tasks';
  const t = teams.find((x) => x.id === session.id);
  return t?.type === 'hasr' ? `/hasr/${session.id}` : '/team';
};

export const normField = (x) => ({
  id: x.id || x.Id || '',
  label: x.label || x.Label || '',
  type: x.type || x.Type || 'text',
  required: !!(x.required ?? x.IsRequired ?? false),
  isActive: x.isActive ?? x.IsActive ?? true,
  sortOrder: x.sortOrder ?? x.SortOrder ?? 0,
});

export const newTaskState = (applicable) => ({ status: false, review: false, applicable: !!applicable, dueDate: '', department: '', notes: '' });

export function makeNewProject(tasks, config, { name = '', deliveryDate = '', inquiryDate = '' } = {}) {
  const t = {};
  tasks.forEach((x) => (t[x.id] = newTaskState(x.applicable)));
  return {
    id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
    name: name || config?.projectDefaults?.name || '',
    deliveryDate: deliveryDate || config?.projectDefaults?.deliveryDate || '',
    inquiryDate: inquiryDate || config?.projectDefaults?.inquiryDate || '',
    tasks: t, customTasks: [], hasrSynced: false, finished: false, outcome: null,
  };
}

export function normalizeEngineer(data, tasks) {
  data.projects = data.projects || [];
  data.projects.forEach((p) => {
    p.tasks = p.tasks || {};
    p.customTasks = p.customTasks || [];
    if (typeof p.hasrSynced !== 'boolean') p.hasrSynced = false;
    if (typeof p.finished !== 'boolean') p.finished = false;
    if (p.outcome !== 'won' && p.outcome !== 'lost') p.outcome = null;
    tasks.forEach((t) => {
      if (!p.tasks[t.id]) p.tasks[t.id] = newTaskState(t.applicable);
      if (typeof p.tasks[t.id].notes !== 'string') p.tasks[t.id].notes = '';
    });
    p.customTasks.forEach((c) => { if (typeof c.notes !== 'string') c.notes = ''; });
  });
  return data;
}

export function hasrStatusForProject(projectId, hasrTeam, hasr) {
  if (!hasrTeam) return null;
  const item = (hasr[hasrTeam.id] || []).find((x) => x.id === 'sync_' + projectId);
  if (!item) return { tone: 'slate', icon: '⏳', text: 'المشروع لسه متزامنش مع قسم الحصر — احفظ التغييرات أولاً' };
  const notes = item.hasrNotes || '';
  if (item.hasWork == null) return { tone: 'slate', icon: '⏳', text: 'لم يُحدد بعد — في انتظار قسم الحصر', notes };
  if (item.hasWork === false) return { tone: 'rose', icon: '✗', text: 'لا يوجد عمل حصر لهذا المشروع', notes };
  if (item.hasrDone) return { tone: 'emerald', icon: '✅', text: 'تم الحصر والانتهاء من الأعمال', notes };
  let text = 'جاري العمل على الحصر';
  if (item.hasrDueDate) text += ` — ميعاد تسليم الحصر: ${new Date(item.hasrDueDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  return { tone: 'amber', icon: '🔧', text, notes };
}
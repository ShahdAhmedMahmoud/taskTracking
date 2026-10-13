import { useSyncExternalStore } from 'react';
import { daysLeft, n } from '../utils/dashboardData';
import { taskId, taskName, isTemplateTask } from '../utils/taskTemplates';

/**
 * تنبيهات المهندس محليًا، إلى أن تُصدرها خدمة الإشعارات على الخادم:
 *  1) مواعيد قربت: تسليم مشروع أو نهاية مهمة باقي عليها يوم واحد أو أقل (أو متأخرة)
 *  2) مدير القسم / مدير الفريق: أضاف مشروعًا أو كتب ملحوظة
 *  3) فريق الحصر: أكمل حصر مشروع المهندس
 *
 * بتعتمد على علامات بتتكتب جوه المشروع نفسه:
 *   createdBy / createdByRole / createdAt      ← لما حد يضيف مشروع
 *   noteBy / noteByRole / noteAt               ← لما حد يكتب ملحوظة المشروع
 *   حالة hasrDone في سجل الحصر                  ← عند اكتمال الحصر
 */
const KEY = (id) => `tender-eng-alerts:v1:${id}`;
const WINDOW_DAYS = 1; // التنبيه لما يفضل يوم أو أقل
const ROLE = { dept: 'مدير القسم', team: 'مدير الفريق' };
const short = (s, m = 110) => { const t = String(s ?? '').trim(); return t.length > m ? `${t.slice(0, m)}…` : t; };
const isMgr = (r) => r === 'dept' || r === 'team';

let engId = null;
let persisted = { known: null, events: [], read: {} };
let deadlines = [];
let view = { items: [], unread: 0 };
const listeners = new Set();

const load = (id) => { try { return JSON.parse(localStorage.getItem(KEY(id))) || null; } catch { return null; } };
const save = () => { try { localStorage.setItem(KEY(engId), JSON.stringify(persisted)); } catch { /* التخزين مقفول */ } };

function makeView() {
  const items = [...deadlines, ...persisted.events].map((a) => ({ ...a, read: !!persisted.read[a.id] }));
  items.sort((a, b) => {
    const da = a.kind === 'deadline'; const db = b.kind === 'deadline';
    if (da !== db) return da ? -1 : 1;
    return da ? a.k - b.k : new Date(b.at) - new Date(a.at);
  });
  return { items, unread: items.filter((x) => !x.read).length };
}
function emit() { view = makeView(); listeners.forEach((l) => l()); }

export function initAlerts(id) {
  if (engId === id) return;
  engId = id;
  persisted = load(id) || { known: null, events: [], read: {} };
  deadlines = [];
  emit();
}

/* ---------- المواعيد القريبة ---------- */
const whenText = (k) => (k < 0 ? `متأخرة ${n(-k)} يوم` : k === 0 ? 'آخر ميعاد النهارده' : 'باقي يوم واحد (بكرة)');
const dueStatus = (dueDate, dueTime) => {
  if (!dueDate) return null;
  if (!dueTime) {
    const days = daysLeft(dueDate);
    return days === null || days > WINDOW_DAYS ? null : { days, text: whenText(days) };
  }
  const remaining = new Date(`${dueDate}T${dueTime}`).getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining > WINDOW_DAYS * 86400000) return null;
  if (remaining <= 0) return { days: Math.floor(remaining / 86400000), text: 'انتهى موعد المهمة' };
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.ceil((remaining % 3600000) / 60000);
  return { days: 0, text: hours ? `متبقي ${n(hours)} ساعة` : `متبقي ${n(minutes)} دقيقة` };
};

function buildDeadlines(projects, tasks) {
  const out = [];
  const push = (p, key, title, dueDate, dueTime = '') => {
    const due = dueStatus(dueDate, dueTime);
    if (!due) return;
    const { days, text } = due;
    out.push({
      id: `dl:${p.id}:${key}:${dueDate}:${dueTime || ''}`, kind: 'deadline', level: days < 0 || text === 'انتهى موعد المهمة' ? 'danger' : 'warn', k: days,
      title, message: `${p.name || 'مشروع بدون اسم'} · ${text}${dueTime ? ` (${dueTime})` : ''}`, at: new Date().toISOString(), projectId: p.id,
    });
  };
  projects.filter((p) => !p.finished).forEach((p) => {
    if (p.deliveryDate) push(p, 'project', `تسليم المشروع «${p.name || 'بدون اسم'}»`, p.deliveryDate);
    tasks.forEach((t) => {
      const st = p.tasks?.[taskId(t)];
      if (st?.applicable && !st.status && st.dueDate) push(p, `t${taskId(t)}`, `نهاية مهمة: ${taskName(t)}`, st.dueDate, st.dueTime);
    });
    (Array.isArray(p.customTasks) ? p.customTasks : []).filter((c) => c.applicable !== false).forEach((c) => {
      if (!c.status && c.dueDate) push(p, `c${c.id}`, `نهاية مهمة: ${c.title}`, c.dueDate, c.dueTime);
    });
  });
  return out;
}

/* ---------- بيتنادى مع كل جلب لبيانات المهندس ---------- */
export function processEngineerData(data, tasks = [], hasrItems = []) {
  if (!engId || !data) return;
  const projects = Array.isArray(data.projects) ? data.projects : [];
  deadlines = buildDeadlines(projects, tasks);

  const first = !persisted.known;                       // أول مرة: نعمل baseline من غير ما نغرق المهندس بإشعارات قديمة
  const known = persisted.known || { projectIds: [], noteAt: {}, hasrDone: {} };
  const recent = (iso) => iso && Date.now() - new Date(iso).getTime() < 3 * 86400000;
  const fresh = [];

  projects.forEach((p) => {
    if (!known.projectIds.includes(p.id) && isMgr(p.createdByRole) && (!first || recent(p.createdAt))) {
      fresh.push({
        id: `added:${p.id}`, kind: 'project_added', level: 'info', at: p.createdAt || new Date().toISOString(), projectId: p.id,
        title: `تمت إضافة مشروع جديد: ${p.name || 'بدون اسم'}`,
        message: `بواسطة ${p.createdBy || ROLE[p.createdByRole]} (${ROLE[p.createdByRole]})${p.deliveryDate ? ` · التسليم ${p.deliveryDate}` : ''}`,
      });
    }
    if (p.noteAt && isMgr(p.noteByRole) && p.noteAt > (known.noteAt[p.id] || '') && (!first || recent(p.noteAt))) {
      fresh.push({
        id: `note:${p.id}:${p.noteAt}`, kind: 'project_note', level: 'info', at: p.noteAt, projectId: p.id,
        title: `ملحوظة جديدة على «${p.name || 'بدون اسم'}»`,
        message: `${p.noteBy || ROLE[p.noteByRole]} (${ROLE[p.noteByRole]}): ${short(p.note)}`,
      });
    }
  });

  const projectBySyncId = new Map(projects.map((p) => [`sync_${p.id}`, p]));
  const hasrDone = {};
  (Array.isArray(hasrItems) ? hasrItems : []).forEach((item) => {
    const project = projectBySyncId.get(item.id);
    if (!project) return;
    hasrDone[project.id] = !!item.hasrDone;
    if (item.hasrDone && known.hasrDone?.[project.id] !== true) {
      const at = new Date().toISOString();
      fresh.push({
        id: `hasr_done:${project.id}:${at}`, kind: 'hasr_done', level: 'success', at, projectId: project.id,
        title: `اكتمل الحصر لمشروع «${project.name || 'بدون اسم'}»`,
        message: 'تم تسجيل اكتمال الحصر بواسطة فريق الحصر.',
      });
    }
  });

  const have = new Set(persisted.events.map((e) => e.id));
  persisted.events = [...fresh.filter((e) => !have.has(e.id)), ...persisted.events].slice(0, 100);
  persisted.known = {
    projectIds: projects.map((p) => p.id),
    noteAt: Object.fromEntries(projects.filter((p) => p.noteAt).map((p) => [p.id, p.noteAt])),
    hasrDone,
  };

  const alive = new Set([...deadlines, ...persisted.events].map((a) => a.id));
  persisted.read = Object.fromEntries(Object.keys(persisted.read).filter((id) => alive.has(id)).map((id) => [id, true]));
  save(); emit();
}

export function markAlertsRead(ids) {
  const all = ids === 'all' ? view.items.map((x) => x.id) : ids;
  all.forEach((id) => { persisted.read[id] = true; });
  save(); emit();
}

export function useEngineerAlerts() {
  const v = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => view);
  return { ...v, markIds: (ids) => markAlertsRead(ids), markAll: () => markAlertsRead('all') };
}

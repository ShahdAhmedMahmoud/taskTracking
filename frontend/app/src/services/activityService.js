import { request, store, wait, USE_MOCK } from './request';

/**
 * عقد الـ API الكامل في BACKEND-SPEC.md قسم 2.
 * في وضع الـ mock بنولّد أحداث تجريبية ثابتة من أسماء المهندسين الحقيقية (people) عشان تقدري تصممي وتجربي.
 */

/* ---------- وصف الأحداث (الواجهة هي اللي بتبني الجملة من type + meta) ---------- */
export const EVENT_GROUPS = [
  ['all', 'الكل'],
  ['tasks', 'المهام'],
  ['projects', 'المشاريع'],
  ['files', 'الملفات'],
  ['archive', 'الأرشيف'],
  ['people', 'الفرق والحسابات'],
];

const T = {
  'task.completed': { group: 'tasks', icon: 'check', tone: 'ok' },
  'task.reopened': { group: 'tasks', icon: 'restore', tone: 'neutral' },
  'task.reviewed': { group: 'tasks', icon: 'check', tone: 'info' },
  'task.applicability': { group: 'tasks', icon: 'list', tone: 'info' },
  'task.updated': { group: 'tasks', icon: 'edit', tone: 'info' },
  'task.custom_added': { group: 'tasks', icon: 'plus', tone: 'info' },
  'task.custom_removed': { group: 'tasks', icon: 'trash', tone: 'neutral' },
  'project.created': { group: 'projects', icon: 'folder', tone: 'info' },
  'project.updated': { group: 'projects', icon: 'edit', tone: 'info' },
  'project.finished': { group: 'projects', icon: 'flag', tone: 'ok' },
  'project.reopened': { group: 'projects', icon: 'restore', tone: 'neutral' },
  'project.outcome': { group: 'projects', icon: 'trophy', tone: 'ok' },
  'project.template_applied': { group: 'projects', icon: 'layers', tone: 'info' },
  'hasr.updated': { group: 'projects', icon: 'list', tone: 'info' },
  'project.archived': { group: 'archive', icon: 'archive', tone: 'danger' },
  'project.restored': { group: 'archive', icon: 'restore', tone: 'ok' },
  'project.deleted': { group: 'archive', icon: 'trash', tone: 'danger' },
  'file.uploaded': { group: 'files', icon: 'file', tone: 'info' },
  'file.deleted': { group: 'files', icon: 'trash', tone: 'neutral' },
  'profile.updated': { group: 'people', icon: 'user', tone: 'neutral' },
  'engineer.added': { group: 'people', icon: 'user', tone: 'info' },
  'engineer.removed': { group: 'people', icon: 'user', tone: 'danger' },
  'engineer.moved': { group: 'people', icon: 'user', tone: 'neutral' },
  'team.created': { group: 'people', icon: 'user', tone: 'info' },
  'team.deleted': { group: 'people', icon: 'user', tone: 'danger' },
  'team.manager_changed': { group: 'people', icon: 'user', tone: 'neutral' },
  'auth.password_changed': { group: 'people', icon: 'user', tone: 'neutral' },
  'auth.password_reset': { group: 'people', icon: 'user', tone: 'neutral' },
};

export const eventMeta = (type) => T[type] || { group: 'projects', icon: 'bell', tone: 'neutral' };
export const typesOfGroup = (g) => (g === 'all' ? [] : Object.keys(T).filter((k) => T[k].group === g));

const OUT = { won: 'فوز', lost: 'خسارة' };
const num = (v) => new Intl.NumberFormat('ar-EG').format(v);

/** جمل محايدة (من غير تذكير/تأنيث) — اسم الشخص بيظهر في سطر منفصل */
export function describeEvent(e) {
  const m = e.meta || {};
  switch (e.type) {
    case 'task.completed': return { title: m.count > 1 ? `إنجاز ${num(m.count)} مهام` : 'إنجاز مهمة', detail: m.count > 1 ? '' : m.taskTitle };
    case 'task.reopened': return { title: 'إعادة فتح مهمة', detail: m.taskTitle };
    case 'task.reviewed': return { title: 'مراجعة مهمة', detail: m.taskTitle };
    case 'task.applicability': return { title: 'تعديل المهام المختارة للمشروع', detail: m.included != null ? `${num(m.included)} مضافة · ${num(m.excluded || 0)} مستبعدة` : '' };
    case 'task.updated': return { title: 'تعديل بيانات مهمة', detail: m.taskTitle };
    case 'task.custom_added': return { title: 'إضافة مهمة مخصصة', detail: m.taskTitle };
    case 'task.custom_removed': return { title: 'حذف مهمة مخصصة', detail: m.taskTitle };
    case 'project.created': return { title: 'إضافة مشروع جديد', detail: '' };
    case 'project.updated': return { title: 'تعديل بيانات المشروع', detail: '' };
    case 'project.finished': return { title: 'تسليم المشروع', detail: m.remaining > 0 ? `تم التسليم مع ${num(m.remaining)} مهام غير مكتملة` : 'بعد إكمال كل المهام' };
    case 'project.reopened': return { title: 'إعادة فتح المشروع', detail: '' };
    case 'project.outcome': return { title: `تسجيل نتيجة العطاء: ${OUT[m.to] || 'بدون نتيجة'}`, detail: '' };
    case 'project.template_applied': return { title: 'تطبيق قالب المهام', detail: m.templateName ? `${m.templateName} · ${num(m.selected)} من ${num(m.total)} مهمة` : '' };
    case 'hasr.updated': return { title: 'تحديث من قسم الحصر', detail: '' };
    case 'project.archived': return { title: 'أرشفة مشروع', detail: m.reason || '' };
    case 'project.restored': return { title: 'استرجاع مشروع من الأرشيف', detail: '' };
    case 'project.deleted': return { title: 'حذف مشروع نهائيًا', detail: '' };
    case 'file.uploaded': return { title: 'رفع ملف', detail: m.name };
    case 'file.deleted': return { title: 'حذف ملف', detail: m.name };
    case 'profile.updated': return { title: 'تعديل البروفايل', detail: '' };
    case 'engineer.added': return { title: 'إضافة مهندس للفريق', detail: '' };
    case 'engineer.removed': return { title: 'حذف مهندس', detail: '' };
    case 'engineer.moved': return { title: 'نقل مهندس بين الفرق', detail: '' };
    case 'team.created': return { title: 'إنشاء فريق', detail: '' };
    case 'team.deleted': return { title: 'حذف فريق', detail: '' };
    case 'team.manager_changed': return { title: 'تغيير مدير الفريق', detail: '' };
    case 'auth.password_changed': return { title: 'تغيير كلمة المرور', detail: '' };
    case 'auth.password_reset': return { title: 'إعادة تعيين كلمة المرور', detail: '' };
    default: return { title: e.message || 'نشاط جديد', detail: '' };
  }
}

/* ---------- Mock ---------- */
const READ_KEY = 'mock-activity-read';
const readState = () => store.get(READ_KEY, { all: null, ids: [] });
const isRead = (e, st) => st.ids.includes(e.id) || (st.all && new Date(e.createdAt) <= new Date(st.all));

const rng = (seed) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const PROJECTS = ['مجمع سكني — القاهرة الجديدة', 'مبنى إداري — العاصمة', 'مخازن لوجستية — العاشر', 'فيلات الساحل الشمالي', 'مستشفى تخصصي — أكتوبر'];
const TASK_TITLES = ['دراسة كراسة الشروط', 'حصر الكميات', 'عروض أسعار الموردين', 'جدول الأعمال الزمني', 'تحليل المخاطر', 'مراجعة الرسومات'];
const MIX = ['task.completed', 'task.completed', 'task.completed', 'task.completed', 'task.updated', 'task.reviewed', 'project.created', 'project.finished', 'project.outcome', 'file.uploaded', 'file.uploaded', 'project.archived', 'project.restored', 'profile.updated', 'hasr.updated', 'task.applicability', 'project.updated'];

let mockCache = { sig: '', items: [] };
function mockEvents(people) {
  const sig = people.map((p) => p.engineerId).join('|');
  if (mockCache.sig === sig) return mockCache.items;
  const r = rng(11);
  const pool = people.length ? people : [{ engineerId: 'x', name: 'مهندس تجريبي', teamId: 't1', teamName: 'فريق 1' }];
  const now = Date.now();
  let ts = now - 4 * 60000;
  const items = Array.from({ length: 70 }, (_, i) => {
    const p = pool[Math.floor(r() * pool.length)];
    const type = MIX[Math.floor(r() * MIX.length)];
    ts -= Math.floor((r() * 55 + 3) * 60000 * (i > 14 ? 6 : 1));
    const project = PROJECTS[Math.floor(r() * PROJECTS.length)];
    const meta = {};
    if (type.startsWith('task')) { meta.taskTitle = TASK_TITLES[Math.floor(r() * TASK_TITLES.length)]; if (type === 'task.completed') meta.count = r() > 0.6 ? Math.floor(r() * 4) + 2 : 1; if (type === 'task.applicability') { meta.included = 28; meta.excluded = 12; } }
    if (type === 'project.finished') { meta.remaining = r() > 0.5 ? Math.floor(r() * 5) + 1 : 0; }
    if (type === 'project.outcome') meta.to = r() > 0.45 ? 'won' : 'lost';
    if (type === 'file.uploaded') meta.name = ['جدول الكميات.xlsx', 'العرض الفني.pdf', 'مخطط الموقع.png'][Math.floor(r() * 3)];
    return { id: String(9000 - i), type, createdAt: new Date(ts).toISOString(), updatedAt: new Date(ts).toISOString(), actor: { engineerId: p.engineerId, name: p.name, role: 'engineer' }, team: { id: p.teamId, name: p.teamName }, project: type.startsWith('profile') ? null : { id: `demo_${i % 5}`, name: project }, meta };
  });
  mockCache = { sig, items };
  return items;
}

const withRead = (items) => { const st = readState(); return items.map((e) => ({ ...e, readAt: isRead(e, st) ? e.createdAt : null })); };

export const activityService = {
  async list({ types = [], teamId, engineerId, q = '', from, unreadOnly = false, cursor, limit = 30, people = [] } = {}) {
    if (USE_MOCK) {
      await wait(200);
      const needle = q.trim().toLowerCase();
      let all = withRead(mockEvents(people)).filter((e) => (!types.length || types.includes(e.type)) && (!teamId || e.team?.id === teamId) && (!engineerId || e.actor?.engineerId === engineerId) && (!from || new Date(e.createdAt) >= new Date(from)) && (!unreadOnly || !e.readAt));
      if (needle) all = all.filter((e) => `${e.actor?.name} ${e.project?.name || ''} ${describeEvent(e).title}`.toLowerCase().includes(needle));
      const start = Number(cursor) || 0;
      const unread = withRead(mockEvents(people)).filter((e) => !e.readAt).length;
      return { items: all.slice(start, start + limit), nextCursor: start + limit < all.length ? String(start + limit) : null, unread };
    }
    const p = new URLSearchParams();
    if (types.length) p.set('types', types.join(','));
    if (teamId) p.set('teamId', teamId);
    if (engineerId) p.set('engineerId', engineerId);
    if (q) p.set('q', q);
    if (from) p.set('from', from);
    if (unreadOnly) p.set('unreadOnly', 'true');
    if (cursor) p.set('cursor', cursor);
    p.set('limit', String(limit));
    return request(`/api/dashboard/activity?${p}`);
  },

  async unreadCount({ people = [] } = {}) {
    if (USE_MOCK) return { unread: withRead(mockEvents(people)).filter((e) => !e.readAt).length };
    return request('/api/dashboard/activity/unread-count');
  },

  async markRead({ ids, all = false, people = [] } = {}) {
    if (USE_MOCK) {
      const st = readState();
      if (all) store.set(READ_KEY, { all: new Date().toISOString(), ids: [] });
      else store.set(READ_KEY, { ...st, ids: [...new Set([...st.ids, ...(ids || [])])] });
      return { unread: withRead(mockEvents(people)).filter((e) => !e.readAt).length };
    }
    return request('/api/dashboard/activity/read', { method: 'POST', body: all ? { all: true } : { ids } });
  },
};
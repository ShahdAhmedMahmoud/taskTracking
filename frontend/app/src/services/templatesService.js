import { request, store, wait, USE_MOCK } from './request';

/**
 * شكل البيانات (نفس BACKEND-SPEC.md قسم 3):
 *  list -> [{ id, code, name, description, department:{id,name}, taskCount, isDefault }]
 *  get  -> نفس الشكل + items:[{ taskId, defaultApplicable, sortOrder }]
 *
 * في وضع الـ mock: قالب واحد temp1 = قسم الدراسات = كل المهام القياسية (الـ 40).
 * لإضافة قالب تجريبي لقسم تاني زوّدي عنصر في MOCK_TEMPLATES.
 */
const MOCK_TEMPLATES = [
  {
    id: 'temp1',
    code: 'Temp 1',
    name: 'قالب قسم الدراسات',
    description: 'المهام القياسية الحالية: من دراسة كراسة الشروط لحد تسليم العطاء.',
    department: { id: 'studies', name: 'قسم الدراسات' },
    isDefault: true,
    pick: () => true, // أي مهمة تدخل القالب
  },
];

const toSummary = (t, tasks) => ({ id: t.id, code: t.code, name: t.name, description: t.description, department: t.department, isDefault: t.isDefault, taskCount: tasks.filter(t.pick).length });

export const templatesService = {
  async list({ tasks = [] } = {}) {
    if (USE_MOCK) { await wait(120); return MOCK_TEMPLATES.map((t) => toSummary(t, tasks)); }
    return request('/api/templates');
  },

  async get(id, { tasks = [] } = {}) {
    if (USE_MOCK) {
      await wait(120);
      const t = MOCK_TEMPLATES.find((x) => x.id === id);
      if (!t) throw new Error('القالب غير موجود');
      return { ...toSummary(t, tasks), items: tasks.filter(t.pick).map((k, i) => ({ taskId: k.id, defaultApplicable: k.applicable !== false, sortOrder: i + 1 })) };
    }
    return request(`/api/templates/${encodeURIComponent(id)}`);
  },

  /* لحد ما الـ Backend يحفظ project.templateId نخزنه محليًا في المتصفح */
  localTemplateId(projectId) { return store.get(`project-template:${projectId}`, null); },
  setLocalTemplateId(projectId, templateId) { store.set(`project-template:${projectId}`, templateId); },
};
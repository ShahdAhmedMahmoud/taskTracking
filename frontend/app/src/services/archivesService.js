import { request, USE_MOCK } from './request';

/**
 * عقد الـ API الكامل في BACKEND-SPEC.md قسم 1.
 * بيانات العرض التجريبية لا تنفذ تغييرات حقيقية. عمليات الاسترجاع والحذف ترسل طلبًا للخادم،
 * ولا تعتبر ناجحة إلا بعد تأكيد الخادم حفظ التغيير.
 */

const demoSnapshot = (name, taskIds, ratio, { finished = false, outcome = null } = {}) => ({
  id: `demo_${name}`,
  name,
  deliveryDate: '2026-09-28',
  inquiryDate: '2026-09-10',
  finished,
  outcome,
  tasks: Object.fromEntries(taskIds.map((id, i) => [id, { status: i / Math.max(taskIds.length, 1) < ratio, review: i % 3 === 0, applicable: i % 7 !== 6, dueDate: '', department: i % 2 ? 'قسم المشتريات،القسم المالي' : 'القسم الفني', notes: i % 9 === 0 ? 'محتاج مراجعة قبل التسليم' : '' }])),
  customTasks: [{ id: 'c1', title: 'تجهيز عينات المواد', status: true, review: false, applicable: true, department: 'الجودة', notes: '' }],
});

const demoRows = (taskIds) => [
  { id: 'demo1', projectId: 'demo_a', projectName: 'مجمع سكني — القاهرة الجديدة', engineerId: '', engineerName: 'مهندس تجريبي (1)', teamId: '', teamName: 'فريق 1', archivedAt: '2026-10-08T10:20:00Z', archivedBy: 'مدير القسم', snapshot: demoSnapshot('مجمع سكني — القاهرة الجديدة', taskIds, 0.85, { finished: true, outcome: 'won' }), filesCount: 4 },
  { id: 'demo2', projectId: 'demo_b', projectName: 'مبنى إداري — العاصمة', engineerId: '', engineerName: 'مهندس تجريبي (2)', teamId: '', teamName: 'فريق 2', archivedAt: '2026-10-03T14:05:00Z', archivedBy: 'مدير القسم', snapshot: demoSnapshot('مبنى إداري — العاصمة', taskIds, 0.5, { finished: true, outcome: 'lost' }), filesCount: 2 },
  { id: 'demo3', projectId: 'demo_c', projectName: 'مخازن لوجستية — العاشر', engineerId: '', engineerName: 'مهندس تجريبي (1)', teamId: '', teamName: 'فريق 1', archivedAt: '2026-09-21T08:00:00Z', archivedBy: 'مدير فريق 1', snapshot: demoSnapshot('مخازن لوجستية — العاشر', taskIds, 0.2), filesCount: 0 },
];

export const archivesService = {
  async list({ taskIds = [] } = {}) {
    let rows = [];
    try {
      const r = await request('/api/dashboard/archives', { headers: { 'X-User-Role': 'dept' } });
      rows = Array.isArray(r) ? r : r?.items || [];
    } catch (e) {
      if (!USE_MOCK) throw e;
    }
    if (USE_MOCK) {
      if (!rows.length) rows = demoRows(taskIds);
    }
    return rows;
  },

  /** التفاصيل الكاملة (snapshot + hasr + files). في الـ mock بيرجّع null والصفحة بتستخدم الصف نفسه. */
  async get(id) {
    if (USE_MOCK) return null;
    return request(`/api/dashboard/archives/${encodeURIComponent(id)}`);
  },

  /** استرجاع كمشروع جاري. ممكن يرمي error.code === 'ENGINEER_NOT_FOUND' (409) فنطلب مهندس بديل. */
  async restore(id, { targetEngineerId } = {}) {
    return request(`/api/dashboard/archives/${encodeURIComponent(id)}/restore`, { method: 'POST', body: targetEngineerId ? { targetEngineerId } : {} });
  },

  /** حذف نهائي — مفيش رجوع. */
  async remove(id) {
    return request(`/api/dashboard/archives/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

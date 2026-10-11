import { request, store, wait, USE_MOCK } from './request';

// أسماء تجريبية للبداية — عدّليها أو امسحيها. القايمة الحقيقية هتيجي من
// GET /api/responsible-departments (BACKEND-SPEC.md قسم 4)
const SEED = ['قسم الدراسات', 'قسم المشتريات', 'القسم الفني', 'القسم المالي', 'قسم العقود', 'التخطيط', 'الجودة', 'السلامة والصحة المهنية'];
const KEY = 'mock-responsible-departments';

export const departmentsService = {
  async list() {
    if (USE_MOCK) {
      await wait(80);
      return [...new Set([...SEED, ...store.get(KEY, [])])];
    }
    const rows = await request('/api/responsible-departments');
    return rows.map((r) => r.name);
  },
  async create(name) {
    const clean = String(name || '').trim().slice(0, 60);
    if (!clean) return null;
    if (USE_MOCK) {
      store.set(KEY, [...new Set([...store.get(KEY, []), clean])]);
      return clean;
    }
    const row = await request('/api/responsible-departments', { method: 'POST', body: { name: clean } });
    return row?.name || clean;
  },
};
import { get, put } from './api';

export async function fetchBootstrap() {
  const r = await get('/api/bootstrap');
  if (!Array.isArray(r?.teams) || !Array.isArray(r?.tasks)) throw new Error('بيانات التهيئة القادمة من الخادم غير مكتملة');
  return r;
}
export const fetchDashConfig = async () => { try { return await get('/api/dashboard/config'); } catch { return null; } };
export const saveDashConfig = (payload) => put('/api/dashboard/config', payload);
export const fetchFields = async () => (await get('/api/fields'))?.fields || [];
export const saveFields = (payload) => put('/api/fields', payload);
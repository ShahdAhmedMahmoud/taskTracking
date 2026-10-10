import { get, post, put } from './api';

export const fetchAuth = () => get('/api/dashboard/auth');
export const saveAuth = (auth) => put('/api/dashboard/auth', auth);
export async function hashPassword(password) {
  const r = await post('/api/dashboard/auth/hash', { password });
  if (!r?.hash) throw new Error('لم يُرجع الخادم رمز التحقق');
  return r.hash;
}
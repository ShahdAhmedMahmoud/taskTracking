import { get, put, enc } from './api';

export async function fetchHasr(teamId) {
  const r = await get(`/api/dashboard/hasr/${enc(teamId)}`);
  return Array.isArray(r) ? r : r?.items || [];
}
export const saveHasrApi = (teamId, list) => put(`/api/dashboard/hasr/${enc(teamId)}`, list);
import { get, put, del, enc, userHeader } from './api';

export const fetchEngineer = (id) => get(`/api/dashboard/engineers/${enc(id)}`);
export const saveEngineerApi = (id, data) => put(`/api/dashboard/engineers/${enc(id)}`, data);
export const archiveProjectApi = (engId, projId, by) =>
  del(`/api/dashboard/engineers/${enc(engId)}/projects/${enc(projId)}`, { headers: userHeader(by) });
export const fetchArchives = () => get('/api/dashboard/archives', { headers: { 'X-User-Role': 'dept' } });
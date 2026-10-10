import { get, put, enc } from './api';

export const fetchRoster = () => get('/api/roster');
export const saveRoster = (teams) => put('/api/roster', { teams });
export const saveProfile = (id, payload) =>
  put(`/api/roster/engineers/${enc(id)}/profile`, payload, { headers: { 'X-User-Role': 'engineer', 'X-Engineer-Id': id } });
export const savePhoto = (id, photoData) =>
  put(`/api/roster/engineers/${enc(id)}/photo`, { photoData }, { headers: { 'X-User-Role': 'engineer', 'X-Engineer-Id': id } });
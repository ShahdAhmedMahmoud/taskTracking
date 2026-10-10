import { get, post, enc } from './api';

export const fetchNotifications = (id) => get(`/api/notifications/${enc(id)}`);
export const markReadApi = (id, nid) => post(`/api/notifications/${enc(id)}/read/${nid}`);
export const markAllReadApi = (id) => post(`/api/notifications/${enc(id)}/read`);
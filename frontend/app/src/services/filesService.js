import { get, post, del, request, enc, userHeader } from './api';

const fileForm = (file, extra = {}) => {
  const f = new FormData();
  f.append('file', file);
  Object.entries(extra).forEach(([k, v]) => f.append(k, v ?? ''));
  return f;
};

export const fetchProjectFiles = (pid) => get(`/api/files/projects/${enc(pid)}`);
export const uploadAttachment = (pid, { file, name, notes }, user) =>
  request(`/api/files/projects/${enc(pid)}/attachments`, {
    method: 'POST',
    form: fileForm(file, { attachmentName: name || file.name.replace(/\.[^.]+$/, ''), notes }),
    headers: userHeader(user),
  });
export const createTFile = (pid, body, user) => post(`/api/files/projects/${enc(pid)}/t-files`, body, { headers: userHeader(user) });
export const createRound = (tid, body, user) => post(`/api/files/t-files/${enc(tid)}/rounds`, body, { headers: userHeader(user) });
export const uploadVersion = (rid, file, user) =>
  request(`/api/files/rounds/${enc(rid)}/versions`, { method: 'POST', form: fileForm(file), headers: userHeader(user) });
export const deleteAttachment = (id, user) => del(`/api/files/attachments/${id}`, { headers: userHeader(user) });
export const deleteTFile = (id, user) => del(`/api/files/t-files/${enc(id)}`, { headers: userHeader(user) });
export const deleteRound = (id, user) => del(`/api/files/rounds/${enc(id)}`, { headers: userHeader(user) });
export const deleteVersion = (id, user) => del(`/api/files/versions/${id}`, { headers: userHeader(user) });
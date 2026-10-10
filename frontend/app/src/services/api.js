const BASE = import.meta.env.VITE_API_URL || '';

export async function request(path, { method = 'GET', body, form, headers = {} } = {}) {
  const opts = { method, headers: { ...headers }, cache: 'no-store' };
  if (form) opts.body = form;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export const get = (p, o) => request(p, o);
export const post = (p, body, o) => request(p, { method: 'POST', body, ...o });
export const put = (p, body, o) => request(p, { method: 'PUT', body, ...o });
export const del = (p, o) => request(p, { method: 'DELETE', ...o });
export const userHeader = (name) => ({ 'X-User-Name': encodeURIComponent(name || 'system') });
export const enc = encodeURIComponent;
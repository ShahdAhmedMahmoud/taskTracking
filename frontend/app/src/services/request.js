// لو عندك fetch wrapper جاهز في services/ (بيضيف الـ headers أو الـ token) استخدميه بدل الدالة دي،
// وسيبي بس تصدير USE_MOCK.

/**
 * USE_MOCK = true  -> الخدمات الجديدة بتشتغل على بيانات تجريبية محلية (قبل ما الـ Backend يجهز)
 * USE_MOCK = false -> بتكلم الـ endpoints الحقيقية المكتوبة في BACKEND-SPEC.md
 *
 * في ملف .env:  VITE_USE_MOCK=false   (لما الـ Backend يجهز)
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(path, {
    method,
    cache: 'no-store',
    credentials: 'include',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error || err.message || `HTTP ${res.status}`);
    e.status = res.status;
    e.code = err.code;
    throw e;
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- تخزين محلي آمن للـ mocks فقط ---------- */
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* التخزين ممكن يكون مقفول */ }
  },
};

export const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
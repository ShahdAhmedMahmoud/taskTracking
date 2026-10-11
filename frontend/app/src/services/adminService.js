/**
 * خدمات صفحات الإدارة (إدارة الفرق / إضافة موظف / البريد / الأرشيف).
 * كل الـ endpoints والـ payloads هنا منقولة بالحرف من app.js القديم.
 */
const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function req(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `الخادم رجّع خطأ (${res.status})`);
  }
  return res;
}

/* ---------- الفرق والمهندسين ---------- */
// GET -> { teams: [...] }
export const getRoster = async () => (await req('/api/roster', { cache: 'no-store' })).json();
// PUT بيستبدل كل الفرق، فاستخدميه دايمًا على نسخة طازة من getRoster
export const putRoster = (teams) => req('/api/roster', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ teams }) });

/* ---------- كلمات المرور (hashes) ---------- */
// الشكل: { engineers: {id: hash}, teams: {id: hash}, dept: hash }
export const getAuth = async () => (await req('/api/dashboard/auth', { cache: 'no-store' })).json();
export const putAuth = (auth) => req('/api/dashboard/auth', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(auth) });

/** مسح كلمة مرور مهندس/مدير فريق: أول دخول بعد كده بيطلب كلمة مرور جديدة (نفس سلوك النظام القديم) */
export async function clearPasswords({ engineerIds = [], teamIds = [] }) {
  const auth = await getAuth();
  engineerIds.forEach((id) => { if (auth.engineers) delete auth.engineers[id]; });
  teamIds.forEach((id) => { if (auth.teams) delete auth.teams[id]; });
  await putAuth(auth);
}

/* ---------- إعدادات اللوحة (البريد) ---------- */
export const getConfig = async () => (await req('/api/dashboard/config', { cache: 'no-store' })).json();
export const putConfig = (payload) => req('/api/dashboard/config', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(payload) });

/* ---------- الأرشيف (مدير القسم فقط) ---------- */
export const getArchives = async () => (await req('/api/dashboard/archives', { headers: { 'X-User-Role': 'dept' }, cache: 'no-store' })).json();
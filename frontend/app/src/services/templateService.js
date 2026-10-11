/* خدمة القوالب — GET/PUT /api/templates (نفس نمط roster و hasr: PUT بيحفظ القايمة كلها).
   لو عندك helper للـ http فيه الـ base URL والتوكن (زي باقي الـ services)، استبدلي fetch بيه. */
const URL_ = '/api/templates';

const json = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
};

export async function fetchTemplates() {
  const r = await json(await fetch(URL_, { credentials: 'include' }));
  return Array.isArray(r) ? r : (r?.templates ?? []);
}

export async function saveTemplatesApi(list) {
  return json(await fetch(URL_, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list),
  }));
}
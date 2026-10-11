// // /* =====================================================================
// //    قوالب المهام (Task Templates)
// //    كل افتراض عن شكل المهمة القياسية (من GET /api/tasks) متجمّع هنا.
// //    لو أسماء الحقول عندك مختلفة عدّليها في الدوال دي بس.
// //    ===================================================================== */

// // export const taskId = (t) => String(t.id ?? t.key ?? t.taskId);
// // export const taskName = (t) => t.name ?? t.title ?? t.label ?? t.text ?? `مهمة ${taskId(t)}`;

// // /** القسم المسؤول: نص بفواصل أو array → array */
// // export const splitDepts = (v) => (Array.isArray(v)
// //   ? v.map(String).map((s) => s.trim()).filter(Boolean)
// //   : String(v ?? '').split(/[،,|/]/).map((s) => s.trim()).filter(Boolean));

// // /** الأقسام المسؤولة عن مهمة: تعديل القالب/المشروع (override، حتى لو فاضي = "بدون قسم") أولًا، وبعدها الأصلي من المهمة القياسية */
// // export const taskDepts = (t, override) => (Array.isArray(override)
// //   ? override
// //   : splitDepts(t.responsibleDepartments ?? t.responsible ?? t.department ?? t.dept ?? t.owner));

// // /** تنضيف خريطة التعديلات (بتشيل القيم غير المصفوفات وترتّب المفاتيح عشان المقارنة) */
// // export const cleanResp = (r = {}) => Object.fromEntries(
// //   Object.entries(r).filter(([, v]) => Array.isArray(v)).sort(([a], [b]) => a.localeCompare(b)),
// // );

// // /** تطبيع عربي للبحث (يتجاهل التشكيل وأ/إ/آ وى/ي وة/ه) */
// // export const normAr = (s) => String(s ?? '')
// //   .toLowerCase()
// //   .replace(/[ً-ٰٟـ]/g, '')
// //   .replace(/[أإآ]/g, 'ا')
// //   .replace(/ى/g, 'ي')
// //   .replace(/ة/g, 'ه')
// //   .trim();

// // /** القالب الأساسي الحالي — مخصص لقسم الدراسات ويشمل كل المهام القياسية */
// // export const DEFAULT_TEMPLATE = {
// //   id: 'temp1',
// //   name: 'القالب الأساسي — قسم الدراسات',
// //   departments: ['الدراسات'],
// //   taskIds: null, // null = كل المهام القياسية
// //   responsible: {},
// //   builtIn: true,
// // };

// // /** معرّفات مهام القالب بعد التأكد إنها لسه موجودة في المهام القياسية */
// // export function resolveIds(tpl, tasks) {
// //   const valid = new Set(tasks.map(taskId));
// //   if (!tpl.taskIds) return [...valid];
// //   return tpl.taskIds.map(String).filter((id) => valid.has(id));
// // }

// // /** كل الأقسام المعروفة: من المهام + القوالب + أي إضافات */
// // export function collectDepartments(tasks, templates, extra = []) {
// //   const set = new Set(extra);
// //   tasks.forEach((t) => taskDepts(t).forEach((d) => set.add(d)));
// //   templates.forEach((tpl) => {
// //     (tpl.departments || []).forEach((d) => set.add(d));
// //     Object.values(tpl.responsible || {}).forEach((arr) => (arr || []).forEach((d) => set.add(d)));
// //   });
// //   return [...set];
// // }

// // export const newTemplateId = () => `tpl_${Date.now().toString(36)}`;

// // /** مقارنة مجموعتين من المعرّفات */
// // export const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));


// /* =====================================================================
//    قوالب المهام (Task Templates)
//    كل افتراض عن شكل المهمة القياسية (من GET /api/tasks) متجمّع هنا.
//    لو أسماء الحقول عندك مختلفة عدّليها في الدوال دي بس.
//    ===================================================================== */

// export const taskId = (t) => String(t.id ?? t.key ?? t.taskId);
// export const taskName = (t) => t.name ?? t.title ?? t.label ?? t.text ?? `مهمة ${taskId(t)}`;

// /** القسم المسؤول: نص بفواصل أو array → array */
// export const splitDepts = (v) => (Array.isArray(v)
//   ? v.map(String).map((s) => s.trim()).filter(Boolean)
//   : String(v ?? '').split(/[،,|/]/).map((s) => s.trim()).filter(Boolean));

// /** الأقسام المسؤولة عن مهمة: تعديل القالب/المشروع (override، حتى لو فاضي = "بدون قسم") أولًا، وبعدها الأصلي من المهمة القياسية */
// export const taskDepts = (t, override) => (Array.isArray(override)
//   ? override
//   : splitDepts(t.responsibleDepartments ?? t.responsible ?? t.department ?? t.dept ?? t.owner));

// /** تنضيف خريطة التعديلات (بتشيل القيم غير المصفوفات وترتّب المفاتيح عشان المقارنة) */
// export const cleanResp = (r = {}) => Object.fromEntries(
//   Object.entries(r).filter(([, v]) => Array.isArray(v)).sort(([a], [b]) => a.localeCompare(b)),
// );

// /** تطبيع عربي للبحث (يتجاهل التشكيل وأ/إ/آ وى/ي وة/ه) */
// export const normAr = (s) => String(s ?? '')
//   .toLowerCase()
//   .replace(/[ً-ٰٟـ]/g, '')
//   .replace(/[أإآ]/g, 'ا')
//   .replace(/ى/g, 'ي')
//   .replace(/ة/g, 'ه')
//   .trim();

// /** القالب الأساسي الحالي — مخصص لقسم الدراسات ويشمل كل المهام القياسية */
// export const DEFAULT_TEMPLATE = {
//   id: 'temp1',
//   name: 'القالب الأساسي — قسم الدراسات',
//   departments: ['الدراسات'],
//   taskIds: null, // null = كل المهام القياسية
//   responsible: {},
//   builtIn: true,
// };

// /** معرّفات مهام القالب بعد التأكد إنها لسه موجودة في المهام القياسية */
// export function resolveIds(tpl, tasks) {
//   const valid = new Set(tasks.map(taskId));
//   if (!tpl.taskIds) return [...valid];
//   return tpl.taskIds.map(String).filter((id) => valid.has(id));
// }

// /** كل الأقسام المعروفة: من المهام + القوالب + أي إضافات */
// export function collectDepartments(tasks, templates, extra = []) {
//   const set = new Set(extra);
//   tasks.forEach((t) => taskDepts(t).forEach((d) => set.add(d)));
//   templates.forEach((tpl) => {
//     (tpl.departments || []).forEach((d) => set.add(d));
//     Object.values(tpl.responsible || {}).forEach((arr) => (arr || []).forEach((d) => set.add(d)));
//   });
//   return [...set];
// }

// export const newTemplateId = () => `tpl_${Date.now().toString(36)}`;

// /** مقارنة مجموعتين من المعرّفات */
// export const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

// /* ---------------- مهام جديدة (extras) ----------------
//    المهام اللي بتتعمل من نافذة القوالب (مش من الـ 40 القياسية).
//    extra = { id, name }، وأقسامها المسؤولة بتتخزن في resp[id] زي باقي المهام. */
// export const newExtraId = () => `x_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// /** يفصل resp لجزئين: تعديلات المهام القياسية، والمهام الجديدة بأقسامها */
// export function splitResp(resp, extra) {
//   const ids = new Set(extra.map((e) => e.id));
//   const std = cleanResp(Object.fromEntries(Object.entries(resp).filter(([k]) => !ids.has(k))));
//   const extras = extra.map((e) => ({ id: e.id, name: e.name, departments: Array.isArray(resp[e.id]) ? resp[e.id] : [] }));
//   return { std, extras };
// }

// /** لقطة نصية للاختيار الحالي (عشان نعرف لو في تغييرات على القالب) */
// export function snapshotOf(sel, resp, extra) {
//   const { std, extras } = splitResp(resp, extra);
//   return JSON.stringify({ ids: [...sel].sort(), std, extras: extras.map((e) => [e.id, e.name, e.departments]) });
// }

/* =====================================================================
   قوالب المهام (Task Templates)
   كل افتراض عن شكل المهمة القياسية (من GET /api/tasks) متجمّع هنا.
   لو أسماء الحقول عندك مختلفة عدّليها في الدوال دي بس.
   ===================================================================== */

export const taskId = (t) => String(t.id ?? t.key ?? t.taskId);
export const taskName = (t) => t.name ?? t.title ?? t.label ?? t.text ?? `مهمة ${taskId(t)}`;

/** القسم المسؤول: نص بفواصل أو array → array */
export const splitDepts = (v) => (Array.isArray(v)
  ? v.map(String).map((s) => s.trim()).filter(Boolean)
  : String(v ?? '').split(/[،,|/]/).map((s) => s.trim()).filter(Boolean));

/** الأقسام المسؤولة عن مهمة: تعديل القالب/المشروع (override، حتى لو فاضي = "بدون قسم") أولًا، وبعدها الأصلي من المهمة القياسية */
export const taskDepts = (t, override) => (Array.isArray(override)
  ? override
  : splitDepts(t.responsibleDepartments ?? t.responsible ?? t.department ?? t.dept ?? t.owner));

/** تنضيف خريطة التعديلات (بتشيل القيم غير المصفوفات وترتّب المفاتيح عشان المقارنة) */
export const cleanResp = (r = {}) => Object.fromEntries(
  Object.entries(r).filter(([, v]) => Array.isArray(v)).sort(([a], [b]) => a.localeCompare(b)),
);

/** تطبيع عربي للبحث (يتجاهل التشكيل وأ/إ/آ وى/ي وة/ه) */
export const normAr = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .trim();

/** القالب الأساسي الحالي — مخصص لقسم الدراسات ويشمل كل المهام القياسية */
export const DEFAULT_TEMPLATE = {
  id: 'temp1',
  name: 'القالب الأساسي — قسم الدراسات',
  departments: ['الدراسات'],
  taskIds: null, // null = كل المهام القياسية
  responsible: {},
  builtIn: true,
};

/** معرّفات مهام القالب بعد التأكد إنها لسه موجودة في المهام القياسية */
export function resolveIds(tpl, tasks) {
  const valid = new Set(tasks.map(taskId));
  if (!tpl.taskIds) return [...valid];
  return tpl.taskIds.map(String).filter((id) => valid.has(id));
}

/** كل الأقسام المعروفة: من المهام + القوالب + أي إضافات */
export function collectDepartments(tasks, templates, extra = []) {
  const set = new Set(extra);
  tasks.forEach((t) => taskDepts(t).forEach((d) => set.add(d)));
  templates.forEach((tpl) => {
    (tpl.departments || []).forEach((d) => set.add(d));
    Object.values(tpl.responsible || {}).forEach((arr) => (arr || []).forEach((d) => set.add(d)));
  });
  return [...set];
}

export const newTemplateId = () => `tpl_${Date.now().toString(36)}`;

/** مقارنة مجموعتين من المعرّفات */
export const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

/* ---------------- مهام جديدة (extras) ----------------
   المهام اللي بتتعمل من نافذة القوالب (مش من الـ 40 القياسية).
   extra = { id, name }، وأقسامها المسؤولة بتتخزن في resp[id] زي باقي المهام. */
export const newExtraId = () => `x_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** المهمة الجديدة بتتعرف من الـ id (بيبدأ بـ x_) أو من العلامة — فمتتفقدش لو الـ backend شال حقل مش معروف */
export const isTemplateTask = (c) => !!c?.templateTask || String(c?.id ?? '').startsWith('x_');

/** القسم المسؤول جوه المشروع نص واحد ("الدراسات، العقارات") */
export const joinDepts = (arr) => (arr || []).join('، ');

/** يفصل resp لجزئين: تعديلات المهام القياسية، والمهام الجديدة بأقسامها */
export function splitResp(resp, extra) {
  const ids = new Set(extra.map((e) => e.id));
  const std = cleanResp(Object.fromEntries(Object.entries(resp).filter(([k]) => !ids.has(k))));
  const extras = extra.map((e) => ({ id: e.id, name: e.name, departments: Array.isArray(resp[e.id]) ? resp[e.id] : [] }));
  return { std, extras };
}

/** لقطة نصية للاختيار الحالي (عشان نعرف لو في تغييرات على القالب) */
export function snapshotOf(sel, resp, extra) {
  const { std, extras } = splitResp(resp, extra);
  return JSON.stringify({ ids: [...sel].sort(), std, extras: extras.map((e) => [e.id, e.name, e.departments]) });
}
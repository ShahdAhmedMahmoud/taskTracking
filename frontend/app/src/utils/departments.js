// "القسم المسؤول" بقى متعدد. لحد ما الـ Backend يدعم array حقيقي (departments: [])
// بنخزن القيم في نفس الحقل النصي القديم `department` مفصولة بـ «،».
// القيم القديمة (اسم قسم واحد) بتتقرا عادي.

const SEP = '،';

export const parseDepts = (value) => {
  const list = Array.isArray(value) ? value : String(value || '').split(/[،,;|]/);
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
};

export const serializeDepts = (arr) => parseDepts(arr).join(SEP);

// يوحّد الحروف العربية عشان البحث يلاقي "الإدارة" لما تكتبي "الاداره"
export const normalizeAr = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
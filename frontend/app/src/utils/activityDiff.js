const SEP = '\u0001';
const ar = (v) => Number(v).toLocaleString('ar-EG');
const fmtD = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : 'بدون تاريخ');

/* hash بسيط للنصوص الطويلة (الملاحظات) عشان اللقطة تفضل صغيرة */
const hash = (s) => {
  const str = String(s || '');
  if (!str) return '';
  let x = 5381;
  for (let i = 0; i < str.length; i += 1) x = ((x << 5) + x + str.charCodeAt(i)) | 0;
  return `${str.length}.${(x >>> 0).toString(36)}`;
};

export const GROUP = {
  project_added: 'projects', project_removed: 'projects', project_edit: 'projects',
  delivered: 'projects', reopened: 'projects', outcome: 'projects',
  tasks_done: 'tasks', tasks_undone: 'tasks', tasks_review: 'tasks', tasks_na: 'tasks', tasks_edit: 'tasks',
  custom_added: 'tasks', custom_removed: 'tasks', custom_done: 'tasks',
  round_added: 'rounds', round_done: 'rounds',
  hasr_work: 'hasr', hasr_done: 'hasr', hasr_edit: 'hasr',
};

export const LIST_KINDS = new Set(['tasks_done', 'tasks_undone', 'tasks_review', 'tasks_na', 'tasks_edit', 'custom_added', 'custom_removed', 'custom_done']);

/* ================= اللقطات ================= */
export function snapEngineer(data) {
  const out = {};
  (data?.projects || []).forEach((p) => {
    const t = {};
    Object.entries(p.tasks || {}).forEach(([id, s]) => {
      t[id] = [s.status ? 1 : 0, s.review ? 1 : 0, s.applicable === false ? 0 : 1, s.dueDate || '', s.department || '', hash(s.notes)].join(SEP);
    });
    const c = {};
    (p.customTasks || []).forEach((x, i) => {
      c[x.id ?? `i${i}`] = [x.name ?? x.title ?? '', x.status ? 1 : 0, x.review ? 1 : 0, x.dueDate || '', hash(x.notes)].join(SEP);
    });
    out[p.id] = {
      n: p.name || '', d: p.deliveryDate || '', i: p.inquiryDate || '',
      f: p.finished ? 1 : 0, o: p.outcome || '', nt: hash(p.note),
      r: (p.rounds || []).map((r) => [r.id ?? '', r.title || '', r.date || '', r.delivered ? 1 : 0].join(SEP)),
      t, c,
    };
  });
  return out;
}

export function snapHasr(list) {
  const out = {};
  (list || []).forEach((i) => {
    out[i.id] = [i.hasWork == null ? '' : i.hasWork ? 1 : 0, i.hasrDone ? 1 : 0, i.hasrDueDate || '', hash(i.hasrNotes), i.name || ''].join(SEP);
  });
  return out;
}

/* ================= المقارنة: مهندس ================= */
const parseTask = (s) => { const [st, rv, ap, due, dep, nt] = s.split(SEP); return { st: st === '1', rv: rv === '1', ap: ap === '1', due, dep, nt }; };
const parseRound = (s) => { const [id, title, date, dl] = s.split(SEP); return { key: id || title, title, date, done: dl === '1' }; };

export function diffEngineer(prev, next, { taskName, lab }) {
  const out = [];
  const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);

  ids.forEach((pid) => {
    const a = prev[pid]; const b = next[pid];
    if (!a && b) { out.push({ kind: 'project_added', projectId: pid, project: b.n || 'مشروع بدون اسم', title: 'أضاف مشروعًا جديدًا' }); return; }
    if (a && !b) { out.push({ kind: 'project_removed', projectId: pid, project: a.n || 'مشروع بدون اسم', title: 'أرشف أو حذف مشروعًا' }); return; }

    const project = b.n || 'مشروع بدون اسم';
    const add = (kind, title, items) => out.push({ kind, projectId: pid, project, title, items });

    if (a.n !== b.n) add('project_edit', `غيّر اسم المشروع من «${a.n || 'بدون اسم'}» إلى «${b.n || 'بدون اسم'}»`);
    if (a.d !== b.d) add('project_edit', 'عدّل موعد تسليم المشروع', [`${fmtD(a.d)} ← ${fmtD(b.d)}`]);
    if (a.i !== b.i) add('project_edit', 'عدّل موعد الاستفسارات', [`${fmtD(a.i)} ← ${fmtD(b.i)}`]);
    if (a.nt !== b.nt) add('project_edit', 'عدّل ملحوظة المشروع');
    if (a.f !== b.f) add(b.f ? 'delivered' : 'reopened', b.f ? 'سلّم المشروع' : 'أعاد المشروع إلى «جاري»');
    if (a.o !== b.o) add('outcome', `حدّد نتيجة المشروع: ${b.o === 'won' ? lab('won') : b.o === 'lost' ? lab('lost') : 'معلق'}`);

    /* الجولات */
    // The snapshot is persisted in localStorage and may come from an older UI
    // version that did not include rounds, tasks, or custom-task maps.
    const previousRounds = Array.isArray(a.r) ? a.r : [];
    const nextRounds = Array.isArray(b.r) ? b.r : [];
    const previousTasks = a.t && typeof a.t === 'object' ? a.t : {};
    const nextTasks = b.t && typeof b.t === 'object' ? b.t : {};
    const previousCustom = a.c && typeof a.c === 'object' ? a.c : {};
    const nextCustom = b.c && typeof b.c === 'object' ? b.c : {};

    const prevR = new Map(previousRounds.map(parseRound).map((r) => [r.key, r]));
    nextRounds.map(parseRound).forEach((r) => {
      const old = prevR.get(r.key);
      if (!old) add('round_added', `أضاف جولة «${r.title || 'بدون اسم'}»`);
      else if (!old.done && r.done) add('round_done', `سلّم جولة «${r.title || 'بدون اسم'}»`);
    });

    /* المهام القياسية */
    const done = []; const undone = []; const review = []; const na = []; const edit = [];
    Object.keys(nextTasks).forEach((tid) => {
      const x = previousTasks[tid]; const y = nextTasks[tid];
      if (!x || x === y) return; // مهمة جديدة من الإعدادات مش action للمهندس
      const p = parseTask(x); const q = parseTask(y); const name = taskName(tid);
      if (!p.st && q.st) done.push(name);
      else if (p.st && !q.st) undone.push(name);
      if (p.rv !== q.rv) review.push(name);
      if (p.ap !== q.ap) na.push(`${name} ${q.ap ? '(بقت تنطبق)' : '(لا تنطبق)'}`);
      if (p.due !== q.due || p.dep !== q.dep || p.nt !== q.nt) edit.push(name);
    });
    if (done.length) add('tasks_done', '', done);
    if (undone.length) add('tasks_undone', '', undone);
    if (review.length) add('tasks_review', '', review);
    if (na.length) add('tasks_na', '', na);
    if (edit.length) add('tasks_edit', '', edit);

    /* المهام المخصصة */
    const cAdd = []; const cDel = []; const cDone = [];
    new Set([...Object.keys(previousCustom), ...Object.keys(nextCustom)]).forEach((k) => {
      const x = previousCustom[k]; const y = nextCustom[k];
      if (!x && y) cAdd.push(y.split(SEP)[0] || 'مهمة');
      else if (x && !y) cDel.push(x.split(SEP)[0] || 'مهمة');
      else if (x !== y) {
        const [n0, s0] = x.split(SEP); const [n1, s1] = y.split(SEP);
        if (s0 !== '1' && s1 === '1') cDone.push(n1 || n0 || 'مهمة');
      }
    });
    if (cAdd.length) add('custom_added', '', cAdd);
    if (cDel.length) add('custom_removed', '', cDel);
    if (cDone.length) add('custom_done', '', cDone);
  });
  return out;
}

/* ================= المقارنة: قسم الحصر ================= */
export function diffHasr(prev, next) {
  const out = [];
  Object.keys(next).forEach((id) => {
    const x = prev[id]; const y = next[id];
    if (!x || x === y) return; // المشاريع الجديدة بتتزامن تلقائيًا ومتغطية بإشعار المشروع
    const [w0, d0, due0, nt0] = x.split(SEP); const [w1, d1, due1, nt1, name] = y.split(SEP);
    const project = name || 'مشروع بدون اسم';
    const add = (kind, title) => out.push({ kind, projectId: id.replace(/^sync_/, ''), project, title });
    if (w0 !== w1) add('hasr_work', w1 === '1' ? 'حدّد إن المشروع عليه أعمال حصر' : w1 === '0' ? 'حدّد إن المشروع مفيهوش أعمال حصر' : 'شال تحديد أعمال الحصر');
    if (d0 !== d1) add('hasr_done', d1 === '1' ? 'أنهى حصر المشروع' : 'أعاد فتح حصر المشروع');
    if (due0 !== due1) add('hasr_edit', `حدّد ميعاد تسليم الحصر: ${fmtD(due1)}`);
    if (nt0 !== nt1) add('hasr_edit', 'عدّل ملاحظات الحصر');
  });
  return out;
}

/* ================= الصياغة ================= */
const taskWord = (c) => (c === 1 ? 'مهمة' : c === 2 ? 'مهمتين' : c <= 10 ? `${ar(c)} مهام` : `${ar(c)} مهمة`);
const customWord = (c) => (c === 1 ? 'مهمة مخصصة' : c === 2 ? 'مهمتين مخصصتين' : c <= 10 ? `${ar(c)} مهام مخصصة` : `${ar(c)} مهمة مخصصة`);

export function eventTitle(ev) {
  const c = ev.items?.length || 0;
  switch (ev.kind) {
    case 'tasks_done': return `أنجز ${taskWord(c)}`;
    case 'tasks_undone': return `ألغى إنجاز ${taskWord(c)}`;
    case 'tasks_review': return `عدّل علامة المراجعة على ${taskWord(c)}`;
    case 'tasks_na': return `غيّر «ينطبق / لا ينطبق» لـ ${taskWord(c)}`;
    case 'tasks_edit': return `عدّل بيانات ${taskWord(c)} (ميعاد / قسم / ملاحظات)`;
    case 'custom_added': return `أضاف ${customWord(c)}`;
    case 'custom_removed': return `حذف ${customWord(c)}`;
    case 'custom_done': return `أنجز ${customWord(c)}`;
    default: return ev.title;
  }
}

/* دمج الأحداث المتشابهة (نفس المهندس + المشروع + النوع) خلال ١٠ دقايق */
const WINDOW = 10 * 60 * 1000;
export function mergeEvents(cur, fresh, cap = 300) {
  const out = [...cur];
  fresh.forEach((ev) => {
    if (out.some((item) => item.id === ev.id)) return;
    const i = LIST_KINDS.has(ev.kind)
      ? out.findIndex((x) => x.actorId === ev.actorId && x.projectId === ev.projectId && x.kind === ev.kind && ev.detectedAt - x.detectedAt < WINDOW)
      : -1;
    if (i >= 0) {
      out[i] = { ...out[i], items: [...new Set([...(out[i].items || []), ...(ev.items || [])])], at: ev.at, detectedAt: ev.detectedAt };
    } else out.unshift(ev);
  });
  return out.sort((a, b) => b.at - a.at).slice(0, cap);
}

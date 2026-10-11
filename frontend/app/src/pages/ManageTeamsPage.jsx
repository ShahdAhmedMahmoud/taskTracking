import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import { useRefreshOnLeave } from '../hooks/useRefreshOnLeave';
import { getRoster, putRoster, clearPasswords } from '../services/adminService';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import FormModal from '../components/ui/FormModal';
import { PlusIcon, TrashIcon } from '../components/engineer/EngineerIcons';
import { teamLabel } from '../utils/helpers';
import { n } from '../utils/dashboardData';

const DEFAULT_COLORS = ['#2A317A', '#6F7DD0', '#0E7C86', '#0EA5E9', '#F59E0B', '#E11D48', '#7C3AED', '#64748B'];
const clone = (v) => JSON.parse(JSON.stringify(v));

/* ================= أيقونات ================= */
const Svg = ({ className = 'h-4 w-4', children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>
);
const DotsIcon = (p) => <Svg {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></Svg>;
const EditIcon = (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
const KeyIcon = (p) => <Svg {...p}><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 9.2-9.2M16 7l3 3" /></Svg>;
const UpIcon = (p) => <Svg {...p}><path d="m12 19V5M5 12l7-7 7 7" /></Svg>;
const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;

/* ================= عنصر قايمة ================= */
const closeMenu = (e) => e.currentTarget.closest('details')?.removeAttribute('open');
function MenuItem({ icon: Icon, children, onClick, tone = '' }) {
  return (
    <button
      type="button" onClick={(e) => { closeMenu(e); onClick(); }}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-sm font-bold transition hover:bg-brand-50 ${tone || 'text-slate-600 hover:text-brand-800'}`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}{children}
    </button>
  );
}

/* ================= صف مهندس ================= */
function EngineerRow({ eng, team, movable, h }) {
  const isManager = team.manager === eng.name;
  const others = movable.filter((t) => t.id !== team.id);
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar engineer={eng} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          <span className="truncate">{eng.name}</span>
          {isManager && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700 ring-1 ring-amber-200">مدير الفريق</span>}
        </p>
        <p className="truncate text-xs text-slate-400">
          {[eng.employeeCode && `كود ${eng.employeeCode}`, eng.companyEmail].filter(Boolean).join(' · ') || 'لم تُستكمل بيانات الملف الشخصي'}
        </p>
      </div>

      <details data-menu className="relative">
        <summary aria-label={`خيارات ${eng.name}`} className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-slate-400 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
          <DotsIcon />
        </summary>
        <div className="absolute end-0 z-30 mt-2 w-64 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-slate-200 animate-rise">
          <MenuItem icon={EditIcon} onClick={() => h.rename(team, eng)}>تعديل الاسم</MenuItem>
          {!isManager && <MenuItem icon={UpIcon} onClick={() => h.promote(team, eng)}>تعيين مديرًا للفريق</MenuItem>}
          <MenuItem icon={KeyIcon} onClick={() => h.resetPw(eng)}>إعادة تعيين كلمة المرور</MenuItem>
          {others.length > 0 && (
            <div className="my-1 border-t border-slate-100 pt-1">
              <p className="px-3 py-1 text-xs font-bold text-slate-400">نقل إلى</p>
              {others.map((t) => (
                <MenuItem key={t.id} onClick={() => h.move(team, t, eng)}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color || '#6F7DD0' }} />{teamLabel(t)}
                </MenuItem>
              ))}
            </div>
          )}
          <div className="mt-1 border-t border-slate-100 pt-1">
            <MenuItem icon={TrashIcon} tone="text-rose-600 hover:bg-rose-50" onClick={() => h.removeEng(team, eng)}>حذف المهندس</MenuItem>
          </div>
        </div>
      </details>
    </li>
  );
}

/* ================= كارت فريق ================= */
function TeamCard({ team, engs, movable, palette, delay, h }) {
  const color = team.color || palette[0];
  const isHasr = team.type === 'hasr';
  return (
    <article className="card relative animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="h-1.5 rounded-t-[inherit]" style={{ background: color }} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <details data-menu className="relative">
            <summary aria-label="تغيير لون الفريق" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-2xl ring-2 ring-white transition hover:scale-105 [&::-webkit-details-marker]:hidden" style={{ background: color, boxShadow: `0 6px 18px -6px ${color}` }}>
              <span className="text-lg font-extrabold text-white">{(teamLabel(team) || '؟').trim().slice(-1)}</span>
            </summary>
            <div className="absolute start-0 z-30 mt-2 w-56 rounded-2xl bg-white p-3 shadow-lift ring-1 ring-slate-200 animate-rise">
              <p className="mb-2 text-xs font-bold text-slate-400">لون الفريق</p>
              <div className="grid grid-cols-4 gap-2">
                {palette.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => h.color(team, c)}
                    className={`h-9 rounded-xl ring-2 transition hover:scale-110 ${c.toLowerCase() === color.toLowerCase() ? 'ring-slate-700' : 'ring-transparent'}`} style={{ background: c }} />
                ))}
              </div>
              <label className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                لون مخصص
                <input type="color" value={color} onChange={(e) => h.color(team, e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
              </label>
            </div>
          </details>

          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
              <span className="truncate">{teamLabel(team)}</span>
              {team.division === 'saudi' && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200">قسم السعودية</span>}
              {isHasr && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">قسم الحصر</span>}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
              {isHasr ? 'مدير القسم' : 'مدير الفريق'}: <b className="text-slate-700">{team.manager}</b>
              <button type="button" onClick={() => h.editManager(team)} aria-label="تعديل المدير" className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"><EditIcon className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => h.resetManagerPw(team)} aria-label="إعادة تعيين كلمة مرور المدير" title="إعادة تعيين كلمة مرور المدير" className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"><KeyIcon className="h-3.5 w-3.5" /></button>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{n(team.engineers.length)} مهندس</span>
            {!isHasr && (
              <button type="button" onClick={() => h.removeTeam(team)} aria-label="حذف الفريق" title={team.engineers.length ? 'لازم تفضّي الفريق الأول' : 'حذف الفريق'}
                className={`grid h-9 w-9 place-items-center rounded-full ring-1 transition ${team.engineers.length ? 'text-slate-300 ring-slate-100' : 'text-slate-400 ring-slate-200 hover:bg-rose-50 hover:text-rose-500'}`}>
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        {engs.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {engs.map((e) => <EngineerRow key={e.id} eng={e} team={team} movable={movable} h={h} />)}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            {isHasr ? 'قسم الحصر بيستقبل المشاريع تلقائيًا ومش بيضم مهندسين.' : 'لا يوجد مهندسون في الفريق.'}
          </p>
        )}

        {!isHasr && (
          <Link to={`/add-employee?team=${team.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50">
            <PlusIcon className="h-4 w-4" />إضافة مهندس للفريق
          </Link>
        )}
      </div>
    </article>
  );
}

/* ================= الصفحة ================= */
export default function ManageTeamsPage() {
  const { teams: globalTeams, config } = useData();
  const { confirm, toast } = useUI();
  const markChanged = useRefreshOnLeave();
  const [teams, setTeams] = useState(() => clone(globalTeams));
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');

  /* نسخة طازة من الخادم عشان ما نكتبش فوق تغييرات حد تاني */
  useEffect(() => { getRoster().then((r) => { if (r?.teams?.length) setTeams(r.teams); }).catch(() => {}); }, []);

  /* قفل القوايم المفتوحة لما تضغطي برّه */
  useEffect(() => {
    const onClick = (e) => document.querySelectorAll('details[data-menu][open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const palette = useMemo(() => {
    const p = (config?.teamPalette || []).map((x) => x.value).filter(Boolean);
    return p.length ? p : DEFAULT_COLORS;
  }, [config]);
  const movable = teams.filter((t) => t.type !== 'hasr');

  /* ---------- الحفظ: تحديث فوري + تراجع لو فشل ---------- */
  const mut = (fn) => { const d = clone(teams); fn(d); return d; };
  const commit = async (next, okMsg, after) => {
    const prev = teams;
    setTeams(next);
    try {
      await putRoster(next);
      if (after) await after();
      markChanged();
      toast('success', okMsg);
      return true;
    } catch (e) {
      setTeams(prev);
      toast('error', `تعذّر الحفظ: ${e.message}`, 5000);
      return false;
    }
  };
  const teamIn = (d, id) => d.find((t) => t.id === id);

  /* ---------- العمليات (نفس منطق النظام القديم) ---------- */
  const h = {
    color: (team, c) => commit(mut((d) => { teamIn(d, team.id).color = c; }), 'تم تغيير لون الفريق'),

    editManager: (team) => setModal({ kind: 'manager', team }),
    rename: (team, eng) => setModal({ kind: 'rename', team, eng }),

    promote: async (team, eng) => {
      if (!(await confirm({ title: '⬆ تعيين مدير', message: `تعيين "${eng.name}" مديرًا لـ${teamLabel(team)}؟ (هيفضل موجود كمهندس في الفريق)`, confirmText: 'تعيين مدير' }))) return;
      commit(mut((d) => { teamIn(d, team.id).manager = eng.name; }), `تم تعيين ${eng.name} مديرًا للفريق`);
    },

    move: async (from, to, eng) => {
      if (!(await confirm({ title: '↔ نقل المهندس', message: `نقل "${eng.name}" من ${teamLabel(from)} إلى ${teamLabel(to)}؟`, confirmText: 'نقل المهندس' }))) return;
      commit(mut((d) => {
        const src = teamIn(d, from.id); const dst = teamIn(d, to.id);
        const moved = src.engineers.find((e) => e.id === eng.id);
        src.engineers = src.engineers.filter((e) => e.id !== eng.id);
        dst.engineers.push(moved);
      }), `تم نقل ${eng.name} إلى ${teamLabel(to)}`);
    },

    removeEng: async (team, eng) => {
      if (!(await confirm({ title: '🗑 حذف المهندس', message: `حذف "${eng.name}" من الفريق؟\nمش هيظهر في اللوحة بعد كده (بيانات مهامه المحفوظة بتفضل مخزنة) ومش هيقدر يدخل بحسابه القديم.`, confirmText: 'حذف المهندس' }))) return;
      commit(mut((d) => { const t = teamIn(d, team.id); t.engineers = t.engineers.filter((e) => e.id !== eng.id); }),
        `تم حذف ${eng.name}`, () => clearPasswords({ engineerIds: [eng.id] }));
    },

    removeTeam: async (team) => {
      if (team.engineers.length) { toast('error', `لازم تنقلي أو تحذفي كل مهندسي ${teamLabel(team)} (${n(team.engineers.length)}) قبل حذف الفريق.`, 5000); return; }
      if (!(await confirm({ title: '🗑 حذف الفريق', message: `حذف ${teamLabel(team)} نهائيًا؟`, confirmText: 'حذف الفريق' }))) return;
      commit(mut((d) => d.splice(d.findIndex((t) => t.id === team.id), 1)),
        'تم حذف الفريق', () => clearPasswords({ teamIds: [team.id] }));
    },

    resetPw: async (eng) => {
      if (!(await confirm({ title: '🔑 إعادة تعيين كلمة المرور', message: `هتتمسح كلمة مرور "${eng.name}"، وهيختار كلمة مرور جديدة عند أول دخول.`, confirmText: 'إعادة التعيين' }))) return;
      try { await clearPasswords({ engineerIds: [eng.id] }); toast('success', `تم مسح كلمة مرور ${eng.name}`); } catch (e) { toast('error', e.message, 5000); }
    },
    resetManagerPw: async (team) => {
      if (!(await confirm({ title: '🔑 إعادة تعيين كلمة المرور', message: `هتتمسح كلمة مرور مدير ${teamLabel(team)} (${team.manager}).`, confirmText: 'إعادة التعيين' }))) return;
      try { await clearPasswords({ teamIds: [team.id] }); toast('success', 'تم مسح كلمة مرور المدير'); } catch (e) { toast('error', e.message, 5000); }
    },
  };

  const createTeam = ({ manager }) => {
    const nums = teams.map((t) => parseInt(t.id.slice(1), 10) || 0);
    const num = (nums.length ? Math.max(...nums) : 0) + 1;
    const color = palette[(num - 1) % palette.length];
    return commit(mut((d) => d.push({ id: `t${num}`, color, manager: manager.trim(), engineers: [] })), `تم إنشاء فريق ${n(num)}`);
  };

  /* ---------- عرض ---------- */
  const term = q.trim().toLowerCase();
  const visible = teams
    .map((t) => ({ t, engs: t.engineers.filter((e) => !term || e.name.toLowerCase().includes(term)) }))
    .filter(({ engs }) => !term || engs.length);
  const totalEngs = teams.reduce((a, t) => a + t.engineers.length, 0);

  return (
    <>
      <PageHeader back title="إدارة الفرق" subtitle="الفرق والمدراء والمهندسين: نقل وتعيين وحذف وإعادة تعيين كلمات المرور" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">ابحثي عن مهندس</span>
          <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي عن مهندس في كل الفرق"
            className="w-full rounded-xl bg-white py-2.5 pe-4 ps-11 text-sm font-semibold outline-none ring-1 ring-slate-200 transition placeholder:text-slate-300 focus:ring-2 focus:ring-brand-400" />
        </label>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 ring-1 ring-slate-200">{n(teams.length)} فريق · {n(totalEngs)} مهندس</span>
        <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={() => setModal({ kind: 'team' })}>
          <PlusIcon className="h-4 w-4" />فريق جديد
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-14 text-center animate-rise">
          <p className="font-bold">{teams.length ? 'مفيش مهندس بالاسم ده' : 'لا توجد فرق بعد'}</p>
          <p className="text-sm text-slate-400">{teams.length ? 'جرّبي كلمة تانية.' : 'ابدئي بإنشاء أول فريق.'}</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {visible.map(({ t, engs }, i) => (
            <TeamCard key={t.id} team={t} engs={engs} movable={movable} palette={palette} delay={Math.min(i, 6) * 60} h={h} />
          ))}
        </div>
      )}

      {modal?.kind === 'team' && (
        <FormModal title="🏆 إنشاء فريق جديد" submitText="إنشاء الفريق" onClose={() => setModal(null)}
          fields={[{ name: 'manager', label: 'اسم مدير الفريق', required: true }]} onSubmit={createTeam} />
      )}
      {modal?.kind === 'manager' && (
        <FormModal title="✎ تعديل مدير الفريق" submitText="حفظ الاسم" onClose={() => setModal(null)}
          fields={[{ name: 'manager', label: 'اسم المدير', required: true, defaultValue: modal.team.manager }]}
          onSubmit={(v) => commit(mut((d) => { teamIn(d, modal.team.id).manager = v.manager.trim(); }), 'تم تحديث اسم المدير')} />
      )}
      {modal?.kind === 'rename' && (
        <FormModal title="✎ تعديل اسم المهندس" submitText="حفظ الاسم" onClose={() => setModal(null)}
          fields={[{ name: 'name', label: 'اسم المهندس', required: true, defaultValue: modal.eng.name }]}
          onSubmit={(v) => commit(mut((d) => {
            const t = teamIn(d, modal.team.id);
            const e = t.engineers.find((x) => x.id === modal.eng.id);
            if (t.manager === e.name) t.manager = v.name.trim(); // المدير بيتخزّن بالاسم، فنحدّثه معاه
            e.name = v.name.trim();
          }), 'تم تعديل الاسم')} />
      )}
    </>
  );
}
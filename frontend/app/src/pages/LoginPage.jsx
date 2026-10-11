import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { homeFor, teamLabel } from '../utils/helpers';

/* ---------- أيقونات SVG خفيفة (من غير مكتبات) ---------- */
const Icon = ({ d, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
);
const icons = {
  engineer: <Icon d={<><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>} />,
  team: <Icon d={<><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>} />,
  dept: <Icon d={<><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>} />,
  search: <Icon className="h-4 w-4" d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  lock: <Icon className="h-6 w-6" d={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>} />,
  check: <Icon className="h-4 w-4" d={<path d="M20 6L9 17l-5-5" />} />,
  chart: <Icon d={<><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>} />,
  folder: <Icon d={<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />} />,
  bell: <Icon d={<><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>} />,
};

const ROLES = [
  ['engineer', 'مهندس', icons.engineer],
  ['team', 'مدير فريق', icons.team],
  ['dept', 'مدير القسم', icons.dept],
];

const FEATURES = [
  [icons.chart, 'تقدّم لحظي', 'نسب إنجاز المشاريع والمهام لكل مهندس وفريق.'],
  [icons.folder, 'ملفات وجولات', 'مرفقات وT-Files بنسخها وجولاتها في مكان واحد.'],
  [icons.bell, 'إشعارات فورية', 'كل تحديث على مهامك يوصلك أول بأول.'],
];

export default function LoginPage() {
  const { teams, deptManager } = useData();
  const { session, login, hashFor, resetViaDept } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('engineer');
  const [id, setId] = useState(null);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => { if (session) nav(homeFor(session, teams), { replace: true }); }, [session]); // eslint-disable-line

  const pick = (r) => { setRole(r); setId(r === 'dept' ? 'dept' : null); setError(''); setQ(''); };
  const close = () => { setId(null); setForgot(false); setError(''); };
  const hasHash = id && !!hashFor(role, id);
  const selectedName = role === 'dept'
    ? deptManager
    : role === 'team'
      ? teams.find((t) => t.id === id)?.manager
      : teams.flatMap((t) => t.engineers).find((e) => e.id === id)?.name;

  /* فلترة المهندسين بالاسم */
  const engineerGroups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return teams
      .map((t) => ({ ...t, list: t.engineers.filter((e) => !term || (e.name || '').toLowerCase().includes(term)) }))
      .filter((t) => t.list.length);
  }, [teams, q]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const f = new FormData(e.target);
    try {
      if (forgot) {
        const err = await resetViaDept(role, id, f.get('dept'));
        if (err) setError(err); else setForgot(false);
      } else {
        const err = await login(role, id, f.get('p1'), f.get('p2'));
        if (err) setError(err);
      }
    } catch { setError('تعذّر تنفيذ العملية. تأكدي من اتصال الخادم وحاولي تاني.'); }
    finally { setBusy(false); }
  };

  /* كارت اختيار الشخص */
  const choice = (active) =>
    `group relative flex w-full items-center gap-3 rounded-2xl border p-3 text-start text-sm font-bold transition
     ${active
       ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-soft ring-4 ring-brand-500/10'
       : 'border-neutral-200 bg-white text-neutral-700 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft'}`;

  const Tick = ({ on }) => (
    <span className={`ms-auto grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${on ? 'bg-brand-600 text-white' : 'border border-neutral-200 text-transparent group-hover:border-brand-300'}`}>
      {icons.check}
    </span>
  );

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_1fr]">
      {/* ================= اللوحة الجانبية (ديسكتوب) ================= */}
      <aside className="relative hidden overflow-hidden border-e border-neutral-200/80 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-12 text-neutral-800 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -start-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -end-16 h-[28rem] w-[28rem] rounded-full bg-brand-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative flex items-center gap-3">
          <img src="/assets/logo.png" alt="logo" className="h-12 w-12 rounded-2xl bg-white object-contain p-2 shadow-soft ring-1 ring-brand-100" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-lg font-extrabold tracking-tight text-brand-900">لوحة متابعة العطاءات</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-extrabold leading-[1.35] text-brand-900 xl:text-5xl xl:leading-[1.3]">
            من كراسة الشروط<br />
            <span className="text-brand-600">لحد الترسية</span>، بخطوات واضحة.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#3C3C3B]">
            تابعي تقدّم الفرق والمهندسين والمشاريع وقسم الحصر في مكان واحد، لحظة بلحظة.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map(([icon, title, desc], i) => (
              <li key={title} className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-white/80 p-3.5 shadow-xs backdrop-blur-sm animate-rise" style={{ animationDelay: `${i * 120}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
                <div>
                  <p className="text-sm font-extrabold text-brand-900">{title}</p>
                  <p className="text-xs leading-relaxed text-neutral-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* كارت عائم للزينة */}
        <div className="pointer-events-none absolute bottom-24 end-10 hidden w-44 rounded-2xl border border-brand-100 bg-white p-4 text-neutral-800 shadow-lift animate-floaty xl:block">
          <p className="text-xs font-bold text-neutral-400">نسبة الإنجاز</p>
          <p className="mt-0.5 text-2xl font-extrabold text-brand-700">82%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full w-[82%] rounded-full bg-gradient-to-l from-brand-400 to-brand-600" /></div>
        </div>

        <p className="relative text-xs text-neutral-400">© لوحة متابعة العطاءات</p>
      </aside>

      {/* ================= نموذج الدخول ================= */}
      <main className="flex flex-col items-center justify-center p-4 sm:p-8">
        {/* لوجو للموبايل */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <img src="/assets/logo.png" alt="logo" className="h-11 w-11 rounded-2xl bg-white object-contain p-1.5 shadow-soft" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-base font-extrabold text-brand-800">لوحة متابعة العطاءات</span>
        </div>

        <div className="card w-full max-w-xl p-5 sm:p-8 animate-rise">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icons.lock}</span>
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">تسجيل الدخول</h2>
              <p className="text-xs text-neutral-500 sm:text-sm">اختاري صفتك، ثم اسمك، ثم أدخلي كلمة المرور.</p>
            </div>
          </div>

          {/* تبويب الدور */}
          <div role="tablist" className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-neutral-100 p-1">
            {ROLES.map(([r, label, icon]) => (
              <button
                key={r}
                role="tab"
                aria-selected={role === r}
                onClick={() => pick(r)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:flex-row sm:gap-2 sm:text-sm
                  ${role === r ? 'bg-white text-brand-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* بحث (للمهندسين فقط) */}
          {role === 'engineer' && (
            <div className="relative mt-4">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-neutral-400">{icons.search}</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي باسم المهندس..." className="input ps-9" />
            </div>
          )}

          {/* القوائم */}
          <div className="mt-4 max-h-[46vh] space-y-5 overflow-y-auto pe-1 sm:max-h-[50vh]">
            {role === 'engineer' && (
              engineerGroups.length ? engineerGroups.map((t) => (
                <section key={t.id}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    {teamLabel(t)} — {t.manager}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {t.list.map((e) => (
                      <button key={e.id} onClick={() => { setId(e.id); setError(''); }} className={choice(id === e.id)}>
                        <Avatar engineer={e} size={36} />
                        <span className="truncate">{e.name}</span>
                        <Tick on={id === e.id} />
                      </button>
                    ))}
                  </div>
                </section>
              )) : <p className="py-8 text-center text-sm text-neutral-400">مفيش نتائج مطابقة 🔍</p>
            )}

            {role === 'team' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {teams.map((t) => (
                  <button key={t.id} onClick={() => { setId(t.id); setError(''); }} className={choice(id === t.id)}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">{icons.team}</span>
                    <span className="min-w-0">
                      <span className="block truncate">{teamLabel(t)}</span>
                      <span className="block truncate text-xs font-semibold text-neutral-400">{t.manager}</span>
                    </span>
                    <Tick on={id === t.id} />
                  </button>
                ))}
              </div>
            )}

            {role === 'dept' && (
              <button onClick={() => setId('dept')} className={choice(id === 'dept')}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">{icons.dept}</span>
                <span className="min-w-0">
                  <span className="block">مدير القسم</span>
                  <span className="block truncate text-xs font-semibold text-neutral-400">{deptManager}</span>
                </span>
                <Tick on={id === 'dept'} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ================= مودال كلمة المرور ================= */}
      {id && (
        <Modal title={forgot ? 'استرجاع كلمة المرور' : hasHash ? 'تسجيل الدخول' : 'إنشاء كلمة المرور'} onClose={close}>
          <form onSubmit={submit} className="space-y-4">
            <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-center text-sm font-extrabold text-brand-700">{selectedName}</p>

            {forgot ? (
              <>
                <p className="text-xs leading-relaxed text-neutral-500">استرجاع كلمة المرور يحتاج تأكيد كلمة مرور مدير القسم.</p>
                <div><label className="label">كلمة مرور مدير القسم</label><input name="dept" type="password" className="input" autoFocus /></div>
              </>
            ) : hasHash ? (
              <div><label className="label">كلمة المرور</label><input name="p1" type="password" className="input" autoFocus autoComplete="current-password" /></div>
            ) : (
              <>
                <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">أول دخول لهذا الحساب — اختاري كلمة مرور جديدة (4 حروف/أرقام على الأقل).</p>
                <div><label className="label">كلمة المرور الجديدة</label><input name="p1" type="password" className="input" autoFocus autoComplete="new-password" /></div>
                <div><label className="label">تأكيد كلمة المرور</label><input name="p2" type="password" className="input" autoComplete="new-password" /></div>
              </>
            )}

            {error && <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-600">⚠ {error}</p>}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'جاري التنفيذ...' : forgot ? 'تأكيد وإعادة التعيين' : hasHash ? 'دخول' : 'إنشاء الحساب والدخول'}
            </button>

            {hasHash && !forgot && role !== 'dept' && (
              <button type="button" className="btn-ghost w-full" onClick={() => { setForgot(true); setError(''); }}>نسيت كلمة المرور؟</button>
            )}
            {forgot && (
              <button type="button" className="btn-ghost w-full" onClick={() => { setForgot(false); setError(''); }}>رجوع</button>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
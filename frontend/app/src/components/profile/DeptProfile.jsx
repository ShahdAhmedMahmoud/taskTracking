import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useUI } from '../../hooks/useUI';
import useCountUp from '../../hooks/useCountUp';
import Avatar from '../ui/Avatar';
import Panel from '../ui/Panel';
import {
  CalendarIcon, ShieldIcon, UserIcon, KeyIcon, LockIcon, EyeIcon, EyeOffIcon, LogoutIcon, CheckIcon,
  TeamsIcon, ProjectsIcon, SettingsIcon, MailIcon, ArchiveIcon,
} from '../ui/Icons';
import { mainTeams } from '../../utils/helpers';
import { collectProjects } from '../../utils/dashboardData';

const PERMISSIONS = [
  [TeamsIcon, 'إدارة الفرق والمهندسين'],
  [ProjectsIcon, 'متابعة مشاريع ومهام كل الفرق'],
  [SettingsIcon, 'الحقول الديناميكية والماستر داتا'],
  [MailIcon, 'إعدادات اللوحة والبريد'],
  [ArchiveIcon, 'الأرشيف والمشاريع المحذوفة'],
  [KeyIcon, 'الأمان وإعادة تعيين كلمات المرور'],
];

const LEVELS = [
  ['', 'bg-slate-200'],
  ['ضعيفة', 'bg-rose-400'],
  ['متوسطة', 'bg-amber-400'],
  ['جيدة', 'bg-emerald-400'],
  ['قوية', 'bg-brand-600'],
];

const strength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 4) s += 1;
  if (p.length >= 8) s += 1;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s += 1;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s += 1;
  return s;
};

const greeting = () => (new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');

function MiniStat({ label, value }) {
  const v = useCountUp(value);
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20">
      <p className="text-3xl font-extrabold tabular-nums">{v.toLocaleString('ar-EG')}</p>
      <p className="text-sm font-semibold text-white/70">{label}</p>
    </div>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const { toast } = useUI();
  const [show, setShow] = useState(false);
  const [v, setV] = useState({ old: '', n1: '', n2: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setV((s) => ({ ...s, [k]: e.target.value })); setError(''); };
  const score = strength(v.n1);
  const mismatch = v.n2 && v.n1 !== v.n2;
  const match = v.n2 && v.n1 === v.n2;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const err = await changePassword(v.old, v.n1, v.n2);
      if (err) setError(err);
      else { setV({ old: '', n1: '', n2: '' }); toast('success', 'تم تغيير كلمة المرور'); }
    } catch (x) { setError(x.message || 'تعذّر تغيير كلمة المرور'); }
    finally { setBusy(false); }
  };

  const field = (name, label, auto) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={v[name]} onChange={set(name)} autoComplete={auto} className="input pe-12" />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'إخفاء' : 'إظهار'}
          className="absolute inset-y-0 end-2 my-auto grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-700">
          {show ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {field('old', 'كلمة المرور الحالية', 'current-password')}
      {field('n1', 'كلمة المرور الجديدة', 'new-password')}

      {v.n1 && (
        <div className="animate-rise">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${score >= i ? LEVELS[score][1] : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="mt-1.5 text-xs font-bold text-slate-400">قوة كلمة المرور: <span className="text-slate-700">{LEVELS[score][0]}</span></p>
        </div>
      )}

      {field('n2', 'تأكيد كلمة المرور الجديدة', 'new-password')}
      {mismatch && <p className="text-sm font-bold text-rose-600">كلمتا المرور غير متطابقتين</p>}
      {match && <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-600"><CheckIcon className="h-4 w-4" />متطابقتان</p>}

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-600">⚠ {error}</p>}

      <button className="btn-primary w-full !py-3" disabled={busy || !v.old || !v.n1 || !v.n2}>
        {busy ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
      </button>
    </form>
  );
}

export default function DeptProfile() {
  const { session, logout } = useAuth();
  const { teams, engineers, deptManager } = useData();
  const nav = useNavigate();
  const name = deptManager || session?.name || '';

  const main = useMemo(() => mainTeams(teams), [teams]);
  const projectsCount = useMemo(() => collectProjects(main, engineers).length, [main, engineers]);
  const engineersCount = main.reduce((a, t) => a + t.engineers.length, 0);

  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const rows = [
    [UserIcon, 'الاسم', name],
    [ShieldIcon, 'الصفة', 'مدير القسم'],
    [KeyIcon, 'مستوى الوصول', 'صلاحيات كاملة على اللوحة'],
  ];

  return (
    <div className="space-y-6">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-6 text-white shadow-lift animate-rise sm:p-8">
        <div className="pointer-events-none absolute -start-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative shrink-0">
            <div className="rounded-full bg-white/20 p-1.5 ring-1 ring-white/30">
              <div className="overflow-hidden rounded-full ring-4 ring-white/80"><Avatar engineer={{ name }} size={96} /></div>
            </div>
            <span className="absolute bottom-1 end-1 h-5 w-5 rounded-full border-4 border-brand-800 bg-emerald-400" title="جلسة نشطة" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-bold backdrop-blur">
              <CalendarIcon className="h-4 w-4" />{today}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">{greeting()}، {name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-brand-800"><ShieldIcon className="h-4 w-4" />مدير القسم</span>
              <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold text-white/90 ring-1 ring-white/20">صلاحيات كاملة على اللوحة</span>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
            <MiniStat label="فرق" value={main.length} />
            <MiniStat label="مهندس" value={engineersCount} />
            <MiniStat label="مشروع" value={projectsCount} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* ===== الحساب ===== */}
        <div className="space-y-4 lg:col-span-7">
          <Panel delay={60} title="الحساب" subtitle="بيانات حسابك الحالية">
            <dl className="space-y-1">
              {rows.map(([Icon, label, value]) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl p-3.5 transition duration-300 hover:bg-slate-50">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
                  <div className="min-w-0">
                    <dt className="text-sm font-semibold text-slate-400">{label}</dt>
                    <dd className="truncate text-lg font-extrabold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              <LockIcon className="h-4 w-4 shrink-0" />بيانات الحساب للعرض فقط.
            </p>
          </Panel>

          <Panel delay={120} title="صلاحياتك" subtitle="اللي تقدري تعمليه على اللوحة">
            <div className="grid gap-3 sm:grid-cols-2">
              {PERMISSIONS.map(([Icon, text], i) => (
                <div key={text} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition duration-300 animate-rise hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft" style={{ animationDelay: `${150 + i * 50}ms` }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white"><Icon className="h-5 w-5" /></span>
                  <span className="text-sm font-bold">{text}</span>
                  <CheckIcon className="ms-auto h-5 w-5 shrink-0 text-emerald-500" />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ===== إدارة الجلسة ===== */}
        <div className="space-y-4 lg:col-span-5">
          <Panel delay={90} title="إدارة الجلسة" subtitle="الأمان وتسجيل الخروج">
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
              <span className="relative grid h-3 w-3 place-items-center"><span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60" /><span className="h-3 w-3 rounded-full bg-emerald-500" /></span>
              <div>
                <p className="text-sm font-extrabold text-emerald-800">جلسة نشطة</p>
                <p className="text-xs text-emerald-700/80">الجلسة محفوظة على هذا المتصفح لحد ما تسجّلي خروج.</p>
              </div>
            </div>

            <h3 className="mb-4 mt-6 flex items-center gap-2 text-base font-extrabold"><KeyIcon className="h-5 w-5 text-brand-600" />تغيير كلمة المرور</h3>
            <PasswordForm />

            <div className="mt-6 border-t border-slate-100 pt-5">
              <button
                onClick={() => { logout(); nav('/login'); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition duration-300 hover:bg-rose-600 hover:text-white active:scale-[.98]"
              >
                <LogoutIcon className="h-5 w-5" />تسجيل خروج
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
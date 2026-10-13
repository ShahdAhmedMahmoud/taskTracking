import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import Avatar from '../components/ui/Avatar';
import ProgressRing from '../components/ui/ProgressRing';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import DeptProfile from '../components/profile/DeptProfile';
import LocalProfileEditor from '../components/profile/LocalProfileEditor';
import {
  CalendarIcon, CheckIcon, ClockIcon, TrophyIcon, ProjectsIcon, MailIcon, LogoutIcon,
  PencilIcon, SaveIcon, ShieldIcon, UserIcon, TeamsIcon,
} from '../components/ui/Icons';
import { teamLabel } from '../utils/helpers';
import { projectProgress, stateCounts, n } from '../utils/dashboardData';

/* ---------- أدوات مشتركة ---------- */
const greeting = () => (new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير');
const todayText = () => new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

const readAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(new Error('تعذّر قراءة الصورة'));
  r.readAsDataURL(file);
});

/** قص مربع من المنتصف + ضغط لـ 480px JPEG عشان الـ roster ما يتقلش */
async function toAvatarData(file, max = 480) {
  const src = await readAsDataURL(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('ملف الصورة غير صالح'));
    i.src = src;
  });
  const side = Math.min(img.width, img.height);
  const size = Math.min(max, side);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG الشفاف ما يطلعش أسود في JPEG
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.86);
}

function LogoutButton() {
  const { logout } = useAuth();
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => { logout(); nav('/login'); }}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-600 transition duration-300 hover:bg-brand-600 hover:text-white active:scale-[.98]"
    >
      <LogoutIcon className="h-5 w-5" />تسجيل خروج
    </button>
  );
}

/* =====================================================================
   مدير الفريق: تعديل بيانات محلي في الواجهة
   ===================================================================== */
function ManagerProfile() {
  const { session } = useAuth();
  const { teams } = useData();
  const team = teams.find((t) => t.id === session.id);

  const rows = [
    [UserIcon, 'الاسم', session.name],
    [ShieldIcon, 'الصفة', 'مدير الفريق'],
    [TeamsIcon, 'الفريق', team ? teamLabel(team) : '—'],
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-6 text-neutral-800 shadow-soft animate-rise sm:p-8">
        <div className="pointer-events-none absolute -start-16 -top-16 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="rounded-full bg-white/80 p-1.5 ring-1 ring-brand-200 backdrop-blur">
            <div className="overflow-hidden rounded-full"><Avatar engineer={{ name: session.name }} size={88} /></div>
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200/70 backdrop-blur">
              <CalendarIcon className="h-4 w-4 text-brand-600" />{todayText()}
            </p>
            <h1 className="mt-3 truncate text-3xl font-extrabold text-brand-900 sm:text-4xl">{greeting()}، {session.name}</h1>
            <p className="mt-1 text-sm font-semibold text-[#3C3C3B]">مدير الفريق</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <LocalProfileEditor
            name={session.name}
            role="مدير الفريق"
            teamName={team ? teamLabel(team) : ''}
            teamOptions={teams.filter((item) => item.type !== 'hasr').map(teamLabel)}
            roleOptions={['مشرف فريق', 'مسؤول الفريق']}
            accessOptions={['مشاهدة فقط', 'إدارة الفريق', 'مدير النظام']}
          />
          <Panel delay={60} title="الحساب" subtitle="بيانات الفريق والصلاحية">
            <dl className="space-y-1">
              {rows.filter(([, label]) => label !== 'الاسم').map(([Icon, label, value]) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl p-3.5 transition duration-300 hover:bg-neutral-50">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
                  <div className="min-w-0">
                    <dt className="text-sm font-semibold text-neutral-400">{label}</dt>
                    <dd className="truncate text-lg font-extrabold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <Panel className="lg:col-span-5" delay={120} title="إدارة الجلسة" subtitle="تسجيل الخروج">
          <LogoutButton />
        </Panel>
      </div>
    </div>
  );
}

/* =====================================================================
   المهندس: تعديل البروفايل والصورة
   ===================================================================== */
function EngineerProfile() {
  const { session } = useAuth();
  const { teams, engineers, patchEngineerInfo } = useData();
  const { toast } = useUI();
  const fileRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const eng = useMemo(() => teams.flatMap((t) => t.engineers).find((e) => e.id === session.id), [teams, session.id]);
  const team = useMemo(() => teams.find((t) => t.engineers?.some((e) => e.id === session.id)), [teams, session.id]);

  /* إحصائيات المهندس بنفس تصنيف الرئيسية */
  const stats = useMemo(() => {
    if (!eng) return null;
    const all = (engineers[eng.id]?.projects || []).map((p) => ({ p, engineer: eng, team }));
    const running = all.filter(({ p }) => !p.finished);
    const avg = running.length
      ? Math.round(running.reduce((a, { p }) => a + projectProgress(p).pct, 0) / running.length)
      : 0;
    return { ...stateCounts(all), avg };
  }, [eng, engineers, team]);

  const photoSrc = preview || eng?.photoData;

  const upload = async (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return toast('error', 'اختاري صورة PNG أو JPG أو WEBP');
    if (file.size > 8 * 1024 * 1024) return toast('error', 'الصورة كبيرة جداً (الحد الأقصى 8 ميجابايت)');

    try {
      const photoData = await toAvatarData(file);
      setPreview(photoData);
      setDirty(true);
    } catch (e) {
      toast('error', `تعذّر تجهيز الصورة: ${e.message}`, 5000);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: String(f.get('name') || '').trim(),
      companyEmail: String(f.get('email') || '').trim(),
      phoneNumber: String(f.get('phone') || '').trim(),
      employeeCode: String(f.get('code') || '').trim(),
      photoData: preview || eng?.photoData || null,
    };
    if (!payload.name) return toast('error', 'اكتبي الاسم');
    if (payload.phoneNumber && !/^[0-9+\s-]{8,15}$/.test(payload.phoneNumber)) {
      return toast('error', 'رقم التليفون غير صالح');
    }

    setBusy(true);
    patchEngineerInfo(session.id, payload);
    setPreview(null);
    setDirty(false);
    setBusy(false);
    toast('success', 'تم تحديث البيانات في الواجهة. الحفظ الدائم يحتاج ربط Backend.');
  };

  return (
    <div className="space-y-6">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-6 pb-20 text-neutral-800 shadow-soft animate-rise sm:p-8 sm:pb-20">
        <div className="pointer-events-none absolute -start-16 -top-16 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative shrink-0">
              <div className="rounded-full bg-white/80 p-1.5 ring-1 ring-brand-200 backdrop-blur transition duration-500 hover:ring-brand-400">
                <div className="overflow-hidden rounded-full">
                  <Avatar engineer={{ ...eng, name: eng?.name || session.name, photoData: photoSrc }} size={96} />
                </div>
              </div>
              <button
                type="button" onClick={() => fileRef.current?.click()} title="اختيار صورة" aria-label="اختيار صورة"
                className="absolute -bottom-1 -end-1 grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700 shadow-md ring-2 ring-brand-200 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-50 disabled:opacity-60"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <input
                ref={fileRef} type="file" hidden accept={ALLOWED.join(',')}
                onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>

            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200/70 backdrop-blur">
                <CalendarIcon className="h-4 w-4 text-brand-600" />{todayText()}
              </p>
              <h1 className="mt-3 truncate text-3xl font-extrabold text-brand-900 sm:text-4xl">{greeting()}، {eng?.name || session.name}</h1>
              <p className="mt-1 text-base text-[#3C3C3B]">مهندس{team ? ` · ${teamLabel(team)}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {eng?.employeeCode && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200/80 shadow-xs">الكود: {eng.employeeCode}</span>}
                {eng?.companyEmail && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200/80 shadow-xs">{eng.companyEmail}</span>}
              </div>
            </div>
          </div>

          {stats && (
            <div className="flex w-full items-center gap-5 rounded-2xl bg-white/80 p-5 ring-1 ring-brand-200/60 shadow-sm backdrop-blur sm:w-auto">
              <ProgressRing pct={stats.avg} size={112} stroke={11} tone="brand" />
              <div>
                <p className="text-sm font-bold text-neutral-500">متوسط إنجاز الجاري</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-900">{n(stats.avg)}%</p>
                <p className="mt-1 text-sm text-neutral-400">{n(stats.running)} مشروع جاري</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== الكروت (بتطلع فوق الـ hero) ===== */}
      {stats && (
        <div className="relative z-10 -mt-12 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:px-4 xl:grid-cols-4">
          <StatCard featured delay={0} to="/my-tasks" icon={<ProjectsIcon />} label="إجمالي مشاريعي" value={stats.total} hint={`${n(stats.delivered)} تم تسليمه`} />
          <StatCard delay={70} to="/my-tasks" icon={<ClockIcon />} label="جارية" value={stats.running} tone="sky" hint={stats.running ? `متوسط ${n(stats.avg)}%` : 'لا يوجد جاري'} />
          <StatCard delay={140} icon={<CheckIcon />} label="تم التسليم" value={stats.delivered} tone="brand" hint={`${n(stats.won)} فوز · ${n(stats.lost)} خسارة · ${n(stats.pending)} معلق`} />
          <StatCard delay={210} icon={<TrophyIcon />} label="نسبة الفوز" value={stats.winPct} suffix="%" tone="amber" hint={stats.decided ? `من ${n(stats.decided)} نتيجة` : 'لا نتائج بعد'} />
        </div>
      )}

      {/* ===== الفورم + الفريق والجلسة ===== */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7" delay={80} title="البيانات الشخصية" subtitle="عدّلي بياناتك واختاري صورة شخصية">
          <form onSubmit={submit} onChange={() => setDirty(true)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">الاسم</label>
                <input name="name" className="input" defaultValue={eng?.name || session.name || ''} placeholder="الاسم بالكامل" />
              </div>

              <div>
                <label className="label flex items-center gap-1.5"><MailIcon className="h-3.5 w-3.5 text-neutral-400" />إيميل الشركة</label>
                <input name="email" type="email" className="input" defaultValue={eng?.companyEmail || ''} placeholder="name@company.com" />
              </div>

              <div>
                <label className="label">رقم التليفون</label>
                <input name="phone" type="tel" className="input" defaultValue={eng?.phoneNumber || ''} placeholder="01xxxxxxxxx" />
              </div>

              <div className="sm:col-span-2">
                <label className="label">الكود الوظيفي</label>
                <input name="code" className="input" defaultValue={eng?.employeeCode || ''} placeholder="EMP-000" />
              </div>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${dirty ? 'border-brand-200 bg-brand-50/80 shadow-soft' : 'border-neutral-100 bg-neutral-50'}`}>
              <p className={`text-sm font-semibold ${dirty ? 'text-brand-600' : 'text-neutral-400'}`}>
                {dirty ? 'في تعديلات غير محفوظة' : 'كل البيانات محفوظة'}
              </p>
              <div className="flex gap-2">
                <Link to="/my-tasks" className="btn-ghost">مشاريعي</Link>
                <button type="submit" disabled={busy || !dirty} className="btn-primary min-w-[150px] hover:-translate-y-0.5 disabled:translate-y-0">
                  {busy
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جاري الحفظ</>
                    : <><SaveIcon className="h-4 w-4" />حفظ البروفايل</>}
                </button>
              </div>
            </div>
          </form>
        </Panel>

        <div className="space-y-4 lg:col-span-5">
          <Panel delay={140} title="الفريق" subtitle="أنتِ تابعة للفريق ده">
            {team ? (
              <div className="flex items-center gap-4 rounded-2xl border border-neutral-100 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white shadow-md">
                  {(team.label || team.manager || 'ف')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold">{teamLabel(team)}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">المدير: {team.manager || '—'} · {n(team.engineers?.length || 0)} مهندس</p>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-neutral-400">غير مرتبط بفريق</p>
            )}
          </Panel>

          <Panel delay={200} title="الجلسة" subtitle="إعدادات الحساب">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                <span className="text-sm font-semibold text-neutral-500">الدور</span>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700 ring-1 ring-brand-100">مهندس</span>
              </div>
              <LogoutButton />
            </div>
          </Panel>
        </div>
      </div>

      <p className={`text-center text-xs text-neutral-400 transition duration-700 ${ready ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
        التعديلات والصورة للمعاينة داخل الواجهة فقط؛ الحفظ الدائم ومشاركة الصورة يحتاجان Backend. الصور المسموحة: PNG / JPG / WEBP
      </p>
    </div>
  );
}

/* =====================================================================
   الراوتر الداخلي حسب الدور
   ===================================================================== */
export default function ProfilePage() {
  const { session } = useAuth();
  if (session?.role === 'dept') return <DeptProfile />;
  if (session?.role === 'engineer') return <EngineerProfile />;
  return <ManagerProfile />;
}

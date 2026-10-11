import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import { useRefreshOnLeave } from '../hooks/useRefreshOnLeave';
import { getRoster, putRoster } from '../services/adminService';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import { TickIcon } from '../components/engineer/EngineerIcons';
import { teamLabel } from '../utils/helpers';
import { n } from '../utils/dashboardData';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,15}$/;
const latin = (s) => s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); // أرقام عربية → إنجليزية
const EMPTY = { teamId: '', name: '', email: '', phone: '', code: '' };

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AddEmployeePage() {
  const { teams, init } = useData();
  const { toast } = useUI();
  const markChanged = useRefreshOnLeave();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const options = useMemo(() => teams.filter((t) => t.type !== 'hasr'), [teams]);
  const preset = sp.get('team');
  const [form, setForm] = useState({ ...EMPTY, teamId: options.some((t) => t.id === preset) ? preset : '' });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const all = useMemo(() => teams.flatMap((t) => t.engineers), [teams]);
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = latin(form.phone.trim());
  const code = form.code.trim();
  const team = options.find((t) => t.id === form.teamId);

  const errors = {
    teamId: form.teamId ? '' : 'اختاري الفريق',
    name: !name ? 'اكتبي اسم الموظف' : name.length < 3 ? 'الاسم قصير جدًا' : '',
    email: email && !EMAIL_RE.test(email) ? 'صيغة الإيميل غير صحيحة'
      : email && all.some((e) => (e.companyEmail || '').toLowerCase() === email.toLowerCase()) ? 'الإيميل ده مسجّل لموظف تاني' : '',
    phone: phone && !PHONE_RE.test(phone) ? 'رقم التليفون غير صحيح' : '',
    code: code && all.some((e) => (e.employeeCode || '').toLowerCase() === code.toLowerCase()) ? 'الكود الوظيفي ده مستخدم قبل كده' : '',
  };
  const sameName = name && all.some((e) => e.name.trim() === name);
  const show = (k) => (touched[k] ? errors[k] : '');

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ teamId: true, name: true, email: true, phone: true, code: true });
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    try {
      const fresh = await getRoster(); // نسخة طازة عشان ما نمسحش تغييرات حد تاني
      const list = fresh?.teams?.length ? fresh.teams : JSON.parse(JSON.stringify(teams));
      const target = list.find((t) => t.id === form.teamId);
      if (!target) throw new Error('الفريق غير موجود');
      const id = `${target.id}e_${Date.now().toString(36)}`;
      target.engineers.push({ id, name, companyEmail: email, phoneNumber: phone, employeeCode: code, photoData: null });
      await putRoster(list);
      markChanged();
      setDone({ id, name, team: target });
      toast('success', 'تمت إضافة الموظف');
    } catch (err) {
      toast('error', `تعذّرت الإضافة: ${err.message}`, 5000);
    } finally {
      setBusy(false);
    }
  };

  const openEngineer = async () => { await init?.(); nav(`/engineers/${done.id}`); };
  const another = () => { setDone(null); setTouched({}); setForm({ ...EMPTY, teamId: form.teamId }); };

  /* ================= شاشة النجاح ================= */
  if (done) {
    return (
      <>
        <PageHeader back title="إضافة موظف" />
        <div className="card mx-auto max-w-xl p-8 text-center animate-rise">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60"><TickIcon className="h-8 w-8" /></span>
          <h2 className="mt-4 text-xl font-extrabold">تمت إضافة {done.name}</h2>
          <p className="mt-1 text-sm text-slate-400">إلى {teamLabel(done.team)} · مدير الفريق: {done.team.manager}</p>
          <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-800">
            الموظف هيختار كلمة المرور بنفسه أول ما يسجّل دخول باسمه.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={openEngineer}>فتح صفحة الموظف</button>
            <button type="button" onClick={another} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-slate-200 transition hover:bg-brand-50">إضافة موظف آخر</button>
            <Link to="/manage-teams" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100">إدارة الفرق</Link>
          </div>
        </div>
      </>
    );
  }

  /* ================= الفورم ================= */
  return (
    <>
      <PageHeader back title="إضافة موظف" subtitle="أضيفي موظف جديد لفريق، وبياناته بتظهر فورًا في النظام" />

      <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          {/* 1) الفريق */}
          <section className="card p-5 animate-rise">
            <h2 className="mb-1 flex items-center gap-2.5 font-extrabold"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm text-white">١</span>اختاري الفريق</h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="الفريق">
              {options.map((t) => {
                const on = form.teamId === t.id;
                return (
                  <button
                    key={t.id} type="button" role="radio" aria-checked={on} onClick={() => { setForm((f) => ({ ...f, teamId: t.id })); touch('teamId')(); }}
                    className={`flex items-center gap-3 rounded-2xl p-3.5 text-start ring-1 transition duration-300 ${on ? 'bg-brand-50 shadow-soft ring-2 ring-brand-500' : 'bg-white ring-slate-200 hover:-translate-y-0.5 hover:ring-brand-200'}`}
                  >
                    <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: t.color || '#6F7DD0' }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{teamLabel(t)}</span>
                      <span className="block truncate text-xs text-slate-400">{t.manager} · {n(t.engineers.length)} مهندس</span>
                    </span>
                    <span className={`grid h-6 w-6 place-items-center rounded-full transition duration-300 ${on ? 'scale-100 bg-brand-600 text-white' : 'scale-75 bg-slate-100 text-transparent'}`}><TickIcon className="h-3.5 w-3.5" /></span>
                  </button>
                );
              })}
            </div>
            {show('teamId') && <p className="mt-2 text-xs font-bold text-rose-600">{errors.teamId}</p>}
          </section>

          {/* 2) البيانات */}
          <section className="card p-5 animate-rise" style={{ animationDelay: '80ms' }}>
            <h2 className="mb-4 flex items-center gap-2.5 font-extrabold"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm text-white">٢</span>بيانات الموظف</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="الاسم بالكامل" error={show('name')} hint={sameName ? undefined : undefined}>
                  <input className="input" value={form.name} onChange={set('name')} onBlur={touch('name')} placeholder="مثال: أحمد محمد علي" />
                  {sameName && !show('name') && <p className="mt-1.5 text-xs font-bold text-amber-600">فيه موظف بنفس الاسم بالفعل، اتأكدي إنه مش مكرر.</p>}
                </Field>
              </div>
              <Field label="إيميل الشركة" error={show('email')} hint="اختياري">
                <input type="email" className="input" value={form.email} onChange={set('email')} onBlur={touch('email')} placeholder="name@company.com" />
              </Field>
              <Field label="رقم التليفون" error={show('phone')} hint="اختياري">
                <input type="tel" className="input" value={form.phone} onChange={set('phone')} onBlur={touch('phone')} placeholder="01xxxxxxxxx" />
              </Field>
              <Field label="الكود الوظيفي" error={show('code')} hint="اختياري">
                <input className="input" value={form.code} onChange={set('code')} onBlur={touch('code')} />
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link to="/manage-teams" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100">إلغاء</Link>
            <button className="btn-primary" disabled={busy}>{busy ? 'جاري الإضافة…' : 'إضافة الموظف'}</button>
          </div>
        </div>

        {/* معاينة حيّة */}
        <aside className="lg:col-span-5">
          <div className="card overflow-hidden lg:sticky lg:top-4 animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="h-20 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600" />
            <div className="-mt-10 flex flex-col items-center px-5 pb-6 text-center">
              <div className="rounded-full bg-white p-1 shadow-soft"><Avatar engineer={{ name: name || '؟' }} size={80} /></div>
              <h3 className="mt-3 text-lg font-extrabold">{name || 'اسم الموظف'}</h3>
              <p className="text-sm text-slate-400">{team ? teamLabel(team) : 'لم يُختر فريق'}</p>
              <dl className="mt-5 w-full space-y-2 text-start text-sm">
                {[['المدير', team?.manager], ['الإيميل', email], ['التليفون', phone], ['الكود الوظيفي', code]].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <dt className="text-xs font-bold text-slate-400">{l}</dt>
                    <dd className="truncate font-bold text-slate-700">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
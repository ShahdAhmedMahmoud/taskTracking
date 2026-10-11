import { useEffect, useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import { useRefreshOnLeave } from '../hooks/useRefreshOnLeave';
import { getConfig, putConfig } from '../services/adminService';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import { TickIcon } from '../components/engineer/EngineerIcons';
import { n } from '../utils/dashboardData';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULTS = {
  enabled: false, host: '', port: 587, enableSsl: true, from: '', userName: '', password: '',
  includeProjectOwner: true, includeTeamMembers: true, defaultRecipients: [],
};
const PRESETS = [
  ['Gmail', 'smtp.gmail.com', 587],
  ['Office 365', 'smtp.office365.com', 587],
  ['Outlook.com', 'smtp-mail.outlook.com', 587],
];

const norm = (cfg) => ({ ...DEFAULTS, ...(cfg?.emailSettings || {}), defaultRecipients: [...(cfg?.emailSettings?.defaultRecipients || [])] });

/* ================= عناصر ================= */
function Switch({ checked, onChange, label, hint }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-start ring-1 transition duration-300 ${checked ? 'bg-brand-50/60 ring-brand-200' : 'bg-white ring-slate-200 hover:ring-brand-200'}`}
    >
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${checked ? 'start-6' : 'start-1'}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{label}</span>
        {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      </span>
    </button>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p>}
    </div>
  );
}

function RecipientsInput({ value, onChange }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const add = (raw) => {
    const parts = raw.split(/[,\s;،]+/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const bad = parts.find((p) => !EMAIL_RE.test(p));
    if (bad) { setErr(`«${bad}» مش إيميل صحيح`); return; }
    setErr('');
    onChange([...new Set([...value, ...parts.map((p) => p.toLowerCase())])]);
    setText('');
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-200 transition focus-within:ring-2 focus-within:ring-brand-400">
        {value.map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pe-1.5 ps-3 text-xs font-bold text-brand-800 ring-1 ring-brand-200" dir="ltr">
            {r}
            <button type="button" aria-label={`حذف ${r}`} onClick={() => onChange(value.filter((x) => x !== r))} className="grid h-5 w-5 place-items-center rounded-full text-brand-600 transition hover:bg-brand-600 hover:text-white">×</button>
          </span>
        ))}
        <input
          value={text} onChange={(e) => { setText(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (['Enter', ',', ';'].includes(e.key)) { e.preventDefault(); add(text); } }}
          onBlur={() => add(text)} dir="ltr" placeholder={value.length ? '' : 'admin@company.com'}
          className="min-w-[10rem] flex-1 bg-transparent px-2 py-1.5 text-sm font-semibold outline-none placeholder:text-slate-300"
        />
      </div>
      {err ? <p className="mt-1.5 text-xs font-bold text-rose-600">{err}</p> : <p className="mt-1.5 text-xs text-slate-400">اكتبي الإيميل واضغطي Enter لإضافته.</p>}
    </div>
  );
}

/* ================= الصفحة ================= */
export default function EmailSettingsPage() {
  const { config, deptManager } = useData();
  const { toast } = useUI();
  const markChanged = useRefreshOnLeave();
  const [base, setBase] = useState(config || null); // آخر نسخة من الخادم (لباقي حقول الإعدادات)
  const [form, setForm] = useState(() => norm(config));
  const [initial, setInitial] = useState(() => JSON.stringify(norm(config)));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getConfig()
      .then((c) => { setBase(c); const f = norm(c); setForm(f); setInitial(JSON.stringify(f)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const up = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const ev = (k, cast = (x) => x) => (e) => up(k)(cast(e.target.value));
  const dirty = JSON.stringify(form) !== initial;

  const errors = {
    host: form.enabled && !form.host.trim() ? 'اكتبي عنوان خادم SMTP' : '',
    port: form.enabled && !(form.port >= 1 && form.port <= 65535) ? 'منفذ غير صحيح' : '',
    from: form.enabled && !EMAIL_RE.test(form.from.trim()) ? 'اكتبي إيميل مرسل صحيح' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const err = (k) => (submitted ? errors[k] : '');

  const checks = [
    ['خادم SMTP', !!form.host.trim()],
    ['المنفذ', form.port >= 1 && form.port <= 65535],
    ['إيميل المرسل', EMAIL_RE.test(form.from.trim())],
    ['اسم المستخدم', !!form.userName.trim()],
    ['كلمة المرور', !!form.password],
  ];
  const recipientsCount = (form.includeProjectOwner ? 1 : 0) + (form.includeTeamMembers ? 1 : 0) + form.defaultRecipients.length;

  const save = async () => {
    setSubmitted(true);
    if (hasErrors) { toast('error', 'راجعي الحقول المطلوبة'); return; }
    setBusy(true);
    try {
      /* نفس الـ payload بتاع النظام القديم */
      await putConfig({
        deptManager: deptManager || base?.deptManager || '',
        projectDefaults: {
          name: base?.projectDefaults?.name || '',
          deliveryDate: base?.projectDefaults?.deliveryDate || '',
          inquiryDate: base?.projectDefaults?.inquiryDate || '',
        },
        emailSettings: {
          ...form,
          host: form.host.trim(), from: form.from.trim(), userName: form.userName.trim(), password: form.password.trim(),
          port: Number(form.port || 587),
        },
      });
      const fresh = await getConfig();
      setBase(fresh);
      const f = norm(fresh);
      setForm(f); setInitial(JSON.stringify(f)); setSubmitted(false);
      markChanged();
      toast('success', 'تم حفظ إعدادات البريد');
    } catch (e) {
      toast('error', `تعذّر حفظ إعدادات البريد: ${e.message}`, 5000);
    } finally {
      setBusy(false);
    }
  };

  const summary = useMemo(() => [
    form.includeProjectOwner && 'صاحب المشروع',
    form.includeTeamMembers && 'أعضاء الفريق',
    form.defaultRecipients.length > 0 && `${n(form.defaultRecipients.length)} إيميل إضافي`,
  ].filter(Boolean), [form]);

  return (
    <>
      <PageHeader back title="إعدادات البريد" subtitle="إرسال إشعار بالبريد عند إنشاء مشروع جديد" />

      <div className={`grid gap-5 lg:grid-cols-12 ${loading ? 'opacity-60' : ''} transition-opacity duration-500`}>
        <div className="space-y-5 lg:col-span-8">
          {/* التفعيل */}
          <div className="animate-rise">
            <Switch checked={form.enabled} onChange={up('enabled')} label="تفعيل إرسال البريد عند إضافة مشروع جديد" hint={form.enabled ? 'مفعّل: هيتبعت إيميل مع كل مشروع جديد' : 'متوقف: مفيش إيميلات هتتبعت'} />
          </div>

          {/* SMTP */}
          <Panel delay={60} title="خادم البريد (SMTP)" subtitle="بيانات الاتصال بخادم الإرسال">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">إعداد سريع</span>
              {PRESETS.map(([label, host, port]) => (
                <button key={label} type="button" onClick={() => setForm((f) => ({ ...f, host, port, enableSsl: true }))}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition duration-300 ${form.host === host ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-500 ring-slate-200 hover:bg-brand-50 hover:text-brand-800'}`}>{label}</button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="خادم SMTP" error={err('host')}><input className="input" dir="ltr" value={form.host} onChange={ev('host')} placeholder="smtp.gmail.com" /></Field>
              <Field label="المنفذ" error={err('port')}><input type="number" className="input" dir="ltr" value={form.port} onChange={ev('port', Number)} /></Field>
              <Field label="الإيميل المُرسِل" error={err('from')}><input type="email" className="input" dir="ltr" value={form.from} onChange={ev('from')} placeholder="noreply@company.com" /></Field>
              <Field label="اسم المستخدم"><input className="input" dir="ltr" value={form.userName} onChange={ev('userName')} placeholder="your-account@gmail.com" autoComplete="off" /></Field>
              <div className="sm:col-span-2">
                <Field label="كلمة مرور SMTP (App Password)">
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className="input pe-20" dir="ltr" value={form.password} onChange={ev('password')} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-50">{showPw ? 'إخفاء' : 'إظهار'}</button>
                  </div>
                </Field>
              </div>
            </div>
            <div className="mt-4"><Switch checked={form.enableSsl} onChange={up('enableSsl')} label="استخدام SSL / TLS" hint="مفعّل في أغلب الخوادم (المنفذ 587 أو 465)" /></div>
          </Panel>

          {/* المستلمون */}
          <Panel delay={120} title="المستلمون" subtitle="مين هيوصله الإيميل عند إنشاء مشروع">
            <div className="grid gap-3 sm:grid-cols-2">
              <Switch checked={form.includeProjectOwner} onChange={up('includeProjectOwner')} label="صاحب المشروع" hint="المهندس اللي أنشأ المشروع" />
              <Switch checked={form.includeTeamMembers} onChange={up('includeTeamMembers')} label="أعضاء الفريق" hint="كل مهندسي نفس الفريق" />
            </div>
            <div className="mt-4"><label className="label">إيميلات إضافية</label><RecipientsInput value={form.defaultRecipients} onChange={up('defaultRecipients')} /></div>
          </Panel>
        </div>

        {/* الملخص */}
        <aside className="lg:col-span-4">
          <div className="card space-y-5 p-5 animate-rise lg:sticky lg:top-4" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <span className={`relative grid h-11 w-11 place-items-center rounded-2xl ${form.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <span className={`h-3 w-3 rounded-full ${form.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {form.enabled && <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60 motion-reduce:hidden" />}
              </span>
              <div>
                <p className="font-extrabold">{form.enabled ? 'البريد مفعّل' : 'البريد متوقف'}</p>
                <p className="text-xs text-slate-400">{summary.length ? `هيوصل لـ: ${summary.join(' + ')}` : 'مفيش مستلمين محدّدين'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-400">اكتمال الإعداد · {n(checks.filter(([, ok]) => ok).length)} من {n(checks.length)}</p>
              <ul className="space-y-1.5">
                {checks.map(([label, ok]) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className={`grid h-5 w-5 place-items-center rounded-full transition duration-300 ${ok ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-transparent'}`}><TickIcon className="h-3 w-3" /></span>
                    <span className={ok ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 border-t border-slate-100 pt-4">
              <button type="button" className="btn-primary w-full" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ…' : 'حفظ الإعدادات'}</button>
              {dirty && <button type="button" onClick={() => { setForm(JSON.parse(initial)); setSubmitted(false); }} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100">تراجع عن التغييرات</button>}
              <p className="text-center text-xs text-slate-400">{dirty ? 'في تغييرات لم تُحفظ' : 'كل التغييرات محفوظة'}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
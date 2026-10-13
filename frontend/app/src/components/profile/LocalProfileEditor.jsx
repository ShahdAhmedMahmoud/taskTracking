import { useRef, useState } from 'react';
import { useUI } from '../../hooks/useUI';
import Avatar from '../ui/Avatar';
import Panel from '../ui/Panel';
import { PencilIcon, SaveIcon } from '../ui/Icons';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

export default function LocalProfileEditor({ name, role, subtitle, teamName = '', teamOptions = [], roleOptions = [], accessOptions = [] }) {
  const { toast } = useUI();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState({ name: name || '', email: '', phone: '', photoData: null, title: role, team: teamName, access: role });
  const [dirty, setDirty] = useState(false);

  const choosePhoto = (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return toast('error', 'اختاري صورة PNG أو JPG أو WEBP');
    if (file.size > 8 * 1024 * 1024) return toast('error', 'الصورة كبيرة جداً (الحد الأقصى 8 ميجابايت)');
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, photoData: reader.result }));
      setDirty(true);
    };
    reader.onerror = () => toast('error', 'تعذّر قراءة الصورة');
    reader.readAsDataURL(file);
  };

  const change = (key) => (event) => {
    setProfile((current) => ({ ...current, [key]: event.target.value }));
    setDirty(true);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!profile.name.trim()) return toast('error', 'اكتبي الاسم');
    setProfile((current) => ({ ...current, name: current.name.trim(), email: current.email.trim(), phone: current.phone.trim() }));
    setDirty(false);
    toast('success', 'تم تحديث البيانات في الواجهة. الحفظ الدائم يحتاج ربط Backend.');
  };

  return (
    <Panel title="تعديل البيانات الشخصية" subtitle={subtitle || 'عدّلي بياناتك واختاري صورة شخصية'}>
      <form onSubmit={submit} onChange={() => setDirty(true)} className="space-y-5">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-brand-50/70 p-4">
          <div className="relative">
            <Avatar engineer={{ name: profile.name, photoData: profile.photoData }} size={84} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="اختيار صورة شخصية" title="اختيار صورة شخصية"
              className="absolute -bottom-1 -end-1 grid h-9 w-9 place-items-center rounded-full bg-white text-brand-700 shadow ring-2 ring-brand-200 hover:bg-brand-50">
              <PencilIcon className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" hidden accept={ALLOWED.join(',')} onChange={(event) => { choosePhoto(event.target.files?.[0]); event.target.value = ''; }} />
          </div>
          <div>
            <p className="font-extrabold text-brand-900">{profile.name || name}</p>
            <p className="mt-1 text-sm text-neutral-500">{profile.title}</p>
            {profile.team && <p className="mt-1 text-xs text-neutral-400">{profile.team}</p>}
            <p className="mt-1 text-xs text-neutral-400">PNG أو JPG أو WEBP، بحد أقصى 8 ميجابايت</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor={`profile-name-${role}`}>الاسم</label>
            <input id={`profile-name-${role}`} className="input" value={profile.name} onChange={change('name')} placeholder="الاسم بالكامل" />
          </div>
          <div>
            <label className="label" htmlFor={`profile-email-${role}`}>البريد الإلكتروني</label>
            <input id={`profile-email-${role}`} type="email" className="input" value={profile.email} onChange={change('email')} placeholder="name@company.com" />
          </div>
          <div>
            <label className="label" htmlFor={`profile-phone-${role}`}>رقم التليفون</label>
            <input id={`profile-phone-${role}`} type="tel" className="input" value={profile.phone} onChange={change('phone')} placeholder="01xxxxxxxxx" />
          </div>
          <div>
            <label className="label" htmlFor={`profile-title-${role}`}>الصفة</label>
            <select id={`profile-title-${role}`} className="input" value={profile.title} onChange={change('title')}>
              {[...new Set([role, ...roleOptions])].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          {teamOptions.length > 0 && (
            <div>
              <label className="label" htmlFor={`profile-team-${role}`}>الفريق / القسم</label>
              <select id={`profile-team-${role}`} className="input" value={profile.team} onChange={change('team')}>
                <option value="">— اختاري —</option>
                {teamOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor={`profile-access-${role}`}>مستوى الوصول</label>
            <select id={`profile-access-${role}`} className="input" value={profile.access} onChange={change('access')}>
              {[...new Set([role, ...accessOptions])].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>

        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${dirty ? 'border-brand-200 bg-brand-50/80' : 'border-neutral-100 bg-neutral-50'}`}>
          <p className={`text-sm font-semibold ${dirty ? 'text-brand-600' : 'text-neutral-400'}`}>{dirty ? 'في تعديلات غير محفوظة' : 'كل البيانات محفوظة في الواجهة'}</p>
          <button type="submit" disabled={!dirty} className="btn-primary min-w-[150px] disabled:opacity-50"><SaveIcon className="h-4 w-4" />حفظ التعديلات</button>
        </div>
        <p className="text-center text-xs text-neutral-400">الحفظ الحالي للمعاينة داخل الواجهة فقط. الحفظ الدائم ومشاركة البيانات والصورة يحتاجان Backend.</p>
      </form>
    </Panel>
  );
}

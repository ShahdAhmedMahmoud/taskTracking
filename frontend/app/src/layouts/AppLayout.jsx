
import EngineerAlertsWatcher from '../components/ui/EngineerAlertsWatcher';
import { useEngineerAlerts } from '../services/engineerAlerts';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useNotifications } from '../hooks/useNotifications';
import { useDeptActivity } from '../hooks/useDeptActivity';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useUI } from '../hooks/useUI';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import GlobalSearch from '../components/ui/GlobalSearch';
import {
  HomeIcon, TeamsIcon, EngineersIcon, ProjectsIcon, ReportsIcon, UserPlusIcon, MailIcon,
  ArchiveIcon, HasrIcon, TasksIcon, BellIcon, KeyIcon, LogoutIcon, MenuIcon, CloseIcon,
} from '../components/ui/Icons';
import { teamLabel } from '../utils/helpers';

const EXTRA_TITLES = { '/profile': 'الملف الشخصي', '/notifications': 'الإشعارات' };

function buildNav(session, teams) {
  if (session.role === 'dept') {
    const hasr = teams.filter((t) => t.type === 'hasr').map((t) => ({ to: `/hasr/${t.id}`, icon: HasrIcon, label: `قسم ${t.label || 'الحصر'}` }));
    return [
      {
        title: 'القائمة الرئيسية',
        items: [
          { to: '/', icon: HomeIcon, label: 'الرئيسية', end: true },
          { to: '/teams', icon: TeamsIcon, label: 'أداء الفرق' },
          { to: '/engineers', icon: EngineersIcon, label: 'المهندسين' },
          { to: '/projects', icon: ProjectsIcon, label: 'المشاريع الجارية' },
          { to: '/reports', icon: ReportsIcon, label: 'التقارير' },
          { to: '/notifications', icon: BellIcon, label: 'الإشعارات' },
          ...hasr,
        ],
      },
      {
        title: 'الإدارة',
        items: [
          { to: '/add-employee', icon: UserPlusIcon, label: 'إضافة موظف' },
          { to: '/email-settings', icon: MailIcon, label: 'إعدادات البريد' },
          { to: '/archives', icon: ArchiveIcon, label: 'الأرشيف' },
        ],
      },
    ];
  }
  if (session.role === 'team') {
    const t = teams.find((x) => x.id === session.id);
    return [{
      title: 'القائمة',
      items: t?.type === 'hasr'
        ? [{ to: `/hasr/${t.id}`, icon: HasrIcon, label: 'مشاريع الحصر' }]
        : [{ to: '/team', icon: TeamsIcon, label: t ? teamLabel(t) : 'فريقي' }, { to: '/reports', icon: ReportsIcon, label: 'التقارير' }],
    }];
  }
  return [{
    title: 'القائمة',
    items: [
      { to: '/my-tasks', icon: TasksIcon, label: 'مهامي' },
      { to: '/reports', icon: ReportsIcon, label: 'تقاريري' },
      // { to: '/notifications', icon: BellIcon, label: 'الإشعارات' },
    ],
  }];
}

export default function AppLayout() {
  const { session, logout, changePassword } = useAuth();
  const { teams, dirty } = useData();
  const { unread: serverUnread } = useNotifications();
const { unread: alertsUnread } = useEngineerAlerts();
const unread = serverUnread + alertsUnread;
  const { unseen: deptUnseen } = useDeptActivity();
  const { toast } = useUI();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(null);
  useAutoRefresh();

  // عدّاد الإشعارات: مدير القسم من نشاط المهندسين، والمهندس من إشعاراته
  const badge = session.role === 'dept' ? deptUnseen : unread;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const me = teams.flatMap((t) => t.engineers).find((e) => e.id === session.id);
  const roleLabel = { dept: 'مدير القسم', team: 'مدير الفريق', engineer: 'المهندس' }[session.role];
  const groups = buildNav(session, teams);
  const hasDirty = Object.values(dirty).some(Boolean);

  // عنوان الصفحة = أطول مسار مطابق في القائمة
  const hit = groups.flatMap((g) => g.items)
    .filter((i) => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const pageTitle = hit?.label || EXTRA_TITLES[pathname] || 'لوحة المتابعة';

  const submitPw = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const err = await changePassword(f.get('old'), f.get('n1'), f.get('n2'));
      if (err) return setPw({ error: err });
      setPw(null); toast('success', 'تم تغيير كلمة المرور');
    } catch (x) { setPw({ error: x.message }); }
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/assets/logo.png" alt="logo" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-soft ring-1 ring-neutral-100" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-extrabold leading-tight text-brand-900">لوحة المتابعة</div>
          <div className="text-xs text-neutral-400">متابعة المهام والمشاريع</div>
        </div>
        <button onClick={() => setOpen(false)} className="btn-ghost !p-2 lg:hidden" aria-label="إغلاق"><CloseIcon className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-2 px-3 text-xs font-extrabold tracking-wide text-neutral-400">{g.title}</p>
            <div className="space-y-1">
              {g.items.map((i) => {
                const Icon = i.icon;
                return (
                  <NavLink
                    key={i.to} to={i.to} end={i.end}
                    className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-bold transition duration-200
                      ${isActive ? 'bg-gradient-to-l from-brand-500 to-brand-600 text-white shadow-soft' : 'text-neutral-600 hover:bg-brand-50 hover:text-brand-800'}`}
                  >
                    <Icon className="h-5 w-5 shrink-0 transition duration-200 group-hover:scale-110" />
                    <span className="flex-1">{i.label}</span>
                    {i.to === '/notifications' && badge > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white ring-1 ring-white/60">{badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* حالة الحفظ */}
      <div className={`mx-3 mb-3 rounded-2xl p-4 transition-colors duration-500 ${hasDirty ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-brand-50/80 text-brand-900 border border-brand-200/70'}`}>
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <span className={`h-2.5 w-2.5 rounded-full ${hasDirty ? 'animate-pulse bg-brand-500' : 'bg-brand-600'}`} />
          {hasDirty ? 'جاري الحفظ...' : 'كل التحديثات محفوظة'}
        </div>
        <p className={`mt-1 text-xs leading-relaxed ${hasDirty ? 'text-brand-600' : 'text-[#3C3C3B]'}`}>
          {hasDirty ? 'متقفليش الصفحة لحد ما الحفظ يخلص.' : 'البيانات متزامنة مع الخادم ومرئية للجميع.'}
        </p>
      </div>

      <div className="space-y-1 border-t border-neutral-200/70 p-3">
        <button onClick={() => setPw({})} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-bold text-neutral-600 transition hover:bg-neutral-100">
          <KeyIcon className="h-5 w-5" />تغيير كلمة المرور
        </button>
        <button onClick={() => { logout(); nav('/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-bold text-brand-600 transition hover:bg-brand-50">
          <LogoutIcon className="h-5 w-5" />تسجيل خروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {session.role === 'engineer' && <EngineerAlertsWatcher />}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-e border-neutral-200/70 bg-white lg:block xl:w-80">{Sidebar}</aside>

      {/* Drawer للموبايل */}
      <div className={`fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}>{Sidebar}</aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200/70 bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setOpen(true)} className="btn-ghost !p-2.5 lg:hidden" aria-label="القائمة"><MenuIcon className="h-6 w-6" /></button>
            <h1 className="truncate text-xl font-extrabold text-neutral-900 sm:text-2xl">{pageTitle}</h1>
            {hasDirty && <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 ring-1 ring-brand-200 max-sm:hidden lg:hidden sm:inline-block">جاري الحفظ...</span>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session.role === 'dept' && <GlobalSearch />}
            {(session.role === 'dept' || session.role === 'engineer') && (
              <button
                onClick={() => nav('/notifications')}
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
                aria-label="الإشعارات"
              >
                <BellIcon className={`h-5 w-5 ${badge > 0 ? 'animate-pulse text-brand-600' : ''}`} />
                {badge > 0 && <span className="absolute -top-1 -start-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white ring-2 ring-white">{badge}</span>}
              </button>
            )}
            <button onClick={() => nav('/profile')} className="flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white py-1.5 pe-4 ps-1.5 transition hover:border-brand-300 hover:shadow-soft">
              <Avatar engineer={me || { name: session.name }} size={38} />
              <span className="hidden text-start sm:block">
                <small className="block text-xs text-neutral-400">{roleLabel}</small>
                <b className="text-sm">{session.name}</b>
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[96rem] p-4 sm:p-6 lg:p-8">
          {/* key = المسار → انتقال ناعم عند تغيير الصفحة */}
          <div key={pathname} className="animate-rise"><Outlet /></div>
        </main>
      </div>

      {pw && (
        <Modal title="تغيير كلمة المرور" onClose={() => setPw(null)}>
          <form onSubmit={submitPw} className="space-y-4">
            <div><label className="label">كلمة المرور الحالية</label><input name="old" type="password" className="input" autoComplete="current-password" /></div>
            <div><label className="label">كلمة المرور الجديدة</label><input name="n1" type="password" className="input" autoComplete="new-password" /></div>
            <div><label className="label">تأكيد كلمة المرور</label><input name="n2" type="password" className="input" autoComplete="new-password" /></div>
            {pw.error && <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-600">⚠ {pw.error}</p>}
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setPw(null)}>إلغاء</button><button className="btn-primary">حفظ</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}


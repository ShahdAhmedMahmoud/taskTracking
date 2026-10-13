
import { Navigate, Route, Routes } from 'react-router-dom';
import { useData } from './hooks/useData';
import { useAuth } from './hooks/useAuth';
import { DeptActivityProvider } from './hooks/useDeptActivity';
import { RequireAuth, RequireRole } from './layouts/RequireAuth';
import AppLayout from './layouts/AppLayout';
import Loader from './components/ui/Loader';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeamsPage from './pages/TeamsPage';
import TeamPage from './pages/TeamPage';
import TeamHomePage from './pages/TeamHomePage';
import EngineersPage from './pages/EngineersPage';
import ProjectsPage from './pages/ProjectsPage';
import EngineerPage from './pages/EngineerPage';
import HasrPage from './pages/HasrPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import ScopedReportsPage from './pages/ScopedReportsPage';
import ManageTeamsPage from './pages/ManageTeamsPage';
import AddEmployeePage from './pages/AddEmployeePage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import ArchivesPage from './pages/ArchivesPage';
import ActivityPage from './pages/ActivityPage';
import DeptNotificationsPage from './pages/DeptNotificationsPage';
import { homeFor } from './utils/helpers';

const only = (roles, el) => <RequireRole roles={roles}>{el}</RequireRole>;

/* /notifications: مدير القسم يشوف نشاط المهندسين، والمهندس يشوف إشعاراته */
function NotificationsRoute() {
  const { session } = useAuth();
  const { teams } = useData();
  if (session.role === 'dept') return <DeptNotificationsPage />;
  if (session.role === 'engineer') return <NotificationsPage />;
  return <Navigate to={homeFor(session, teams)} replace />;
}

function ReportsRoute() {
  const { session } = useAuth();
  const { teams } = useData();
  if (session.role === 'dept' || session.role === 'reports') return <ReportsPage />;
  if (session.role === 'engineer') return <ScopedReportsPage />;
  if (session.role === 'team' && teams.find((team) => team.id === session.id)?.type !== 'hasr') return <ScopedReportsPage />;
  return <Navigate to={homeFor(session, teams)} replace />;
}

export default function App() {
  const { status, init } = useData();
  const { restoring } = useAuth();

  // الترتيب مهم: الخطأ الأول، لأن restoring بيفضل true لو التحميل فشل ومكنش هيظهر الخطأ أبدًا
  if (status.error) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <div className="text-4xl">🔌</div>
          <h2 className="mt-2 text-lg font-extrabold">تعذّر الاتصال ببيانات النظام</h2>
          <p className="mt-1 text-sm text-neutral-500">{status.error}</p>
          <button className="btn-primary mt-4" onClick={init}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }
  if (status.loading || restoring) return <div className="grid min-h-screen place-items-center"><Loader text="جاري تحميل النظام..." /></div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><DeptActivityProvider><AppLayout /></DeptActivityProvider></RequireAuth>}>
        <Route path="/" element={only(['dept'], <HomePage />)} />
        <Route path="/teams" element={only(['dept'], <TeamsPage />)} />
        <Route path="/teams/:teamId" element={only(['dept'], <TeamPage />)} />
        <Route path="/team" element={only(['team'], <TeamHomePage />)} />
        <Route path="/engineers" element={only(['dept'], <EngineersPage />)} />
        <Route path="/engineers/:engId" element={only(['dept', 'team'], <EngineerPage />)} />
        <Route path="/my-tasks" element={only(['engineer'], <EngineerPage />)} />
        <Route path="/projects" element={only(['dept'], <ProjectsPage />)} />
        <Route path="/hasr/:teamId" element={<HasrPage />} />
        <Route path="/notifications" element={<NotificationsRoute />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reports" element={<ReportsRoute />} />
        <Route path="/manage-teams" element={only(['dept'], <ManageTeamsPage />)} />
        <Route path="/add-employee" element={only(['dept'], <AddEmployeePage />)} />
        <Route path="/email-settings" element={only(['dept'], <EmailSettingsPage />)} />
        <Route path="/archives" element={only(['dept'], <ArchivesPage />)} />
        <Route path="/activity" element={<ActivityPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { useData } from './hooks/useData';
import { useAuth } from './hooks/useAuth';
import { RequireAuth, RequireRole } from './layouts/RequireAuth';
import AppLayout from './layouts/AppLayout';
import Loader from './components/ui/Loader';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeamsPage from './pages/TeamsPage';
import TeamPage from './pages/TeamPage';
import EngineersPage from './pages/EngineersPage';
import ProjectsPage from './pages/ProjectsPage';
import EngineerPage from './pages/EngineerPage';
import HasrPage from './pages/HasrPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

const only = (roles, el) => <RequireRole roles={roles}>{el}</RequireRole>;

export default function App() {
  const { status, init } = useData();
  const { restoring } = useAuth();

  if (status.loading || restoring) return <div className="grid min-h-screen place-items-center"><Loader text="جاري تحميل النظام..." /></div>;
  if (status.error) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <div className="text-4xl">🔌</div>
          <h2 className="mt-2 text-lg font-extrabold">تعذّر الاتصال ببيانات النظام</h2>
          <p className="mt-1 text-sm text-slate-500">{status.error}</p>
          <button className="btn-primary mt-4" onClick={init}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={only(['dept'], <HomePage />)} />
        <Route path="/teams" element={only(['dept'], <TeamsPage />)} />
        <Route path="/teams/:teamId" element={only(['dept'], <TeamPage />)} />
        <Route path="/team" element={only(['team'], <TeamPage />)} />
        <Route path="/engineers" element={only(['dept'], <EngineersPage />)} />
        <Route path="/engineers/:engId" element={only(['dept', 'team'], <EngineerPage />)} />
        <Route path="/my-tasks" element={only(['engineer'], <EngineerPage />)} />
        <Route path="/projects" element={only(['dept'], <ProjectsPage />)} />
        <Route path="/hasr/:teamId" element={<HasrPage />} />
        <Route path="/notifications" element={only(['engineer'], <NotificationsPage />)} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* الدفعة 2: /reports /add-employee /master-data /email-settings /archives /manage-teams */}
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
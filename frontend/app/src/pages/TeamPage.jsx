import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import FormModal from '../components/ui/FormModal';
import EngineerCard from '../components/EngineerCard';
import ProjectRow from '../components/ProjectRow';
import { Empty } from '../components/ui/Loader';
import { teamLabel } from '../utils/helpers';
import { engineerStats, getAllProjects, teamStats } from '../utils/stats';

export default function TeamPage() {
  const { teamId: p } = useParams();
  const { session, removeHash } = useAuth();
  const { teams, engineers, tasks, createEngineer, deleteEngineer } = useData();
  const { confirm } = useUI();
  const nav = useNavigate();
  const [adding, setAdding] = useState(false);

  const teamId = session.role === 'team' ? session.id : p;
  const team = teams.find((t) => t.id === teamId);
  if (!team) return <Empty icon="🔎" title="الفريق غير موجود" />;

  const s = teamStats(team, engineers, tasks);
  const projects = getAllProjects([team], engineers, tasks);
  const base = session.role === 'team' ? '/engineers/' : '/engineers/';

  const remove = async (e) => {
    if (!(await confirm({ title: '🗑 حذف المهندس', message: `متأكدة من حذف "${e.name}" من الفريق؟\nمهامه المحفوظة بتفضل مخزنة لكن مش هيقدر يدخل بحسابه.`, confirmText: 'حذف المهندس' }))) return;
    if (await deleteEngineer(team.id, e.id)) removeHash('engineer', e.id);
  };

  return (
    <>
      <PageHeader back={session.role === 'dept'} title={teamLabel(team)} subtitle={`مدير الفريق: ${team.manager}`}
        actions={<button className="btn-primary" onClick={() => setAdding(true)}>+ إضافة مهندس</button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="📋" label="إجمالي المهام" value={s.total} />
        <StatCard icon="✅" label="منجزة" value={s.done} tone="brand" />
        <StatCard icon="⏳" label="متبقية" value={s.remaining} tone="rose" />
        <StatCard icon="📈" label="نسبة إنجاز الفريق" value={`${s.pct}%`} tone="amber" />
      </div>

      <h2 className="mb-3 font-extrabold">مهندسو الفريق ({team.engineers.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.engineers.map((e) => (
          <EngineerCard key={e.id} eng={e} team={team} stats={engineerStats(engineers[e.id], tasks)}
            projectsCount={engineers[e.id]?.projects.length || 0} lastSaved={engineers[e.id]?.lastSaved}
            onClick={() => nav(base + e.id)} onDelete={() => remove(e)} />
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-extrabold">مشاريع الفريق — بالأقرب لموعد التسليم ({projects.length})</h2>
      {projects.length ? (
        <div className="space-y-3">
          {projects.map((x, i) => (
            <ProjectRow key={x.project.id} rank={i + 1} project={x.project} stats={x.stats} sub={x.eng.name}
              onClick={() => { localStorage.setItem('tender-dashboard-active-project:' + x.eng.id, x.project.id); nav(base + x.eng.id); }} />
          ))}
        </div>
      ) : <Empty icon="📁" title="لا توجد مشاريع بعد" />}

      {adding && (
        <FormModal title="➕ إضافة مهندس جديد" submitText="إضافة" onClose={() => setAdding(false)}
          fields={[{ name: 'name', label: 'اسم المهندس', required: true }, { name: 'companyEmail', label: 'إيميل الشركة', type: 'email' }, { name: 'phoneNumber', label: 'رقم التليفون', type: 'tel' }, { name: 'employeeCode', label: 'الكود الوظيفي' }]}
          onSubmit={(v) => createEngineer(team.id, v)} />
      )}
    </>
  );
}


import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import FormModal from '../components/ui/FormModal';
import Loader, { Empty } from '../components/ui/Loader';
import ProjectWorkspace from '../components/engineer/ProjectWorkspace';
import ProjectFilter, { matchFilter } from '../components/engineer/ProjectFilter';
import ProjectTabs from '../components/engineer/ProjectTabs';
import { SaveIcon } from '../components/engineer/EngineerIcons';
import { timeAgo } from '../utils/dates';
import { makeNewProject, teamLabel } from '../utils/helpers';
import { STATES, n, stateOf } from '../utils/dashboardData';

const KEY = (id) => `tender-dashboard-active-project:${id}`;

export default function EngineerPage() {
  const { engId: paramId } = useParams();
  const { session } = useAuth();
  const { teams, tasks, engineers, config, dirty, mutate, saveEngineer, loadEngineer, archiveProject, outcomeLabel } = useData();
  const { confirm, toast } = useUI();
  const [sp, setSp] = useSearchParams();
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fStatus, setFStatus] = useState('all');   // all | running | delivered
  const [fOutcome, setFOutcome] = useState('all'); // all | pending | won | lost (مع delivered بس)
  const [fIds, setFIds] = useState(null);          // لقطة بمعرّفات المشاريع المطابقة وقت الضغط على الفلتر (null = الكل)

  const engId = session.role === 'engineer' ? session.id : paramId;
  const team = teams.find((t) => t.engineers.some((e) => e.id === engId));
  const eng = team?.engineers.find((e) => e.id === engId);
  const data = engineers[engId];

  useEffect(() => { if (engId && !engineers[engId]) loadEngineer(engId).catch(() => {}); }, [engId]); // eslint-disable-line

  if (session.role === 'team' && team && team.id !== session.id) return <Navigate to="/team" replace />;
  if (!team || !eng) return <Empty icon="🔎" title="المهندس غير موجود" />;
  if (!data) return <Loader />;

  const projects = data.projects;
  const activeId = [sp.get('p'), localStorage.getItem(KEY(engId))].find((id) => id && projects.some((p) => p.id === id)) || projects[0]?.id;
  const project = projects.find((p) => p.id === activeId);
  const select = (id) => { localStorage.setItem(KEY(engId), id); setSp({ p: id }, { replace: true }); };
  const edit = (fn) => mutate(engId, (d) => fn(d.projects.find((p) => p.id === project.id)));
  const isDirty = !!dirty[engId];
  const user = session.name;

  const save = async () => {
    setSaving(true);
    try { await saveEngineer(engId); } finally { setSaving(false); }
  };

  // const addProject = (v) => {
  //   const np = { ...makeNewProject(tasks, config, v), note: (v.note || '').trim(), rounds: [] };
  //   mutate(engId, (d) => { d.projects.push(np); });
  //   setFStatus('all'); setFOutcome('all'); setFIds(null);
  //   select(np.id);
  // };

  const addProject = (v) => {
  if (v.startDate && v.deliveryDate && v.startDate > v.deliveryDate) {
    toast('error', 'تاريخ البداية لازم يكون قبل تاريخ التسليم');
    setTimeout(() => setModal('project'), 0);
    return;
  }
  const now = new Date().toISOString();
  const np = {
    ...makeNewProject(tasks, config, v),
    startDate: v.startDate || '',
    note: (v.note || '').trim(), rounds: [{ id: 'round-1', title: 'الجولة 1', date: v.deliveryDate || '', delivered: false, deliveredAt: '', note: '' }],
    createdBy: session.name, createdByRole: session.role, createdAt: now,
    ...(v.note?.trim() ? { noteBy: session.name, noteByRole: session.role, noteAt: now } : {}),
  };
  mutate(engId, (d) => { d.projects.push(np); });
  setFStatus('all'); setFOutcome('all'); setFIds(null);
  select(np.id);
};

  const archive = async () => {
    const ok = await confirm({
      title: '🗄️ أرشفة المشروع',
      message: `هتتنقل «${project.name || 'بدون اسم'}» للأرشيف وتتشال من قوايم الموظفين.\nتشمل: بيانات المشروع وحالات المهام والمهام المضافة والسجل المتزامن مع قسم الحصر.\nمشاريع المهندس الأخرى مش هتتأثر.`,
      confirmText: 'أرشفة المشروع',
    });
    if (ok) await archiveProject(engId, project.id, user);
  };

  /* ---------- أرقام الهيرو ---------- */
  const running = projects.filter((p) => !p.finished).length;
  const won = projects.filter((p) => stateOf(p) === 'won').length;
  const lost = projects.filter((p) => stateOf(p) === 'lost').length;
  const delivered = projects.filter((p) => p.finished).length;
  const winPct = delivered ? `${n(Math.round((won / delivered) * 100))}%` : '—';

  /* ---------- الفلتر ---------- */
  const lab = (k) => (k === 'won' || k === 'lost' ? outcomeLabel(k, STATES[k].label) : STATES[k].label);
  // الفلتر صارم: بيعرض المطابق بس. والقايمة بتتحدد لحظة الضغط، فتعديل حالة المشروع المفتوح مش بيشيله فجأة
  const tabs = fIds ? projects.filter((p) => fIds.includes(p.id)) : projects;
  const hasOpen = !!project && tabs.some((p) => p.id === project.id);
  const changeFilter = (s, o) => {
    setFStatus(s); setFOutcome(o);
    const match = projects.filter((p) => matchFilter(p, s, o));
    setFIds(s === 'all' ? null : match.map((p) => p.id));
    if (match.length && !match.some((p) => p.id === project?.id)) select(match[0].id); // نفتح أول مشروع مطابق
  };

  const hero = (
    <section className="relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/70 to-brand-100/50 p-5 text-neutral-800 shadow-soft animate-rise sm:p-7">
      <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 end-10 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: 'radial-gradient(#2A317A 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

      <div className="relative flex flex-wrap items-center gap-5">
        <div className="rounded-full p-1 ring-2 ring-brand-200"><Avatar engineer={eng} size={76} /></div>

        <div className="min-w-0 flex-1 basis-56">
          <h1 className="truncate text-2xl font-extrabold text-brand-900 sm:text-3xl">{session.role === 'engineer' ? `مهامي — ${eng.name}` : eng.name}</h1>
          <p className="mt-1 text-sm text-[#3C3C3B]">{teamLabel(team)} · مدير الفريق: {team.manager}</p>
          <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 transition-colors duration-500 ${isDirty ? 'bg-brand-50 text-brand-600 ring-brand-300' : 'bg-brand-50 text-brand-800 ring-brand-200'}`}>
            <span className={`h-2 w-2 rounded-full ${isDirty ? 'animate-pulse bg-brand-500' : 'bg-brand-600'}`} />
            {isDirty ? 'يوجد تغييرات لم تُحفظ' : `تم الحفظ · ${timeAgo(data.lastSaved)}`}
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
          {[['جارية', running], ['فوز', won], ['نسبة الفوز', winPct]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-white/80 px-4 py-2.5 text-center ring-1 ring-brand-100 shadow-xs backdrop-blur">
              <p className="text-2xl font-extrabold tabular-nums text-brand-900">{typeof v === 'number' ? n(v) : v}</p>
              <p className="text-xs font-semibold text-neutral-500">{l}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={save} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60 sm:w-auto">
          <SaveIcon className="h-4 w-4" />{saving ? 'جاري الحفظ…' : 'حفظ الآن'}
        </button>
      </div>
    </section>
  );

  /* ---------- شريط الحفظ العايم ---------- */
  const floatingSave = (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-all duration-500 motion-reduce:transition-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-brand-200 bg-white/95 py-2.5 pe-2.5 ps-4 text-sm font-bold text-neutral-800 shadow-lift backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        تغييرات لم تُحفظ
        <button type="button" onClick={save} disabled={saving || !isDirty} tabIndex={isDirty ? 0 : -1} className="rounded-xl bg-brand-600 px-4 py-2 font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'جاري الحفظ…' : 'حفظ'}
        </button>
      </div>
    </div>
  );

  if (!project) {
    return (
      <>
        <PageHeader back title="لوحة المهندس" />
        {hero}
        <Empty icon="📁" title="لا يوجد مشروع مسجل بعد" text="أضيفي أول مشروع لبدء متابعة المهام." />
        <div className="mt-4 text-center"><button className="btn-primary" onClick={() => setModal('project')}>+ إضافة مشروع</button></div>
        {modal === 'project' && <ProjectModal config={config} onSubmit={addProject} onClose={() => setModal(null)} />}
        {floatingSave}
      </>
    );
  }

  return (
    <>
      {hero}

      {/* ===== فلتر + تبويبات المشاريع ===== */}
      {projects.length > 1 && <ProjectFilter projects={projects} status={fStatus} outcome={fOutcome} onChange={changeFilter} lab={lab} />}

      {/* key بيتغير مع الفلتر عشان التبويبات تدخل بحركة جديدة */}
      <ProjectTabs key={`${fStatus}-${fOutcome}`} tabs={tabs} activeId={project.id} onSelect={select} onAdd={() => setModal('project')} />

      {/* key = تتعمل animation جديدة كل ما تبدّلي المشروع */}
      {hasOpen ? (
        <ProjectWorkspace key={project.id} project={project} edit={edit} user={user} onArchive={archive} />
      ) : (
        <div className="space-y-4 text-center animate-rise">
          <Empty icon="🔎" title="مفيش مشاريع بالفلتر ده" text="جرّبي نتيجة تانية، أو ارجعي لـ «الكل»." />
          <button type="button" className="btn-primary" onClick={() => changeFilter('all', 'all')}>عرض كل المشاريع</button>
        </div>
      )}

      {modal === 'project' && <ProjectModal config={config} onSubmit={addProject} onClose={() => setModal(null)} />}
      {floatingSave}
      <div className="h-16" />
    </>
  );
}

function ProjectModal({ config, onSubmit, onClose }) {
  return (
    <FormModal title="📁 إنشاء مشروع جديد" submitText="إنشاء المشروع" onClose={onClose}
      fields={[
        { name: 'startDate', label: 'تاريخ البداية', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
        { name: 'name', label: 'اسم المشروع' },
        { name: 'deliveryDate', label: 'تاريخ التسليم', type: 'date', defaultValue: config?.projectDefaults?.deliveryDate || '' },
        { name: 'inquiryDate', label: 'تاريخ الاستفسارات', type: 'date', defaultValue: config?.projectDefaults?.inquiryDate || '' },
        { name: 'note', label: 'ملحوظة على المشروع (اختياري)', placeholder: 'اكتبي ملحوظة يطّلع عليها فريق الحصر' },
      ]}
      onSubmit={onSubmit} />
  );
}

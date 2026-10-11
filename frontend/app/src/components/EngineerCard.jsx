import { timeAgo } from '../utils/dates';
import { teamLabel } from '../utils/helpers';
import Avatar from './ui/Avatar';
import ProgressBar from './ui/ProgressBar';

export default function EngineerCard({ eng, team, stats, projectsCount, lastSaved, showTeam, onClick, onDelete }) {
  return (
    <div onClick={onClick} className="card-hover animate-fade-up p-4">
      <div className="flex items-center gap-3">
        <Avatar engineer={eng} size={46} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-extrabold">{eng.name}</h4>
          <div className="truncate text-xs text-neutral-500">{showTeam ? `${teamLabel(team)} · ` : ''}مدير: {team.manager}</div>
        </div>
        {onDelete && (
          <button title="حذف" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-lg p-2 text-neutral-400 hover:bg-brand-50 hover:text-brand-600">🗑</button>
        )}
      </div>
      <div className="mt-4"><ProgressBar pct={stats.pct} /></div>
      <div className="mt-2 flex items-center justify-between text-xs font-bold text-neutral-500">
        <span>{stats.done}/{stats.total} مهمة</span><span className="text-brand-600">{stats.pct}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
        <span>📁 {projectsCount} مشروع</span><span>آخر تحديث: {timeAgo(lastSaved)}</span>
      </div>
    </div>
  );
}
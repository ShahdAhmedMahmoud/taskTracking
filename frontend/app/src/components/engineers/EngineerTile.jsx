// import { Link } from 'react-router-dom';
// import Avatar from '../ui/Avatar';
// import ProgressRing from '../ui/ProgressRing';
// import { ArrowIcon, CalendarIcon, MailIcon } from '../ui/Icons';
// import { teamLabel } from '../../utils/helpers';
// import { STATES, n } from '../../utils/dashboardData';

// const HATCH = 'repeating-linear-gradient(135deg, #e1e1e0 0 2px, transparent 2px 7px)';

// /* مستوى ضغط العمل حسب عدد المشاريع الجارية */
// export const LOAD = {
//   free:   { label: 'متاح',        pill: 'bg-brand-50 text-brand-700 ring-brand-200',       dot: '#2A317A' },
//   normal: { label: 'حمل متوسط',   pill: 'bg-brand-50 text-brand-600 ring-brand-200',             dot: '#414a9b' },
//   heavy:  { label: 'ضغط عالي',    pill: 'bg-brand-50 text-brand-600 ring-brand-200',       dot: '#6f7dd0' },
// };
// export const loadOf = (running) => (running === 0 ? 'free' : running >= 3 ? 'heavy' : 'normal');

// const soonText = (k) => {
//   if (k < 0) return `متأخر ${n(-k)} ${-k <= 10 ? 'أيام' : 'يوم'}`;
//   if (k === 0) return 'يُسلَّم اليوم';
//   if (k === 1) return 'غدًا';
//   if (k === 2) return 'خلال يومين';
//   return k <= 10 ? `خلال ${n(k)} أيام` : `خلال ${n(k)} يوم`;
// };
// const deadlinePill = (k) => (k < 0
//   ? 'bg-brand-50 text-brand-600 ring-brand-200'
//   : k <= 3 ? 'bg-brand-50 text-brand-600 ring-brand-200' : 'bg-neutral-50 text-neutral-500 ring-neutral-200');

// const rtf = new Intl.RelativeTimeFormat('ar-EG', { numeric: 'auto' });
// const ago = (d) => {
//   if (!d) return 'لم يُحفظ بعد';
//   const t = new Date(d).getTime();
//   if (Number.isNaN(t)) return 'لم يُحفظ بعد';
//   const s = Math.round((t - Date.now()) / 1000);
//   const a = Math.abs(s);
//   if (a < 60) return 'آخر تحديث الآن';
//   const [div, unit] = a < 3600 ? [60, 'minute'] : a < 86400 ? [3600, 'hour'] : a < 2592000 ? [86400, 'day'] : a < 31536000 ? [2592000, 'month'] : [31536000, 'year'];
//   return `آخر تحديث ${rtf.format(Math.round(s / div), unit)}`;
// };

// const PhoneIcon = ({ className }) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
//     <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
//   </svg>
// );

// function Contact({ eng }) {
//   const cls = 'relative z-10 grid h-9 w-9 place-items-center rounded-full text-neutral-400 ring-1 ring-neutral-200 transition duration-300 hover:bg-brand-600 hover:text-white hover:ring-brand-600';
//   return (
//     <>
//       {eng.email && <a href={`mailto:${eng.email}`} aria-label={`إيميل ${eng.name}`} title={eng.email} className={cls}><MailIcon className="h-4 w-4" /></a>}
//       {eng.phone && <a href={`tel:${eng.phone}`} aria-label={`اتصال بـ ${eng.name}`} title={eng.phone} className={cls}><PhoneIcon className="h-4 w-4" /></a>}
//     </>
//   );
// }

// /** شريط توزيع حالات مشاريع المهندس */
// function StatesBar({ m, ready }) {
//   const total = m.counts.running + m.counts.pending + m.counts.won + m.counts.lost;
//   return (
//     <div>
//       <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-neutral-100">
//         {total === 0
//           ? <div className="flex-1" style={{ backgroundImage: HATCH }} />
//           : ['running', 'won', 'pending', 'lost'].map((k) => m.counts[k] > 0 && (
//             <div key={k} className="transition-[flex-grow] duration-1000 ease-out" title={`${STATES[k].label}: ${m.counts[k]}`}
//               style={{ flexGrow: ready ? m.counts[k] : 0, flexBasis: 0, background: STATES[k].color }} />
//           ))}
//       </div>
//       <p className="mt-2 text-xs font-semibold text-neutral-400">
//         {total === 0
//           ? 'لا توجد مشاريع بعد'
//           : `${n(m.counts.running)} جاري · ${n(m.counts.won)} فوز · ${n(m.counts.pending)} معلق · ${n(m.counts.lost)} خسارة`}
//       </p>
//     </div>
//   );
// }

// export default function EngineerTile({ eng, team, m, delay = 0, ready = true, variant = 'card' }) {
//   const color = '#2A317A';
//   const load = LOAD[loadOf(m.counts.running)];
//   const to = `/engineers/${eng.id}`;

//   /* ================= صف مضغوط ================= */
//   if (variant === 'list') {
//     return (
//       <article
//         className="card group/eng relative flex items-center gap-3 overflow-hidden p-3.5 ps-5 animate-rise transition duration-300 hover:border-brand-200 hover:shadow-soft focus-within:ring-2 focus-within:ring-brand-400 sm:gap-4"
//         style={{ animationDelay: `${delay}ms` }}
//       >
//         <span aria-hidden className="absolute inset-y-0 start-0 w-1" style={{ background: color }} />
//         <Avatar engineer={eng} size={44} />
//         <div className="min-w-0 flex-1">
//           <h3 className="truncate text-base font-extrabold">
//             <Link to={to} className="after:absolute after:inset-0 focus:outline-none">{eng.name}</Link>
//           </h3>
//           <p className="truncate text-xs text-neutral-400">{teamLabel(team)}</p>
//         </div>

//         <div className="hidden w-40 shrink-0 md:block">
//           <div className="mb-1 flex justify-between text-xs font-bold text-neutral-400">
//             <span>الإنجاز</span><span className="tabular-nums text-brand-700">{m.counts.running ? `${n(m.pct)}%` : '—'}</span>
//           </div>
//           <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
//             <div className="h-full rounded-full bg-gradient-to-l from-brand-300 to-brand-600 transition-[width] duration-1000 ease-out" style={{ width: `${ready ? m.pct : 0}%` }} />
//           </div>
//         </div>

//         <div className="hidden shrink-0 text-center sm:block">
//           <p className="text-lg font-extrabold tabular-nums text-brand-600">{n(m.counts.running)}</p>
//           <p className="text-xs font-semibold text-neutral-400">جارية</p>
//         </div>

//         {m.next && (
//           <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 lg:inline-block ${deadlinePill(m.next.k)}`}>{soonText(m.next.k)}</span>
//         )}
//         <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 sm:inline-block ${load.pill}`}>{load.label}</span>
//         <ArrowIcon className="h-5 w-5 shrink-0 text-neutral-300 transition duration-300 group-hover/eng:-translate-x-1 group-hover/eng:text-brand-600" />
//       </article>
//     );
//   }

//   /* ================= كارت ================= */
//   return (
//     <article
//       className="card group/eng relative flex flex-col overflow-hidden p-5 pt-6 animate-rise transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-400"
//       style={{ animationDelay: `${delay}ms` }}
//     >
//       <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />

//       <div className="flex items-start gap-4">
//         <div className="relative shrink-0 transition duration-500 group-hover/eng:scale-105">
//           <Avatar engineer={eng} size={64} />
//           <span className="absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full ring-2 ring-white" style={{ background: load.dot }} title={load.label} />
//         </div>
//         <div className="min-w-0 flex-1">
//           <h3 className="truncate text-lg font-extrabold">
//             <Link to={to} className="after:absolute after:inset-0 focus:outline-none">{eng.name}</Link>
//           </h3>
//           <p className="truncate text-sm text-neutral-400">{teamLabel(team)}</p>
//           <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${load.pill}`}>{load.label}</span>
//         </div>
//         <div className="shrink-0">
//           {m.counts.running
//             ? <ProgressRing pct={m.pct} size={68} stroke={7} />
//             : <div className="grid h-[68px] w-[68px] place-items-center rounded-full text-lg font-bold text-neutral-300 ring-1 ring-neutral-200">—</div>}
//         </div>
//       </div>

//       <div className="mt-5 grid grid-cols-3 gap-2 text-center">
//         {[
//           ['جارية', n(m.counts.running), 'text-brand-600'],
//           ['سلّمت', n(m.delivered), 'text-brand-700'],
//           ['نسبة الفوز', m.winPct === null ? '—' : `${n(m.winPct)}%`, 'text-brand-600'],
//         ].map(([label, v, c]) => (
//           <div key={label} className="rounded-xl bg-neutral-50 py-2.5 transition duration-300 group-hover/eng:bg-brand-50/60">
//             <p className={`text-xl font-extrabold tabular-nums ${c}`}>{v}</p>
//             <p className="text-xs font-semibold text-neutral-400">{label}</p>
//           </div>
//         ))}
//       </div>

//       <div className="mt-4"><StatesBar m={m} ready={ready} /></div>

//       {/* أقرب تسليم */}
//       <div className="mt-4 flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2.5">
//         <CalendarIcon className="h-5 w-5 shrink-0 text-neutral-300" />
//         {m.next ? (
//           <>
//             <div className="min-w-0 flex-1">
//               <p className="truncate text-sm font-bold">{m.next.p.name || 'مشروع بدون اسم'}</p>
//               <p className="text-xs text-neutral-400">أقرب تسليم</p>
//             </div>
//             <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${deadlinePill(m.next.k)}`}>{soonText(m.next.k)}</span>
//           </>
//         ) : (
//           <p className="text-sm font-semibold text-neutral-400">لا توجد مواعيد تسليم قادمة</p>
//         )}
//       </div>

//       <div className="mt-4 flex items-center gap-2">
//         <p className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-400">{ago(m.lastSaved)}</p>
//         <Contact eng={eng} />
//         <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 ring-1 ring-neutral-200 transition duration-300 group-hover/eng:-translate-x-1 group-hover/eng:bg-brand-600 group-hover/eng:text-white group-hover/eng:ring-brand-600" aria-hidden="true">
//           <ArrowIcon className="h-4 w-4" />
//         </span>
//       </div>
//     </article>
//   );
// }


import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import ProgressRing from '../ui/ProgressRing';
import { ArrowIcon, CalendarIcon, MailIcon } from '../ui/Icons';
import { teamLabel } from '../../utils/helpers';
import { STATES, n } from '../../utils/dashboardData';

const HATCH = 'repeating-linear-gradient(135deg, #cbd5e1 0 2px, transparent 2px 7px)';

/* مستوى ضغط العمل حسب عدد المشاريع الجارية */
export const LOAD = {
  free:   { label: 'متاح',        pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: '#10b981' },
  normal: { label: 'حمل متوسط',   pill: 'bg-sky-50 text-sky-700 ring-sky-200',             dot: '#38bdf8' },
  heavy:  { label: 'ضغط عالي',    pill: 'bg-amber-50 text-amber-700 ring-amber-200',       dot: '#f59e0b' },
};
export const loadOf = (running) => (running === 0 ? 'free' : running >= 3 ? 'heavy' : 'normal');

const soonText = (k) => {
  if (k < 0) return `متأخر ${n(-k)} ${-k <= 10 ? 'أيام' : 'يوم'}`;
  if (k === 0) return 'يُسلَّم اليوم';
  if (k === 1) return 'غدًا';
  if (k === 2) return 'خلال يومين';
  return k <= 10 ? `خلال ${n(k)} أيام` : `خلال ${n(k)} يوم`;
};
const deadlinePill = (k) => (k < 0
  ? 'bg-rose-50 text-rose-600 ring-rose-200'
  : k <= 3 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-50 text-slate-500 ring-slate-200');

const rtf = new Intl.RelativeTimeFormat('ar-EG', { numeric: 'auto' });
const ago = (d) => {
  if (!d) return 'لم يُحفظ بعد';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return 'لم يُحفظ بعد';
  const s = Math.round((t - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return 'آخر تحديث الآن';
  const [div, unit] = a < 3600 ? [60, 'minute'] : a < 86400 ? [3600, 'hour'] : a < 2592000 ? [86400, 'day'] : a < 31536000 ? [2592000, 'month'] : [31536000, 'year'];
  return `آخر تحديث ${rtf.format(Math.round(s / div), unit)}`;
};

const PhoneIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

function Contact({ eng }) {
  const cls = 'relative z-10 grid h-9 w-9 place-items-center rounded-full text-slate-400 ring-1 ring-slate-200 transition duration-300 hover:bg-brand-600 hover:text-white hover:ring-brand-600';
  return (
    <>
      {eng.companyEmail && <a href={`mailto:${eng.companyEmail}`} aria-label={`إيميل ${eng.name}`} title={eng.companyEmail} className={cls}><MailIcon className="h-4 w-4" /></a>}
      {eng.phoneNumber && <a href={`tel:${eng.phoneNumber}`} aria-label={`اتصال بـ ${eng.name}`} title={eng.phoneNumber} className={cls}><PhoneIcon className="h-4 w-4" /></a>}
    </>
  );
}

/** شريط توزيع حالات مشاريع المهندس */
function StatesBar({ m, ready }) {
  const total = m.counts.running + m.counts.pending + m.counts.won + m.counts.lost;
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {total === 0
          ? <div className="flex-1" style={{ backgroundImage: HATCH }} />
          : ['running', 'won', 'pending', 'lost'].map((k) => m.counts[k] > 0 && (
            <div key={k} className="transition-[flex-grow] duration-1000 ease-out" title={`${STATES[k].label}: ${m.counts[k]}`}
              style={{ flexGrow: ready ? m.counts[k] : 0, flexBasis: 0, background: STATES[k].color }} />
          ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-400">
        {total === 0
          ? 'لا توجد مشاريع بعد'
          : `${n(m.counts.running)} جاري · ${n(m.counts.won)} فوز · ${n(m.counts.pending)} معلق · ${n(m.counts.lost)} خسارة`}
      </p>
    </div>
  );
}

export default function EngineerTile({ eng, team, m, delay = 0, ready = true, variant = 'card' }) {
  const color = team.color || '#6366f1';
  const load = LOAD[loadOf(m.counts.running)];
  const to = `/engineers/${eng.id}`;

  /* ================= صف مضغوط ================= */
  if (variant === 'list') {
    return (
      <article
        className="card group/eng relative flex items-center gap-3 overflow-hidden p-3.5 ps-5 animate-rise transition duration-300 hover:border-brand-200 hover:shadow-soft focus-within:ring-2 focus-within:ring-brand-400 sm:gap-4"
        style={{ animationDelay: `${delay}ms` }}
      >
        <span aria-hidden className="absolute inset-y-0 start-0 w-1" style={{ background: color }} />
        <Avatar engineer={eng} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold">
            <Link to={to} className="after:absolute after:inset-0 focus:outline-none">{eng.name}</Link>
          </h3>
          <p className="truncate text-xs text-slate-400">{teamLabel(team)}</p>
        </div>

        <div className="hidden w-40 shrink-0 md:block">
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
            <span>{n(m.td)} من {n(m.tt)} مهمة</span><span className="tabular-nums text-brand-700">{m.tt ? `${n(m.pct)}%` : '—'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-l from-sky-300 to-brand-600 transition-[width] duration-1000 ease-out" style={{ width: `${ready ? m.pct : 0}%` }} />
          </div>
        </div>

        <div className="hidden shrink-0 text-center sm:block">
          <p className="text-lg font-extrabold tabular-nums text-sky-600">{n(m.counts.running)}</p>
          <p className="text-xs font-semibold text-slate-400">جارية</p>
        </div>

        {m.next && (
          <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 lg:inline-block ${deadlinePill(m.next.k)}`}>{soonText(m.next.k)}</span>
        )}
        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 sm:inline-block ${load.pill}`}>{load.label}</span>
        <ArrowIcon className="h-5 w-5 shrink-0 text-slate-300 transition duration-300 group-hover/eng:-translate-x-1 group-hover/eng:text-brand-600" />
      </article>
    );
  }

  /* ================= كارت ================= */
  return (
    <article
      className="card group/eng relative flex flex-col overflow-hidden p-5 pt-6 animate-rise transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift focus-within:ring-2 focus-within:ring-brand-400"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />

      <div className="flex items-start gap-4">
        <div className="relative shrink-0 transition duration-500 group-hover/eng:scale-105">
          <Avatar engineer={eng} size={64} />
          <span className="absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full ring-2 ring-white" style={{ background: load.dot }} title={load.label} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-extrabold">
            <Link to={to} className="after:absolute after:inset-0 focus:outline-none">{eng.name}</Link>
          </h3>
          <p className="truncate text-sm text-slate-400">{teamLabel(team)}</p>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${load.pill}`}>{load.label}</span>
        </div>
        <div className="shrink-0">
          {m.tt
            ? <ProgressRing pct={m.pct} size={68} stroke={7} />
            : <div className="grid h-[68px] w-[68px] place-items-center rounded-full text-lg font-bold text-slate-300 ring-1 ring-slate-200">—</div>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
        {[
          ['المهام المنجزة', `${n(m.td)} / ${n(m.tt)}`, 'text-brand-700'],
          ['جارية', n(m.counts.running), 'text-sky-600'],
          ['سلّمت', n(m.delivered), 'text-brand-700'],
          ['نسبة الإنجاز', m.tt ? `${n(m.pct)}%` : '—', 'text-emerald-600'],
          ['نسبة الفوز', m.winPct === null ? '—' : `${n(m.winPct)}%`, 'text-emerald-600'],
        ].map(([label, v, c]) => (
          <div key={label} className="rounded-xl bg-slate-50 py-2.5 transition duration-300 group-hover/eng:bg-brand-50/60">
            <p className={`text-xl font-extrabold tabular-nums ${c}`}>{v}</p>
            <p className="text-xs font-semibold text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4"><StatesBar m={m} ready={ready} /></div>

      {/* أقرب تسليم */}
      <div className="mt-4 flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
        <CalendarIcon className="h-5 w-5 shrink-0 text-slate-300" />
        {m.next ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{m.next.p.name || 'مشروع بدون اسم'}</p>
              <p className="text-xs text-slate-400">أقرب تسليم</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${deadlinePill(m.next.k)}`}>{soonText(m.next.k)}</span>
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-400">لا توجد مواعيد تسليم قادمة</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-400">{ago(m.lastSaved)}</p>
        <Contact eng={eng} />
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 ring-1 ring-slate-200 transition duration-300 group-hover/eng:-translate-x-1 group-hover/eng:bg-brand-600 group-hover/eng:text-white group-hover/eng:ring-brand-600" aria-hidden="true">
          <ArrowIcon className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

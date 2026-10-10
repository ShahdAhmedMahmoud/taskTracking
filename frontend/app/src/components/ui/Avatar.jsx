// import { safePhoto } from '../../utils/helpers';

// export default function Avatar({ engineer, size = 40 }) {
//   const photo = safePhoto(engineer?.photoData);
//   const style = { width: size, height: size };
//   if (photo) return <img src={photo} alt={engineer?.name} style={style} className="shrink-0 rounded-full object-cover ring-2 ring-white" />;
//   return (
//     <div style={{ ...style, fontSize: size * 0.4 }}
//          className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 font-extrabold text-white ring-2 ring-white">
//       {engineer?.name?.trim()?.[0] || '👤'}
//     </div>
//   );
// }

import { safePhoto } from '../../utils/helpers';

const GRADS = [
  'from-brand-500 to-brand-800',
  'from-sky-400 to-sky-700',
  'from-emerald-400 to-emerald-700',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-rose-700',
  'from-violet-400 to-violet-700',
];

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const initials = (name = '') => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return (w[0]?.[0] || '؟') + (w[1]?.[0] || '');
};

export default function Avatar({ engineer, size = 40, className = '' }) {
  const name = engineer?.name || '';
  const photo = safePhoto(engineer?.photoData);

  if (photo) {
    return <img src={photo} alt={name} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />;
  }

  return (
    <span
      aria-label={name} title={name}
      className={`grid shrink-0 select-none place-items-center rounded-full bg-gradient-to-br font-extrabold text-white ${GRADS[hash(name) % GRADS.length]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)) }}
    >
      {initials(name)}
    </span>
  );
}
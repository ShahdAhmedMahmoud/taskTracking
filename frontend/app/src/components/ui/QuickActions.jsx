import { Link } from 'react-router-dom';

export default function QuickActions({ items }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-5 pt-3 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(9.75rem,1fr))] sm:overflow-visible sm:px-0 sm:pb-1">
      {items.map(([to, Icon, title, desc], i) => (
        <Link
          key={to} to={to} title={desc}
          className="group relative flex w-36 shrink-0 snap-start flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white px-3 py-5 text-center shadow-soft transition duration-300 animate-rise hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-lift sm:w-auto"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <span className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-brand-200/0 blur-2xl transition duration-500 group-hover:bg-brand-200/80" />
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-brand-500 group-hover:to-brand-800 group-hover:text-white group-hover:shadow-lg">
            <Icon className="h-7 w-7" />
          </span>
          <span className="relative text-sm font-extrabold text-slate-700 transition group-hover:text-brand-800">{title}</span>
        </Link>
      ))}
    </div>
  );
}
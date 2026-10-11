import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, actions, back }) {
  const nav = useNavigate();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {back && <button onClick={() => nav(-1)} className="btn-ghost !px-3" aria-label="رجوع">→</button>}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
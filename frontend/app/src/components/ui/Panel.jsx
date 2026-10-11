export default function Panel({ title, subtitle, action, className = '', delay = 0, children }) {
  return (
    <section
      className={`card group/panel relative p-5 animate-rise transition duration-300 hover:border-brand-200 hover:shadow-lift sm:p-6 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* خط ملوّن بيتفتح من اليمين عند الـ hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-right scale-x-0 rounded-t-2xl bg-gradient-to-l from-brand-400 to-brand-600 transition-transform duration-500 ease-out group-hover/panel:scale-x-100" />
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-neutral-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
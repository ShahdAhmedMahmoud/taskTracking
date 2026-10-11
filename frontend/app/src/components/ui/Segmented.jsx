export default function Segmented({ value, onChange, options }) {
  const idx = Math.max(0, options.findIndex(([v]) => v === value));
  const cols = options.length;
  return (
    <div role="tablist" className="relative inline-grid rounded-2xl bg-neutral-100 p-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      <span
        className="absolute inset-y-1 rounded-xl bg-white shadow-sm transition-all duration-300 ease-out"
        style={{ width: `calc((100% - 0.5rem) / ${cols})`, insetInlineStart: `calc(0.25rem + ${idx} * (100% - 0.5rem) / ${cols})` }}
      />
      {options.map(([v, label]) => (
        <button
          key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`relative z-10 whitespace-nowrap px-3 py-2 text-sm font-bold transition-colors sm:px-4 ${value === v ? 'text-brand-700' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
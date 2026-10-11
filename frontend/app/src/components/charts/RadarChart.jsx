
/**
 * رادار لمقارنة الفرق على عدة محاور (0..100) — SVG خالص.
 * axes:   ['إنجاز المهام', 'نسبة الفوز', ...]
 * series: [{ name, color, values: [..نفس عدد المحاور..] }]
 */
export default function RadarChart({ axes, series, size = 320, rings = 4 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46;
  const k = axes.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / k;
  const pt = (i, val) => {
    const rr = (Math.max(0, Math.min(100, val)) / 100) * R;
    return [cx + rr * Math.cos(ang(i)), cy + rr * Math.sin(ang(i))];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v).join(',')).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block h-auto w-full max-w-[22rem]" role="img" aria-label="مقارنة الفرق على عدة محاور">
        {Array.from({ length: rings }, (_, r) => {
          const f = (r + 1) / rings;
          const ring = axes.map((_, i) => [cx + R * f * Math.cos(ang(i)), cy + R * f * Math.sin(ang(i))].join(',')).join(' ');
          return <polygon key={r} points={ring} fill={r % 2 ? 'rgba(111,125,208,.04)' : 'none'} stroke="#E2E8F0" strokeWidth="1" />;
        })}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 100);
          const [lx, ly] = [cx + (R + 24) * Math.cos(ang(i)), cy + (R + 24) * Math.sin(ang(i))];
          return (
            <g key={a}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" style={{ fontSize: 11, fontWeight: 700 }}>{a}</text>
            </g>
          );
        })}
        {series.map((s) => (
          <g key={s.name}>
            <polygon points={poly(s.values)} fill={s.color} fillOpacity=".14" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
            {s.values.map((v, i) => {
              const [x, y] = pt(i, v);
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />;
            })}
          </g>
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
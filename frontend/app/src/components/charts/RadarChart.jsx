import { useMemo, useState } from 'react';
import { n } from '../../utils/dashboardData';

/**
 * SVG Radar Chart with:
 * 1) Compact axis explanation card positioned immediately beside the clicked point.
 * 2) Separate dynamic team ranking and progress by percentage card displayed only when a point is clicked.
 */
export default function RadarChart({ axes, series, descriptions = [], size = 360, rings = 4 }) {
  const [selected, setSelected] = useState(null);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 72;
  const k = axes.length;

  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / k;
  const pt = (i, val) => {
    const rr = (Math.max(0, Math.min(100, Number(val) || 0)) / 100) * R;
    return [cx + rr * Math.cos(ang(i)), cy + rr * Math.sin(ang(i))];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v).join(',')).join(' ');

  const ranked = useMemo(() => {
    if (selected === null || selected.axis === undefined) return [];
    return series
      .map((team) => ({
        ...team,
        score: Math.max(0, Math.min(100, Number(team.values[selected.axis]) || 0)),
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ar'));
  }, [series, selected]);

  const selectedTeam = selected && series.find((team) => team.name === selected.team);
  const desc = descriptions[selected?.axis ?? 0] || 'النسبة محسوبة من بيانات المشاريع والمهام المسجلة للفريق.';

  const choosePoint = (team, axis) => {
    setSelected((current) => (current?.team === team && current.axis === axis ? null : { team, axis }));
  };

  const onPointKey = (event, team, axis) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choosePoint(team, axis);
    }
  };

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-[31rem] rounded-3xl bg-gradient-to-br from-brand-50/70 via-white to-sky-50/60 p-1 sm:p-3">
        <svg
          viewBox={`-54 -48 ${size + 108} ${size + 96}`}
          className="mx-auto block h-auto w-full overflow-visible"
          role="img"
          aria-label="مقارنة أداء الفرق على محاور الرادار؛ اضغطي على أي نقطة لعرض التوضيح وترتيب الفرق"
        >
          <defs>
            <radialGradient id="radar-glow">
              <stop stopColor="#6F7DD0" stopOpacity=".10" />
              <stop offset="1" stopColor="#6F7DD0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R + 4} fill="url(#radar-glow)" />

          {/* Concentric grid rings */}
          {Array.from({ length: rings }, (_, r) => {
            const f = (r + 1) / rings;
            const ring = axes
              .map((_, i) => [cx + R * f * Math.cos(ang(i)), cy + R * f * Math.sin(ang(i))].join(','))
              .join(' ');
            return (
              <polygon
                key={r}
                points={ring}
                fill={r % 2 ? 'rgba(111,125,208,.045)' : 'rgba(255,255,255,.55)'}
                stroke="#DDE3F2"
                strokeWidth="1"
              />
            );
          })}

          {/* Axes spokes and labels */}
          {axes.map((axis, i) => {
            const [x, y] = pt(i, 100);
            const labelX = cx + (R + 29) * Math.cos(ang(i));
            const labelY = cy + (R + 29) * Math.sin(ang(i));
            const words = axis.split(/\s+/);
            const lines = words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [axis];
            const anchor = Math.cos(ang(i)) > 0.28 ? 'start' : Math.cos(ang(i)) < -0.28 ? 'end' : 'middle';
            const isAxisSelected = selected?.axis === i;

            return (
              <g key={axis}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={isAxisSelected ? '#2A317A' : '#DDE3F2'} strokeWidth={isAxisSelected ? '1.8' : '1.2'} />
                <circle cx={x} cy={y} r={isAxisSelected ? '3' : '2'} fill={isAxisSelected ? '#2A317A' : '#94A3B8'} />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  role="button"
                  tabIndex="0"
                  onClick={() => choosePoint(selected?.team || series[0]?.name, i)}
                  className={`cursor-pointer text-[11px] font-bold transition hover:fill-brand-700 ${
                    isAxisSelected ? 'fill-brand-800 font-black' : 'fill-slate-600'
                  }`}
                >
                  {lines.map((line, lineIndex) => (
                    <tspan key={lineIndex} x={labelX} dy={lineIndex ? 13 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Team polygons and clickable markers */}
          {series.map((team, seriesIndex) => (
            <g key={team.name} className="animate-fade-up" style={{ animationDelay: `${seriesIndex * 70}ms` }}>
              <polygon
                points={poly(team.values)}
                fill={team.color}
                fillOpacity={selectedTeam?.name === team.name ? '.24' : '.11'}
                stroke={team.color}
                strokeWidth={selectedTeam?.name === team.name ? '2.8' : '1.8'}
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
              {team.values.map((value, axis) => {
                const [x, y] = pt(axis, value);
                const active = selected?.axis === axis && selected?.team === team.name;
                return (
                  <g
                    key={`${team.name}-${axis}`}
                    role="button"
                    tabIndex="0"
                    aria-label={`${team.name}، ${axes[axis]}: ${n(value)} بالمئة`}
                    aria-pressed={active}
                    onClick={() => choosePoint(team.name, axis)}
                    onKeyDown={(event) => onPointKey(event, team.name, axis)}
                    className="cursor-pointer outline-none"
                  >
                    <circle cx={x} cy={y} r="12" fill="transparent" />
                    <circle
                      cx={x}
                      cy={y}
                      r={active ? 6.5 : 4.5}
                      fill={active ? team.color : '#fff'}
                      stroke={team.color}
                      strokeWidth={active ? 3 : 2.2}
                      className="transition-all duration-200 hover:fill-brand-100 focus:fill-brand-100"
                    />
                    {active && (
                      <circle
                        cx={x}
                        cy={y}
                        r="10"
                        fill="none"
                        stroke={team.color}
                        strokeOpacity=".35"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Requirement 2: Compact Axis Explanation Card positioned immediately beside the selected point */}
          {selected && selectedTeam && (() => {
            const [pointX, pointY] = pt(selected.axis, selectedTeam.values[selected.axis]);
            const cardWidth = 156;
            const cardHeight = 68;

            // Position immediately beside the clicked point
            let x = pointX > cx ? pointX - cardWidth - 8 : pointX + 8;
            let y = pointY > cy ? pointY - cardHeight - 8 : pointY + 8;

            // Clamping so the card remains visible near the point without clipping
            x = Math.max(-48, Math.min(size + 48 - cardWidth, x));
            y = Math.max(-42, Math.min(size + 42 - cardHeight, y));

            return (
              <foreignObject
                x={x}
                y={y}
                width={cardWidth}
                height={cardHeight}
                className="animate-fade-up pointer-events-auto"
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-brand-200/90 bg-white/95 p-2 text-right shadow-md backdrop-blur-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-1 border-b border-brand-50 pb-1">
                    <span className="truncate text-[10px] font-extrabold text-brand-800">
                      محور: {axes[selected.axis]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(null);
                      }}
                      aria-label="إغلاق التوضيح"
                      className="grid h-4 w-4 shrink-0 place-items-center rounded text-[9px] font-bold text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="line-clamp-2 text-[8.5px] font-medium leading-3 text-neutral-600">
                    {desc}
                  </p>
                </div>
              </foreignObject>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {series.map((team) => (
          <li
            key={team.name}
            className={`flex max-w-full min-w-0 items-center gap-1.5 text-xs font-bold transition ${
              selected?.team === team.name ? 'text-brand-800' : 'text-slate-500'
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: team.color }}
            />
            <span className="break-words">{team.name}</span>
          </li>
        ))}
      </ul>

      {/* Requirement 1: Interactive Card: Team Ranking and Progress by Percentage */}
      {selected && selectedTeam && ranked.length > 0 && (
        <section
          aria-label={`ترتيب الفرق في محور ${axes[selected.axis]}`}
          className="mt-4 w-full rounded-3xl border border-brand-100 bg-white p-4 shadow-sm animate-fade-up sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                  🏆
                </span>
                <h4 className="text-sm font-extrabold text-neutral-800 sm:text-base">
                  ترتيب ونسب إنجاز الفرق
                </h4>
              </div>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                محور: <span className="font-extrabold text-brand-700">{axes[selected.axis]}</span> · الفريق المحدد:{' '}
                <span className="font-extrabold text-neutral-800">{selectedTeam.name} ({n(selectedTeam.values[selected.axis])}%)</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-xl px-2.5 py-1 text-xs font-bold text-neutral-400 ring-1 ring-neutral-200 transition hover:bg-neutral-50 hover:text-neutral-700"
            >
              إغلاق الترتيب ✕
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {ranked.map((team, index) => {
              const isSelected = team.name === selected.team;
              const rankNumber = index + 1;
              return (
                <div
                  key={team.name}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all sm:px-3 sm:py-2.5 ${
                    isSelected
                      ? 'bg-brand-50/70 ring-1 ring-brand-300 shadow-xs'
                      : 'hover:bg-neutral-50 ring-1 ring-neutral-100'
                  }`}
                >
                  {/* Ranking number */}
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs font-black tabular-nums ${
                      rankNumber === 1
                        ? 'bg-brand-700 text-white shadow-xs'
                        : rankNumber === 2
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {n(rankNumber)}
                  </span>

                  {/* Team indicator & name */}
                  <div className="min-w-0 flex-1 basis-32">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: team.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-xs font-bold text-neutral-800 sm:text-sm">
                        {team.name}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                          المحدد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual progress bar */}
                  <div className="min-w-20 max-w-44 flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${team.score}%`,
                          background: isSelected ? '#2A317A' : team.color || '#2A317A',
                        }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span className="min-w-11 shrink-0 text-end text-xs font-black tabular-nums text-brand-800 sm:text-sm">
                    {n(team.score)}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

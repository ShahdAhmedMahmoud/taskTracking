import { n } from '../../utils/dashboardData';

/**
 * عدّاد دائري (Progress Ring) — SVG خالص بدون مكتبات.
 * - value: 0..100
 * - ready: لتشغيل أنيميشن التعبئة بعد أول رسم
 * - children: لو اتبعت بيستبدل الرقم اللي في النص
 */
export default function RadialGauge({
  value = 0,
  size = 160,
  stroke = 12,
  color = '#6F7DD0',
  trackColor = '#EEF0FB',
  textClass = 'text-brand-700',
  label,
  ready = true,
  children,
}) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label || 'النسبة'} ${v}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (ready ? v : 0) / 100)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,.8,.3,1)' }}
          className="motion-reduce:!transition-none"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        {children ?? (
          <>
            <span className={`font-extrabold leading-none tabular-nums ${textClass}`} style={{ fontSize: Math.max(12, size * 0.24) }}>
              {n(Math.round(v))}%
            </span>
            {label && <span className="mt-1 text-[11px] font-semibold opacity-70">{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}
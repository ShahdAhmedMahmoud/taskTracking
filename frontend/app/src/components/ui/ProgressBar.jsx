export default function ProgressBar({ pct = 0, color }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-violet-500 transition-all duration-700"
           style={{ width: `${Math.min(100, pct)}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}
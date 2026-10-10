import { useEffect, useRef, useState } from 'react';

/** يعدّ من القيمة السابقة للجديدة بحركة ناعمة (ease-out). يحترم prefers-reduced-motion. */
export default function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(to); prev.current = to; return undefined; }

    const from = prev.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}
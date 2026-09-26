import { useEffect, useState } from "react";
import { fmtTime } from "../lib/format";

const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];

export function niceTicks(duration: number, maxTicks = 8): number[] {
  const step = STEPS.find((s) => duration / s <= maxTicks) ?? 3600;
  const ticks: number[] = [];
  for (let t = 0; t <= duration + 1e-6; t += step) ticks.push(t);
  return ticks;
}

/** Tick labels under a track. Place inside the same grid column as the track so they line up. */
function useNarrow() {
  const q = "(max-width: 639px)";
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

export default function TimeAxis({ duration }: { duration: number }) {
  const narrow = useNarrow();
  if (!(duration > 0)) return null;
  return (
    <div className="relative h-5 text-[11px] text-ink-3 tnum select-none" aria-hidden>
      {niceTicks(duration, narrow ? 3 : 8).map((t) => {
        const pct = (t / duration) * 100;
        const align = pct > 96 ? "-translate-x-full" : pct < 2 ? "" : "-translate-x-1/2";
        return (
          <span key={t} className={`absolute top-1 ${align}`} style={{ left: `${pct}%` }}>
            {fmtTime(t, 0)}
          </span>
        );
      })}
    </div>
  );
}

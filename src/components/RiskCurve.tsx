import { useMemo, useState } from "react";
import { RISK_THRESHOLD } from "../lib/config";
import { downsampleMax, fmtTime, scoreAt } from "../lib/format";
import type { Event, RiskPoint } from "../lib/types";
import TimeAxis from "./TimeAxis";

interface Props {
  risk: RiskPoint[];
  events: Event[];
  duration: number;
  time: number;
  onSeek: (t: number) => void;
}

const H = 5; // anticipation horizon in seconds, fixed by the task

/** Part B risk score over time, with the θ = 0.5 alarm line and each accident's 5 s pre-window shaded. */
export default function RiskCurve({ risk, events, duration, time, onSeek }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(() => downsampleMax(risk), [risk]);
  const accidents = events.filter((e) => e[2] === "accident");

  if (!risk.length) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">No risk curve for this video.</p>;
  }

  const x = (t: number) => (t / duration) * 1000;
  const y = (s: number) => 100 - s * 100;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
  const area = `${line}L${x(points[points.length - 1][0]).toFixed(1)},100L${x(points[0][0]).toFixed(1)},100Z`;
  // Alarm runs (score ≥ θ), shaded so they are visible even when the peak is one frame wide.
  const alarms: [number, number][] = [];
  for (const [t, s] of risk) {
    if (s < RISK_THRESHOLD) continue;
    const last = alarms[alarms.length - 1];
    if (last && t - last[1] < 2) last[1] = t;
    else alarms.push([t, t]);
  }
  const tAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
  };
  const hoverScore = hover != null ? scoreAt(risk, hover) : undefined;

  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-3">
      <div className="relative h-36 text-[11px] text-ink-3 tnum">
        <span className="absolute top-0 right-0">1.0</span>
        <span className="absolute top-1/2 right-0 -translate-y-1/2 font-medium text-ink-2">θ 0.5</span>
        <span className="absolute bottom-0 right-0">0.0</span>
        {alarms.length > 0 && <span className="absolute bottom-5 right-0 text-danger">{alarms.length} alarm{alarms.length > 1 ? "s" : ""}</span>}
      </div>
      <div
        className="relative h-36 cursor-crosshair touch-pan-y rounded-md bg-panel-2/70"
        onClick={(e) => onSeek(tAt(e as unknown as React.PointerEvent<HTMLDivElement>))}
        onPointerMove={(e) => setHover(tAt(e))}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-label="Accident risk over time">
          {accidents.map((a, i) => (
            <g key={i}>
              <rect x={x(Math.max(0, a[0] - H))} width={x(Math.min(H, a[0]))} y={0} height={100} fill="var(--danger)" opacity={0.1} />
              <rect x={x(a[0])} width={Math.max(1, x(a[1] - a[0]))} y={0} height={100} fill="var(--danger)" opacity={0.25} />
            </g>
          ))}
          {alarms.map(([s, e], i) => (
            <rect key={i} x={x(s) - 2} width={Math.max(4, x(e - s) + 4)} y={0} height={100} fill="var(--danger)" opacity={0.14} />
          ))}
          <path d={area} fill="var(--sign)" opacity={0.13} />
          <path d={line} fill="none" stroke="var(--sign)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={1000} y1={y(RISK_THRESHOLD)} y2={y(RISK_THRESHOLD)} stroke="var(--ink-3)" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
          {time >= 0 && <line x1={x(time)} x2={x(time)} y1={0} y2={100} stroke="var(--mark)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={100} stroke="var(--ink-3)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
        </svg>
        {hover != null && hoverScore != null && (
          <div
            className={`pointer-events-none absolute top-1.5 rounded-md bg-ink px-2 py-1 font-mono text-[11px] text-bg shadow-float tnum ${hover / duration > 0.75 ? "-translate-x-full -ml-2" : "ml-2"}`}
            style={{ left: `${(hover / duration) * 100}%` }}
          >
            {fmtTime(hover)} · {hoverScore.toFixed(2)}
          </div>
        )}
      </div>
      <div />
      <TimeAxis duration={duration} />
    </div>
  );
}

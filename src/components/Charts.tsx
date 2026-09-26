import { useState, type ReactNode } from "react";
import { fmtTime } from "../lib/format";
import TimeAxis from "./TimeAxis";

const PALETTE = ["var(--sign)", "#f5a300", "#e5484d", "#12a594", "#8e4ec6", "#a18072", "#3e9bff", "#6fb12b"];

interface Series {
  name: string;
  values: number[];
  color?: string;
}

/** Multi-series line chart over time (seconds) with a hover / touch readout. */
export function TimeLineChart({ t, series, unit }: { t: number[]; series: Series[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [off, setOff] = useState<Set<string>>(new Set());
  if (!t.length || !series.length) return <p className="text-ink-3">No data.</p>;
  const duration = t[t.length - 1] || 1;
  const shown = series.filter((s) => !off.has(s.name));
  const max = Math.max(1, ...shown.flatMap((s) => s.values));
  const x = (v: number) => (v / duration) * 1000;
  const y = (v: number) => 100 - (v / max) * 94;
  const color = (s: Series) => s.color ?? PALETTE[series.indexOf(s) % PALETTE.length];

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const target = ((e.clientX - r.left) / r.width) * duration;
    let best = 0;
    t.forEach((v, i) => Math.abs(v - target) < Math.abs(t[best] - target) && (best = i));
    setHover(best);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px]">
        {series.map((s) => {
          const isOff = off.has(s.name);
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={!isOff}
              onClick={() => setOff((o) => { const n = new Set(o); n.has(s.name) ? n.delete(s.name) : n.add(s.name); return n; })}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${isOff ? "border-dashed border-line-2 text-ink-3" : "border-line bg-panel-2"}`}
            >
              <span className="h-[3px] w-3.5 rounded-full" style={{ background: isOff ? "var(--line-2)" : color(s) }} />
              {s.name}
              {hover != null && !isOff && <strong className="font-mono text-[12px] tnum">{s.values[hover]}</strong>}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-xs text-ink-3 tnum">{hover != null ? `at ${fmtTime(t[hover], 0)}` : unit}</span>
      </div>
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2">
        <div className="relative h-52 font-mono text-[10.5px] text-ink-3 tnum">
          <span className="absolute top-0 right-0">{max}</span>
          <span className="absolute top-1/2 right-0 -translate-y-1/2">{Math.round(max / 2)}</span>
          <span className="absolute bottom-0 right-0">0</span>
        </div>
        <div className="relative h-52 touch-pan-y rounded-md border border-line bg-panel-2/40" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            {[25, 50, 75].map((g) => <line key={g} x1={0} x2={1000} y1={g} y2={g} stroke="var(--line)" vectorEffect="non-scaling-stroke" />)}
            {shown.map((s) => (
              <path
                key={s.name}
                d={s.values.map((v, j) => `${j ? "L" : "M"}${x(t[j]).toFixed(1)},${y(v).toFixed(1)}`).join("")}
                fill="none"
                stroke={color(s)}
                strokeWidth={1.7}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {hover != null && <line x1={x(t[hover])} x2={x(t[hover])} y1={0} y2={100} stroke="var(--ink-3)" vectorEffect="non-scaling-stroke" />}
          </svg>
        </div>
        <div />
        <TimeAxis duration={duration} />
      </div>
    </div>
  );
}

/** Horizontal bars, one per row. */
export function BarList({ rows, format }: { rows: { label: ReactNode; value: number; color?: string; hint?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[minmax(6.5rem,11rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
          <span className="truncate text-ink-2" title={r.hint}>{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-panel-2">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? "var(--sign)" }} />
          </span>
          <span className="text-right font-mono text-[13px] tnum">{format ? format(r.value) : r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Plain data table. A row whose first cell mentions "(submitted)" is highlighted: that is the
 * configuration that ships, in every ablation.
 */
export function DataTable({ columns, rows, highlight = /\(submitted/i }: { columns: string[]; rows: (string | number | null)[][]; highlight?: RegExp }) {
  return (
    <div className="card scroll-x">
      <table className="w-full text-sm tnum">
        <thead className="border-b border-line bg-panel-2 text-left text-xs text-ink-3">
          <tr>{columns.map((c) => <th key={c} className="px-4 py-2.5 font-medium whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const hl = highlight.test(String(r[0] ?? ""));
            return (
              <tr key={i} className={`border-t border-line first:border-t-0 ${hl ? "bg-panel-2" : ""}`}>
                {r.map((c, j) => (
                  <td key={j} className={`px-4 py-2.5 align-top ${j === 0 ? "min-w-[14rem] font-medium" : "whitespace-nowrap text-ink-2"} ${hl && j > 0 ? "font-semibold text-ink" : ""}`}>
                    {j === 0 && hl ? (
                      <span className="flex items-start gap-2">
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-mark" />
                        {c}
                      </span>
                    ) : (c ?? "–")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Rows × columns grid of counts with cell shading; used by the dashboard. */
export function HeatTable({ rows, cols, value, rowLabel, colLabel, color = "var(--sign)" }: {
  rows: string[];
  cols: string[];
  value: (r: string, c: string) => number;
  rowLabel: (r: string) => ReactNode;
  colLabel: (c: string) => ReactNode;
  color?: string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => value(r, c))));
  return (
    <div className="card scroll-x">
      <table className="w-full text-sm tnum">
        <thead className="border-b border-line bg-panel-2 text-xs text-ink-3">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium" />
            {cols.map((c) => <th key={c} className="px-3 py-2.5 text-center font-medium whitespace-nowrap">{colLabel(c)}</th>)}
            <th className="px-4 py-2.5 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const total = cols.reduce((s, c) => s + value(r, c), 0);
            return (
              <tr key={r} className="border-t border-line first:border-t-0">
                <th scope="row" className="px-4 py-2 text-left font-medium whitespace-nowrap">{rowLabel(r)}</th>
                {cols.map((c) => {
                  const v = value(r, c);
                  return (
                    <td key={c} className="p-1 text-center">
                      <span
                        className={`block rounded-md py-1.5 font-mono text-[13px] ${v ? "text-ink" : "text-ink-3"}`}
                        style={{ background: v ? `color-mix(in srgb, ${color} ${Math.round(12 + (v / max) * 58)}%, transparent)` : "transparent" }}
                      >
                        {v || "·"}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-right font-mono font-semibold">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

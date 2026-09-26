import { classInfo, sortByClassOrder } from "../lib/classes";
import { fmtTime } from "../lib/format";
import type { Event } from "../lib/types";
import TimeAxis from "./TimeAxis";

interface Props {
  events: Event[];
  duration: number;
  time: number;
  onSeek: (t: number) => void;
  hidden?: Set<string>;
  compact?: boolean;
  /** Read-only rendering (no buttons), for use inside a link card. */
  static?: boolean;
}

/** One lane per class present, bars positioned by time. Click a bar to jump to its start. */
export default function EventTimeline({ events, duration, time, onSeek, hidden, compact, static: readOnly }: Props) {
  const labels = sortByClassOrder([...new Set(events.map((e) => e[2]))]).filter((l) => !hidden?.has(l));
  const pct = (t: number) => `${Math.max(0, Math.min(100, (t / duration) * 100))}%`;
  const h = compact ? "h-5" : "h-8";

  if (!events.length) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">No events detected in this video.</p>;
  }
  if (!labels.length) {
    return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">All classes are hidden. Turn one back on above.</p>;
  }

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - r.left) / r.width) * duration);
  };

  return (
    <div
      className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 sm:gap-x-3 ${compact ? "gap-y-1 sm:grid-cols-[10.5rem_minmax(0,1fr)]" : "gap-y-1.5 sm:grid-cols-[11rem_minmax(0,1fr)]"}`}
      role="group"
      aria-label="Event timeline"
    >
      {labels.map((label) => {
        const info = classInfo(label);
        const rowEvents = events.filter((e) => e[2] === label);
        return (
          <div key={label} className="contents">
            <div className={`flex min-w-0 items-center gap-2 text-xs text-ink-2 sm:text-[13px] ${h}`} title={info.name}>
              <span className="size-2 shrink-0 rounded-full" style={{ background: info.color }} />
              <span className="truncate">{info.name}</span>
            </div>
            <div className={`lane-dash relative rounded-md bg-panel-2/70 ${h} ${readOnly ? "" : "cursor-pointer"}`} onClick={seekFromClick}>
              {rowEvents.map((ev, i) => {
                const active = time >= ev[0] && time <= ev[1];
                const style = { left: pct(ev[0]), width: `max(4px, ${pct(ev[1] - ev[0])})`, background: info.color };
                const cls = `absolute top-[3px] bottom-[3px] rounded-[4px] ${active ? "ring-2 ring-ink ring-offset-1 ring-offset-panel" : ""}`;
                return readOnly ? (
                  <span key={i} className={cls} style={style} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(ev[0]);
                    }}
                    title={`${info.name}: ${fmtTime(ev[0])}–${fmtTime(ev[1])}`}
                    aria-label={`${info.name} from ${fmtTime(ev[0])} to ${fmtTime(ev[1])}. Jump to start.`}
                    className={`${cls} transition-[filter,box-shadow] hover:brightness-110 ${active ? "" : "hover:ring-2 hover:ring-ink-3/60"}`}
                    style={style}
                  />
                );
              })}
              {time >= 0 && <div className="pointer-events-none absolute -inset-y-0.5 w-0.5 rounded-full bg-mark" style={{ left: pct(time) }} />}
            </div>
          </div>
        );
      })}
      <div />
      <TimeAxis duration={duration} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { classInfo, sortByClassOrder } from "../lib/classes";
import { RISK_THRESHOLD } from "../lib/config";
import { downloadJson, fmtTime, scoreAt } from "../lib/format";
import type { Event, RiskPoint } from "../lib/types";
import ClassFilter from "./ClassFilter";
import EventTable from "./EventTable";
import EventTimeline from "./EventTimeline";
import RiskCurve from "./RiskCurve";
import { Icon } from "./ui";

export interface VideoSource {
  label: string;
  src: string;
}

interface Props {
  sources: VideoSource[]; // e.g. annotated + original; may be empty
  events: Event[];
  risk: RiskPoint[];
  duration: number;
  downloadName?: string;
  poster?: string;
  startAt?: number;
}

/**
 * Player, event timeline, risk curve and event table, all synced to one clock.
 * Used by every sample-video page and by the live demo.
 */
export default function ResultView({ sources, events, risk, duration: givenDuration, downloadName, poster, startAt }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(startAt ?? 0);
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [videoDuration, setVideoDuration] = useState(0);

  const available = sources.filter((s) => !failed.has(s.src));
  const source = available[Math.min(srcIndex, available.length - 1)];
  const duration = givenDuration > 0 ? givenDuration : videoDuration || Math.max(1, ...events.map((e) => e[1]));

  // Smooth playhead while playing; timeupdate alone fires only ~4 times a second.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      setTime(v.currentTime);
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => (raf = requestAnimationFrame(tick));
    const onSeeked = () => setTime(v.currentTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("timeupdate", onSeeked);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("timeupdate", onSeeked);
    };
  }, [source?.src]);

  const seek = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(duration, t));
    const v = videoRef.current;
    if (v) {
      if (v.readyState > 0) v.currentTime = clamped;
      else v.addEventListener("loadedmetadata", () => (v.currentTime = clamped), { once: true });
    }
    setTime(clamped);
  }, [duration]);

  const switchSource = (i: number) => {
    const t = videoRef.current?.currentTime ?? time;
    setSrcIndex(i);
    requestAnimationFrame(() => {
      const v = videoRef.current;
      if (v) v.addEventListener("loadedmetadata", () => (v.currentTime = t), { once: true });
    });
  };

  const toggle = (l: string) =>
    setHidden((h) => {
      const n = new Set(h);
      n.has(l) ? n.delete(l) : n.add(l);
      return n;
    });

  const visible = events.filter((e) => !hidden.has(e[2])).sort((a, b) => a[0] - b[0]);
  const activeNow = visible.filter((e) => time >= e[0] && time <= e[1]);
  const riskNow = scoreAt(risk, time);
  const prevEvent = [...visible].reverse().find((e) => e[0] < time - 0.5);
  const nextEvent = visible.find((e) => e[0] > time + 0.05);
  const alarm = riskNow != null && riskNow >= RISK_THRESHOLD;
  const counts = new Map<string, number>();
  events.forEach((e) => counts.set(e[2], (counts.get(e[2]) ?? 0) + 1));
  const classes = sortByClassOrder([...counts.keys()]).map((l) => [l, counts.get(l)!] as const);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="overflow-hidden rounded-2xl bg-black">
          {source ? (
            <video
              key={source.src}
              ref={videoRef}
              src={source.src}
              poster={poster}
              controls
              playsInline
              preload="metadata"
              className="block max-h-[78vh] w-full"
              onLoadedMetadata={(e) => {
                setVideoDuration(e.currentTarget.duration);
                if (startAt) e.currentTarget.currentTime = startAt;
              }}
              onError={() => setFailed((f) => new Set(f).add(source.src))}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-white/70">
              Video not available. The timeline and risk curve below still work; click them to move the cursor.
            </div>
          )}
        </div>

        <aside className="card flex flex-col gap-5 p-5">
          {available.length > 1 && (
            <div className="flex rounded-[10px] border border-line bg-panel-2 p-1 text-sm" role="tablist" aria-label="Video version">
              {available.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={s === source}
                  onClick={() => switchSource(i)}
                  className={`flex-1 rounded-[7px] px-2 py-1.5 font-medium ${s === source ? "bg-panel shadow-card" : "text-ink-2"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label mb-1">Position</div>
              <div className="font-mono text-2xl font-medium tnum">{fmtTime(time)}</div>
            </div>
            {risk.length > 0 && (
              <div>
                <div className="label mb-1">Risk now</div>
                <div className={`font-mono text-2xl font-medium tnum ${alarm ? "text-danger" : ""}`}>{riskNow != null ? riskNow.toFixed(2) : "–"}</div>
              </div>
            )}
          </div>
          {risk.length > 0 && (
            <div className="relative h-2 overflow-hidden rounded-full bg-panel-2" aria-hidden>
              <div className={`h-full rounded-full transition-[width] duration-150 ${alarm ? "bg-danger" : "bg-sign"}`} style={{ width: `${(riskNow ?? 0) * 100}%` }} />
              <div className="absolute inset-y-0 w-px bg-ink-3" style={{ left: `${RISK_THRESHOLD * 100}%` }} />
            </div>
          )}

          <div>
            <div className="label mb-2">Happening now</div>
            {activeNow.length ? (
              <ul className="space-y-1.5">
                {activeNow.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-panel-2 px-2.5 py-1.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: classInfo(e[2]).color }} />
                      <span className="truncate font-medium">{classInfo(e[2]).name}</span>
                    </span>
                    <span className="font-mono text-xs text-ink-3 tnum">→ {fmtTime(e[1], 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">No event at this moment.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!prevEvent} onClick={() => prevEvent && seek(prevEvent[0])} className="btn btn-ghost btn-sm disabled:opacity-40">
              <Icon name="back" className="size-3.5" /> Prev event
            </button>
            <button type="button" disabled={!nextEvent} onClick={() => nextEvent && seek(nextEvent[0])} className="btn btn-ghost btn-sm disabled:opacity-40">
              Next event <Icon name="arrow" className="size-3.5" />
            </button>
          </div>

          {classes.length > 0 && (
            <div className="hidden lg:block">
              <div className="label mb-2">In this video</div>
              <ul className="space-y-0.5">
                {classes.map(([label, n]) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = events.filter((e) => e[2] === label).sort((a, b) => a[0] - b[0]).find((e) => e[0] > time + 0.05)
                          ?? events.find((e) => e[2] === label);
                        if (next) seek(next[0]);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-panel-2"
                      title="Jump to the next event of this class"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: classInfo(label).color }} />
                        <span className="truncate">{classInfo(label).name}</span>
                      </span>
                      <span className="font-mono text-xs text-ink-3 tnum">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4 text-sm text-ink-2 tnum">
            <span>{events.length} event{events.length === 1 ? "" : "s"} · {fmtTime(duration, 0)}</span>
            {downloadName && (
              <button type="button" onClick={() => downloadJson(downloadName, { events, risk })} className="inline-flex items-center gap-1.5 font-medium text-sign hover:underline">
                <Icon name="download" className="size-3.5" /> JSON
              </button>
            )}
          </div>
        </aside>
      </div>

      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">Event timeline</h3>
          <span className="text-xs text-ink-3">Click a bar to jump to it</span>
        </div>
        <ClassFilter events={events} hidden={hidden} onToggle={toggle} />
        <EventTimeline events={events} duration={duration} time={time} onSeek={seek} hidden={hidden} />
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">Accident risk</h3>
          <span className="text-xs text-ink-3">P(accident within 5 s) · dashed line θ = 0.5</span>
        </div>
        <RiskCurve risk={risk} events={events} duration={duration} time={time} onSeek={seek} />
      </section>

      <EventTable events={events} time={time} onSeek={seek} hidden={hidden} />
    </div>
  );
}

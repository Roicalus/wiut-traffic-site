import { useEffect, useRef, useState } from "react";
import { classInfo } from "../lib/classes";
import { asset, useJson } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { Event } from "../lib/types";
import EventTimeline from "./EventTimeline";

type Box = [number, string, number, number, number, number]; // [track id, class, x1, y1, x2, y2] (0–1)

interface Hero {
  video: string;
  start: number;
  end: number;
  media: string;
  poster: string;
  frames: [number, Box[]][]; // [t since clip start, boxes] at the tracker rate (10 Hz)
  event_objects: [number, number, string, number][]; // [start, end, label, track id], clip time
}

/** Last tracker frame at or before t. */
function frameAt(frames: Hero["frames"], t: number): Box[] {
  let lo = 0, hi = frames.length - 1;
  if (hi < 0 || t < frames[0][0]) return [];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid][0] <= t) lo = mid; else hi = mid - 1;
  }
  return frames[lo][1];
}

/**
 * Home-page product shot: 40 s of the original C3896 recording, with the tracks of our Part A pass
 * drawn over it in sync with the video. Objects that trigger an event are outlined in the class
 * colour and labelled; the event list and the timeline follow the same clock. All of it is real
 * output (data/hero.json from tools/export_site.py), not a mock-up.
 */
export default function HeroShot({ events, startAt = 0 }: { events: Event[]; startAt?: number }) {
  const hero = useJson<Hero>("hero.json");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      setT(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hero.data]);

  const h = hero.data;
  const abs = (h?.start ?? 0) + t;
  const boxes = h ? frameAt(h.frames, t) : [];
  const flagged = new Map<number, string>();
  h?.event_objects.forEach(([s, e, label, id]) => t >= s && t <= e && flagged.set(id, label));
  const active = events.filter((e) => abs >= e[0] && abs <= e[1]);

  return (
    <div className="card overflow-hidden !shadow-float">
      <div className="flex h-10 items-center justify-between border-b border-line px-4">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <span className="size-1.5 rounded-full bg-danger" />
          {h ? h.video.replace(/\.mp4$/i, "") : "C3896"} · junction camera
        </span>
        <span className="font-mono text-xs text-ink-3 tnum">{fmtTime(abs, 1)}</span>
      </div>

      <div className="relative bg-black">
        {h ? (
          <video
            ref={videoRef}
            src={asset(h.media)}
            poster={asset(h.poster)}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => startAt && (e.currentTarget.currentTime = startAt)}
            className="block aspect-video w-full"
            aria-label="Original recording C3896 with the tracks and events detected by our pipeline"
          />
        ) : (
          <div className="aspect-video" />
        )}
        <svg viewBox="0 0 1600 900" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          {boxes.map(([id, , x1, y1, x2, y2]) => {
            const label = flagged.get(id);
            const c = label ? classInfo(label).color : "#ffffff";
            return (
              <rect
                key={id}
                x={x1 * 1600}
                y={y1 * 900}
                width={(x2 - x1) * 1600}
                height={(y2 - y1) * 900}
                rx={3}
                fill={label ? c : "none"}
                fillOpacity={label ? 0.18 : 0}
                stroke={c}
                strokeOpacity={label ? 1 : 0.42}
                strokeWidth={label ? 2.25 : 1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {/* labels as HTML so the text stays crisp at any size */}
        {boxes.filter(([id]) => flagged.has(id)).map(([id, , x1, y1]) => {
          const label = flagged.get(id)!;
          return (
            <span
              key={id}
              className="pointer-events-none absolute -translate-y-full rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white shadow"
              style={{ left: `${x1 * 100}%`, top: `calc(${y1 * 100}% - 3px)`, background: classInfo(label).color }}
            >
              {classInfo(label).name}
            </span>
          );
        })}

        <div className="absolute bottom-3 left-3 hidden min-w-[11rem] rounded-lg border border-white/10 bg-[#0f1012]/80 px-3 py-2 text-white backdrop-blur-md sm:block">
          <div className="font-mono text-[10.5px] tracking-wide text-white/55">EVENTS NOW</div>
          <ul className="mt-1 space-y-0.5 text-[13px]">
            {active.length ? active.map((e, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full" style={{ background: classInfo(e[2]).color }} />
                {classInfo(e[2]).name}
              </li>
            )) : <li className="text-white/50">none</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-4 pt-4 pb-2">
        {h && <EventTimeline events={events} offset={h.start} duration={h.end - h.start} time={t} onSeek={(s) => videoRef.current && (videoRef.current.currentTime = s)} compact />}
      </div>
    </div>
  );
}

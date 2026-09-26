import { useEffect, useState } from "react";
import { classInfo } from "../lib/classes";
import { asset, useJson } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { Event } from "../lib/types";
import EventTimeline from "./EventTimeline";

interface Hero {
  image: string;
  model: string;
  detections: { cls: string; conf: number; box: [number, number, number, number] }[];
}

const BOX_COLOR: Record<string, string> = { car: "#7196ff", bus: "#4cc3b0", truck: "#4cc3b0", person: "#eeaa44", motorcycle: "#c38bff", bicycle: "#c38bff" };
const LOOP_SEC = 24;

/**
 * Product shot for the home page: the clean reference frame of the camera with the real YOLO11s
 * detections on it (data/hero.json from tools/export_site.py), and below it the event timeline of
 * that recording with a playhead that sweeps through it and names the events it crosses.
 */
export default function HeroShot({ video, events, duration }: { video: string; events: Event[]; duration: number }) {
  const hero = useJson<Hero>("hero.json");
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(duration * 0.23);
      return;
    }
    const t0 = performance.now();
    const id = setInterval(() => setT((((performance.now() - t0) / 1000) % LOOP_SEC) / LOOP_SEC * duration), 80);
    return () => clearInterval(id);
  }, [duration]);

  const active = events.filter((e) => t >= e[0] && t <= e[1]);
  const aspect = 9 / 16;

  return (
    <div className="card overflow-hidden !shadow-float">
      <div className="flex h-10 items-center justify-between border-b border-line px-4">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <span className="size-1.5 rounded-full bg-ok" /> {video.replace(/\.mp4$/i, "")} · junction camera
        </span>
        <span className="label hidden sm:inline">{hero.data ? `${hero.data.detections.length} objects · YOLO11s` : "YOLO11s"}</span>
      </div>
      <div className="relative bg-black">
        <img src={asset(hero.data?.image ?? "media/hero.jpg")} alt="The junction as the camera sees it, with detected vehicles and pedestrians outlined" className="block w-full" />
        {hero.data && (
          <svg viewBox={`0 0 1 ${aspect}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            {hero.data.detections.map((d, i) => {
              const [x1, y1, x2, y2] = d.box;
              const c = BOX_COLOR[d.cls] ?? "#ffffff";
              return (
                <rect
                  key={i}
                  x={x1}
                  y={y1 * aspect}
                  width={x2 - x1}
                  height={(y2 - y1) * aspect}
                  rx={0.002}
                  fill={c}
                  fillOpacity={0.1}
                  stroke={c}
                  strokeWidth={1.25}
                  vectorEffect="non-scaling-stroke"
                  style={{ animation: `fade-in .4s ease-out ${0.3 + i * 0.02}s both` }}
                />
              );
            })}
          </svg>
        )}
        <div className="absolute bottom-3 left-3 min-w-[12rem] rounded-lg border border-white/10 bg-[#0f1012]/80 px-3 py-2 text-white backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-white/60 tnum">
            <span>EVENTS NOW</span>
            <span>{fmtTime(t, 0)}</span>
          </div>
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
        <EventTimeline events={events} duration={duration} time={t} onSeek={() => {}} compact static />
      </div>
    </div>
  );
}

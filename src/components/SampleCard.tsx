import { Link } from "react-router-dom";
import { asset } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { SampleMeta, VideoPrediction } from "../lib/types";
import EventTimeline from "./EventTimeline";
import { Icon } from "./ui";

/** Poster + badges + read-only timeline; the whole card links to the video's result page. */
export default function SampleCard({ name, pred, meta }: { name: string; pred: VideoPrediction; meta?: SampleMeta }) {
  const duration = meta?.duration ?? Math.max(1, ...pred.events.map((e) => e[1]));
  return (
    <Link to={`/results/${encodeURIComponent(name)}`} className="card group block overflow-hidden transition-colors hover:border-line-2">
      <div className="relative aspect-[16/8] overflow-hidden bg-black">
        {meta?.poster && (
          <img src={asset(meta.poster)} alt="" loading="lazy" className="size-full object-cover object-top" />
        )}
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-white/85 text-[#141619]">
            <Icon name="play" className="ml-0.5 size-5" />
          </span>
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">{name.replace(/\.mp4$/i, "")}</h3>
          <span className="text-sm text-ink-3 tnum">
            {[meta?.lighting, fmtTime(duration, 0), `${pred.events.length} events`].filter(Boolean).join(" · ")}
          </span>
        </div>
        <EventTimeline events={pred.events} duration={duration} time={-1} onSeek={() => {}} compact static />
      </div>
    </Link>
  );
}

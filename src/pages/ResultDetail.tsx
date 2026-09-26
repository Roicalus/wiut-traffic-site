import { Link, useParams, useSearchParams } from "react-router-dom";
import ResultView, { type VideoSource } from "../components/ResultView";
import { ErrorBox, Icon, Loading, PlaceholderNotice, usePageTitle } from "../components/ui";
import { asset, useJson } from "../lib/data";
import type { Predictions, SamplesFile } from "../lib/types";

export default function ResultDetail() {
  const { video = "" } = useParams();
  const [params] = useSearchParams();
  const preds = useJson<Predictions>("predictions_samples.json");
  const samples = useJson<SamplesFile>("samples.json");
  usePageTitle(video.replace(/\.mp4$/i, ""));

  if (preds.loading || samples.loading) return <Loading />;
  if (preds.error) return <ErrorBox message={preds.error} />;
  const pred = preds.data!.videos[video];
  if (!pred) return <ErrorBox message={`No results for ${video}.`} />;

  const meta = samples.data?.videos[video];
  const sources: VideoSource[] = [];
  if (meta?.annotated_video) sources.push({ label: "Annotated", src: asset(meta.annotated_video)! });
  if (meta?.video) sources.push({ label: "Original", src: asset(meta.video)! });
  const names = Object.keys(preds.data!.videos);
  const startAt = Number(params.get("t")) || undefined;
  // "Camera vs. the reference view: … . Signal cycle … . Events: …" → one line per sentence.
  const notes = meta?.notes?.split(/(?<=\.)\s+(?=[A-Z])/) ?? [];

  return (
    <div>
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Sample videos">
        <Link to="/results" className="inline-flex items-center gap-1.5 font-medium text-ink-2 hover:text-ink">
          <Icon name="back" className="size-4" /> All sample videos
        </Link>
        <div className="scroll-x max-w-full"><div className="inline-flex gap-1 rounded-[10px] border border-line bg-panel-2 p-1">
          {names.map((n) => (
            <Link
              key={n}
              to={`/results/${encodeURIComponent(n)}`}
              aria-current={n === video ? "page" : undefined}
              className={`rounded-[7px] px-3 py-1 font-medium ${n === video ? "bg-panel text-ink shadow-card" : "text-ink-2 hover:text-ink"}`}
            >
              {n.replace(/\.mp4$/i, "")}
            </Link>
          ))}
        </div></div>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold sm:text-5xl">{video.replace(/\.mp4$/i, "")}</h1>
        </div>
        {meta && (
          <p className="text-sm text-ink-3 tnum">
            {[`${meta.width}×${meta.height}`, `${meta.fps} fps`, meta.lighting, `${pred.events.length} events`].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>
      <PlaceholderNotice show={samples.data?.placeholder} />

      <ResultView key={video} sources={sources} events={pred.events} risk={pred.risk} duration={meta?.duration ?? 0} poster={asset(meta?.poster)} startAt={startAt} />

      {notes.length > 0 && (
        <section className="card mt-5 p-5">
          <h3 className="mb-3 text-lg font-semibold">About this recording</h3>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {notes.map((n, k) => (
              <li key={k} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-ink-3" />{n}</li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}

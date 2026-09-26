import { Link } from "react-router-dom";
import SampleCard from "../components/SampleCard";
import { ErrorBox, Figure, Icon, Loading, Media, PageHeader, PlaceholderNotice, Section, Stat } from "../components/ui";
import { classInfo } from "../lib/classes";
import { asset, useJson } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { Predictions, SamplesFile } from "../lib/types";

export default function Results() {
  const preds = useJson<Predictions>("predictions_samples.json");
  const samples = useJson<SamplesFile>("samples.json");
  if (preds.loading || samples.loading) return <Loading />;
  if (preds.error) return <ErrorBox message={preds.error} />;

  const videos = Object.entries(preds.data!.videos);
  const meta = samples.data?.videos ?? {};
  const all = videos.flatMap(([, v]) => v.events);
  const classes = new Set(all.map((e) => e[2]));
  const totalMin = videos.reduce((s, [name]) => s + (meta[name]?.duration ?? 0), 0) / 60;

  return (
    <div>
      <PageHeader
       
        title="Every sample clip, annotated by our pipeline"
      >
        Our output from <code>predictions_samples.json</code>, the same file that is in the repository. The annotated videos are rendered with our
        own tooling (<code>tools/visualize_debug.py</code>): tracks, scene zones, the signal state, the active events and the risk curve are
        drawn on every frame. Open a clip to scrub it against the event timeline.
      </PageHeader>
      <PlaceholderNotice show={samples.data?.placeholder} />

      <dl className="mb-14 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
        <Stat label="Videos" value={videos.length} hint={`${totalMin.toFixed(1)} min of footage`} />
        <Stat label="Events" value={all.length} hint={`${classes.size} classes`} />
        <Stat label="Events per hour" value={totalMin ? ((all.length / totalMin) * 60).toFixed(0) : "–"} />
        <Stat label="Median length" value={`${median(all.map((e) => e[1] - e[0])).toFixed(1)} s`} hint="per event" />
      </dl>

      <Section title="Sample videos">
        <div className="grid gap-5 md:grid-cols-2">
          {videos.map(([name, v]) => <SampleCard key={name} name={name} pred={v} meta={meta[name]} />)}
        </div>
      </Section>

      {!!samples.data?.class_examples?.length && (
        <Section id="examples" title="One example of each class we detect" lede="Short clips cut from the annotated videos; the event box is drawn in the class colour. stop_line is submitted too but does not occur in the samples, so it has no example.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {samples.data.class_examples.map((ex, i) => (
              <article key={i} className="card overflow-hidden">
                <video src={asset(ex.media)} poster={asset(ex.poster)} controls muted playsInline preload="none" className="block w-full bg-black" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="size-2.5 rounded-full" style={{ background: classInfo(ex.label).color }} />
                      {classInfo(ex.label).name}
                    </span>
                    <code className="text-[11px]">{ex.label}</code>
                  </div>
                  <p className="text-sm text-ink-2">{ex.caption}</p>
                  <Link to={`/results/${encodeURIComponent(ex.video)}?t=${ex.start}`} className="link inline-flex items-center gap-1 text-sm font-medium">
                    {ex.video.replace(/\.mp4$/i, "")} at {fmtTime(ex.start, 0)} <Icon name="arrow" className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {!!samples.data?.failures?.length && (
        <Section id="failures" title="Where it goes wrong" lede="Cases we found by watching the annotated videos. None of them is fixed in the submitted version; the report says what we would try.">
          <div className="grid gap-5 md:grid-cols-2">
            {samples.data.failures.map((f, i) => (
              <article key={i} className="card overflow-hidden">
                {f.media && (/\.(mp4|webm)$/i.test(f.media) ? <Media src={f.media} /> : <Figure src={f.media} className="[&_button]:rounded-none [&_button]:border-0" />)}
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-danger/10 font-mono text-xs font-semibold text-danger">{i + 1}</span>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">{f.explanation}</p>
                  {f.video && (
                    <Link to={`/results/${encodeURIComponent(f.video)}${f.start != null ? `?t=${f.start}` : ""}`} className="link inline-flex items-center gap-1 text-sm font-medium">
                      Watch in context <Icon name="arrow" className="size-3.5" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

import { useState } from "react";
import { DataTable, TimeLineChart } from "../components/Charts";
import { ErrorBox, Figure, Loading, PageHeader, PlaceholderNotice, Section, Segmented } from "../components/ui";
import type { Eda } from "../lib/content";
import { useJson } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { SamplesFile } from "../lib/types";

const short = (v: string) => v.replace(/\.mp4$/i, "");

export default function EDA() {
  const eda = useJson<Eda>("eda.json");
  const samples = useJson<SamplesFile>("samples.json");
  const [countsVideo, setCountsVideo] = useState<string>();
  const [densityVideo, setDensityVideo] = useState<string>();
  const [heatVideo, setHeatVideo] = useState<string>();

  if (eda.loading || samples.loading) return <Loading />;
  if (eda.error) return <ErrorBox message={eda.error} />;
  const d = eda.data!;
  const meta = samples.data?.videos ?? {};

  const countVideos = Object.keys(d.counts_over_time ?? {});
  const cv = countsVideo ?? countVideos[0];
  const counts = cv ? d.counts_over_time[cv] : undefined;
  const densityVideos = Object.keys(d.density ?? {});
  const dv = densityVideo ?? densityVideos[0];
  const density = dv ? d.density![dv] : undefined;
  const heatVideos = (d.heatmaps ?? []).map((h) => h.video);
  const hv = heatVideo ?? heatVideos[0];
  const heat = d.heatmaps?.find((h) => h.video === hv);
  const traj = d.trajectories?.find((h) => h.video === hv);
  const picker = (videos: string[], value: string | undefined, set: (v: string) => void) =>
    videos.length > 1 && value ? <Segmented label="Video" value={value} onChange={set} options={videos.map((v) => ({ value: v, label: short(v) }))} /> : null;

  return (
    <div>
      <PageHeader title="What the camera sees">
        The four sample recordings before any event rule runs: the footage itself, what moves where and when, and the findings that changed the pipeline.
        Every number here comes from our detector and tracker pass over the full clips (<code>tools/export_site.py</code>).
      </PageHeader>
      <PlaceholderNotice show={d.placeholder} />

      {!!d.findings?.length && (
        <Section title="Findings that shaped the solution">
          <div className="grid gap-5 md:grid-cols-2">
            {d.findings.map((f, i) => (
              <article key={i} className="card flex flex-col p-5 sm:p-6">
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="mb-4 text-[15px] text-ink-2">{f.text}</p>
                <div className="mt-auto rounded-xl bg-panel-2 px-4 py-3 text-sm text-ink-2">
                  <span className="mb-0.5 block text-xs font-medium text-ink-3">What we did</span>
                  {f.shaped}
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(meta).length > 0 && (
        <Section title="The recordings">
          <DataTable
            columns={["Video", "Resolution", "FPS", "Duration", "Lighting"]}
            rows={Object.entries(meta).map(([name, m]) => [short(name), `${m.width}×${m.height}`, m.fps, fmtTime(m.duration, 0), m.lighting ?? null])}
          />
        </Section>
      )}

      {counts && (
        <Section title="Objects in view over time" aside={picker(countVideos, cv, setCountsVideo)} lede="Tap a series to hide it; hover or drag across the chart to read the values.">
          <div className="card p-4 sm:p-5">
            <TimeLineChart t={counts.t} unit={counts.unit} series={Object.entries(counts.series).map(([name, values]) => ({ name, values }))} />
          </div>
        </Section>
      )}

      {density && (
        <Section title="Traffic density over time" aside={picker(densityVideos, dv, setDensityVideo)}>
          <div className="card p-4 sm:p-5">
            <TimeLineChart t={density.t} unit={density.unit} series={[{ name: density.unit ?? "Density", values: density.values, color: "var(--mark)" }]} />
          </div>
        </Section>
      )}

      {(heat || traj) && (
        <Section title="Where things move" aside={picker(heatVideos, hv, setHeatVideo)} lede="Click an image to enlarge it.">
          <div className="grid gap-5 lg:grid-cols-2">
            {heat && <Figure src={heat.src} caption={heat.caption} />}
            {traj && <Figure src={traj.src} caption={traj.caption} />}
          </div>
        </Section>
      )}

      {!!d.extra?.length && (
        <Section title="Signal cycle and camera motion">
          <div className="grid gap-5 lg:grid-cols-2">
            {d.extra.map((h) => (
              <div key={h.src} className="card p-4 sm:p-5">
                <h3 className="mb-3 text-lg font-semibold">{h.title}</h3>
                <Figure src={h.src} caption={h.caption} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

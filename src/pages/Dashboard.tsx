import { useNavigate } from "react-router-dom";
import { BarList, DataTable, HeatTable } from "../components/Charts";
import EventTimeline from "../components/EventTimeline";
import { ErrorBox, Loading, PageHeader, Section, Segmented, Stat } from "../components/ui";
import { useState } from "react";
import { RISK_THRESHOLD } from "../lib/config";
import { classInfo, sortByClassOrder } from "../lib/classes";
import { useJson } from "../lib/data";
import { fmtTime } from "../lib/format";
import type { Event, Predictions, RiskPoint, SamplesFile } from "../lib/types";

/** Alarm runs as evaluate.py counts them: frames with score ≥ θ, runs closer than 2 s merged. */
function alarms(risk: RiskPoint[]): [number, number][] {
  const out: [number, number][] = [];
  for (const [t, s] of risk) {
    if (s < RISK_THRESHOLD) continue;
    const last = out[out.length - 1];
    if (last && t - last[1] < 2) last[1] = t;
    else out.push([t, t]);
  }
  return out;
}

const q = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
};

type Metric = "count" | "rate" | "share";

export default function Dashboard() {
  const preds = useJson<Predictions>("predictions_samples.json");
  const samples = useJson<SamplesFile>("samples.json");
  const nav = useNavigate();
  const [metric, setMetric] = useState<Metric>("rate");
  if (preds.loading || samples.loading) return <Loading />;
  if (preds.error) return <ErrorBox message={preds.error} />;

  const meta = samples.data?.videos ?? {};
  const videos = Object.entries(preds.data!.videos);
  const names = videos.map(([n]) => n);
  const dur = (n: string) => meta[n]?.duration ?? Math.max(1, ...preds.data!.videos[n].events.map((e) => e[1]));
  const all: (Event & { video?: string })[] = videos.flatMap(([n, v]) => v.events.map((e) => Object.assign([...e] as Event, { video: n })));
  const classes = sortByClassOrder([...new Set(all.map((e) => e[2]))]);
  const hours = names.reduce((s, n) => s + dur(n), 0) / 3600;
  const count = (v: string, c: string) => preds.data!.videos[v].events.filter((e) => e[2] === c).length;
  const seconds = (evs: Event[]) => evs.reduce((s, e) => s + e[1] - e[0], 0);
  const allAlarms = videos.flatMap(([, v]) => alarms(v.risk));
  const peak = Math.max(0, ...videos.flatMap(([, v]) => v.risk.map((r) => r[1])));

  const byClass = classes.map((c) => {
    const evs = all.filter((e) => e[2] === c);
    return { c, n: evs.length, rate: evs.length / hours, share: seconds(evs) / (hours * 3600), lens: evs.map((e) => e[1] - e[0]) };
  });
  const lighting = [...new Set(names.map((n) => meta[n]?.lighting ?? "unknown"))];

  return (
    <div>
      <PageHeader title="Dashboard">
        What a traffic-centre operator would see for this junction over the four sample recordings: how often each kind of event happens, when,
        in which light, and how often the accident-risk alarm fires. All numbers are computed in the browser from <code>predictions_samples.json</code>.
      </PageHeader>

      <dl className="mb-14 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Footage" value={`${(hours * 60).toFixed(1)} min`} hint={`${names.length} recordings`} />
        <Stat label="Events" value={all.length} hint={`${classes.length} classes`} />
        <Stat label="Events per hour" value={(all.length / hours).toFixed(0)} />
        <Stat label="Time with ≥ 1 event" value={`${Math.round(100 * coverage(videos.map(([n, v]) => [dur(n), v.events])))} %`} hint="of footage" />
        <Stat label="Risk alarms" value={allAlarms.length} hint="no accidents in the samples" />
        <Stat label="Peak risk" value={peak.toFixed(3)} hint="alarm line 0.5" />
      </dl>

      <Section title="All recordings on one screen" lede="Click a bar to open that recording at the event.">
        <div className="card divide-y divide-line">
          {videos.map(([n, v]) => (
            <div key={n} className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{n.replace(/\.mp4$/i, "")}</h3>
                <span className="text-xs text-ink-3">{meta[n]?.lighting} · {fmtTime(dur(n), 0)} · {v.events.length} events · {alarms(v.risk).length} alarms</span>
              </div>
              <EventTimeline events={v.events} duration={dur(n)} time={-1} compact onSeek={(t) => nav(`/results/${encodeURIComponent(n)}?t=${Math.max(0, t - 1).toFixed(1)}`)} />
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-x-10 lg:grid-cols-2">
        <Section
          title="By class"
         
          aside={
            <Segmented<Metric>
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[{ value: "rate", label: "Per hour" }, { value: "count", label: "Count" }, { value: "share", label: "Time share" }]}
            />
          }
        >
          <div className="card p-5">
            <BarList
              rows={byClass.map((r) => ({ label: classInfo(r.c).name, value: metric === "count" ? r.n : metric === "rate" ? r.rate : r.share, color: classInfo(r.c).color }))}
              format={(v) => (metric === "count" ? String(v) : metric === "rate" ? v.toFixed(0) : `${(v * 100).toFixed(0)}%`)}
            />
            <p className="mt-4 text-xs text-ink-3">
              {metric === "share" ? "Share of the footage during which an event of this class is active." : metric === "rate" ? "Events per hour of footage." : "Events over all four recordings."}
            </p>
          </div>
        </Section>

        <Section title="By light condition">
          <div className="card p-5">
            <BarList
              rows={lighting.map((l) => {
                const vs = names.filter((n) => (meta[n]?.lighting ?? "unknown") === l);
                const h = vs.reduce((s, n) => s + dur(n), 0) / 3600;
                return { label: l, value: vs.reduce((s, n) => s + preds.data!.videos[n].events.length, 0) / h, color: "var(--mark)" };
              })}
              format={(v) => v.toFixed(0)}
            />
            <p className="mt-4 text-xs text-ink-3">Events per hour. One recording per condition except day, so read this as a hint, not a trend.</p>
          </div>
        </Section>
      </div>

      <Section title="Class × recording">
        <HeatTable
          rows={classes}
          cols={names}
          value={(c, v) => count(v, c)}
          rowLabel={(c) => (
            <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: classInfo(c).color }} />{classInfo(c).name}</span>
          )}
          colLabel={(v) => v.replace(/\.mp4$/i, "")}
        />
      </Section>

      <Section title="How long events last" lede="Seconds per event segment. Short, well-bounded segments matter: the metric matches segments by temporal IoU up to 0.7.">
        <DataTable
          columns={["Class", "Events", "Shortest", "Median", "Longest", "Total"]}
          rows={byClass.map((r) => [classInfo(r.c).name, r.n, `${q(r.lens, 0).toFixed(1)} s`, `${q(r.lens, 0.5).toFixed(1)} s`, `${q(r.lens, 1).toFixed(1)} s`, fmtTime(r.lens.reduce((a, b) => a + b, 0), 0)])}
        />
      </Section>

      <Section
        title="Accident-risk alarms"
        lede={`No accidents happen in the samples, so any alarm here would be a false one. ${
          allAlarms.length ? `The curve crosses 0.5 ${allAlarms.length} times.` : `The submitted curve stays below 0.5 on every frame (peak ${peak.toFixed(3)}).`
        }`}
      >
        <DataTable
          columns={["Recording", "Alarms (≥ 0.5)", "First alarm", "Peak risk", "Frames ≥ 0.3", "Frames ≥ 0.5"]}
          rows={videos.map(([n, v]) => {
            const a = alarms(v.risk);
            const frac = (th: number) => `${((100 * v.risk.filter((r) => r[1] >= th).length) / Math.max(1, v.risk.length)).toFixed(2)} %`;
            return [n.replace(/\.mp4$/i, ""), a.length, a.length ? fmtTime(a[0][0]) : "–", Math.max(0, ...v.risk.map((r) => r[1])).toFixed(3), frac(0.3), frac(0.5)];
          })}
        />
      </Section>
    </div>
  );
}

/** Fraction of total footage covered by at least one event (union of segments per video). */
function coverage(items: [number, Event[]][]) {
  let covered = 0, total = 0;
  for (const [d, evs] of items) {
    total += d;
    const s = [...evs].sort((a, b) => a[0] - b[0]);
    let end = -1;
    for (const [a, b] of s) {
      if (b <= end) continue;
      covered += b - Math.max(a, end);
      end = b;
    }
  }
  return total ? covered / total : 0;
}

import { Link, useSearchParams } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary";
import HeroShot from "../components/HeroShot";
import SampleCard from "../components/SampleCard";
import { Icon, usePageTitle } from "../components/ui";
import type { Content } from "../lib/content";
import { useJson } from "../lib/data";
import type { Predictions, SamplesFile } from "../lib/types";

const STEPS = [
  { title: "Align the scene", text: "Zones drawn once are mapped to each recording by a SIFT homography, so a shifted camera still lines up." },
  { title: "Detect and track", text: "YOLO11s finds vehicles and people ten times a second; ByteTrack links them into tracks." },
  { title: "Apply the rules", text: "The lit lamp gives the signal phase; per-class rules on tracks and zones produce the events." },
  { title: "Score the risk", text: "A causal pass: closest approach and required braking for every pair of road users." },
];

const EXPLORE = [
  { to: "/results", icon: "film", title: "Results", text: "All four sample videos, annotated, with timelines and risk curves." },
  { to: "/dashboard", icon: "chart", title: "Dashboard", text: "Events per hour, per class and per light condition, as an operator sees them." },
  { to: "/eda", icon: "layers", title: "EDA", text: "Footage, object counts, heatmaps, trajectories and the findings behind the design." },
  { to: "/approach", icon: "box", title: "Approach", text: "The pipeline diagram, models, data, and the rule behind every class." },
  { to: "/report", icon: "file", title: "Report", text: "What worked, what did not, ablations with numbers, what comes next." },
  { to: "/team", icon: "globe", title: "Team", text: "Who we are and who did what." },
];

export default function Home() {
  usePageTitle();
  const [params] = useSearchParams();
  const content = useJson<Content>("content.json");
  const preds = useJson<Predictions>("predictions_samples.json");
  const samples = useJson<SamplesFile>("samples.json");

  const videos = preds.data ? Object.entries(preds.data.videos) : [];
  const meta = samples.data?.videos ?? {};
  const all = videos.flatMap(([, v]) => v.events);
  const minutes = videos.reduce((s, [n]) => s + (meta[n]?.duration ?? 0), 0) / 60;
  const [first, firstPred] = videos[0] ?? [];
  const repo = content.data?.links.find((l) => /github\.com/.test(l.url))?.url;

  return (
    <div>
      <section className="hero-glow">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pb-20">
          <div className="rise">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-[13px] text-ink-2 shadow-card">
              WIUT Hackathon 2026 <span className="text-line-2">|</span> Computer Vision track
            </p>
            <h1 className="text-[2.4rem] leading-[1.08] tracking-[-0.03em] sm:text-[3.3rem]">
              Traffic events from a single junction camera
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Our system watches a fixed 4K CCTV view, reports every event as a time segment with its class, and scores the risk of an accident
              from past frames only.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demo" className="btn btn-primary"><Icon name="upload" /> Try the live demo</Link>
              <Link to="/results" className="btn btn-ghost">View results</Link>
              {repo && (
                <a href={repo} target="_blank" rel="noreferrer" className="btn btn-ghost" aria-label="Source code on GitHub">
                  <Icon name="github" /> <span className="hidden sm:inline">Code</span>
                </a>
              )}
            </div>
          </div>
          <div className="rise [animation-delay:120ms]">
            {firstPred && <ErrorBoundary fallback={null}><HeroShot startAt={Number(params.get("t")) || 0} events={preds.data!.videos["C3896.MP4"]?.events ?? firstPred.events} /></ErrorBoundary>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="card grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {[
            [videos.length || 4, "Sample videos", "4K at 29.97 fps"],
            [minutes ? `${minutes.toFixed(1)} min` : "–", "Footage analysed", "day, sunset, dusk"],
            [all.length || "–", "Events detected", "6 classes submitted"],
            ["1.6–1.8×", "Runtime", "of video length, limit 3×"],
          ].map(([v, k, h]) => (
            <div key={k as string} className="flex flex-col-reverse gap-1 p-5 sm:p-6">
              <dt className="text-sm text-ink-2">{k} <span className="block text-xs text-ink-3">{h}</span></dt>
              <dd className="font-display text-[1.85rem] font-semibold tracking-tight tnum">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="py-24">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-[1.75rem]">How it works</h2>
            <p className="mt-2 text-ink-2">One pass over the video for the events, one causal frame-by-frame pass for the risk. Only the detector is learned; everything after it is explicit rules we could check against the footage.</p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-panel p-6">
                <span className="font-mono text-xs text-ink-3">0{i + 1}</span>
                <h3 className="mt-3 mb-2 text-[17px]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
          <Link to="/approach" className="link mt-5 inline-flex items-center gap-1.5 text-sm font-medium">See the full pipeline <Icon name="arrow" className="size-3.5" /></Link>
        </section>

        <section className="pb-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h2 className="text-[1.75rem]">The sample videos</h2>
              <p className="mt-2 text-ink-2">Every clip we were given, annotated by our own tooling. Open one to scrub the video against its event timeline and risk curve.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {videos.map(([name, v]) => <SampleCard key={name} name={name} pred={v} meta={meta[name]} />)}
          </div>
        </section>

        <section className="pb-28">
          <h2 className="mb-8 text-[1.75rem]">Explore the submission</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORE.map((e) => (
              <Link key={e.to} to={e.to} className="card group flex gap-4 p-5 transition-colors hover:border-line-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-ink-2"><Icon name={e.icon} className="size-[18px]" /></span>
                <span>
                  <span className="flex items-center gap-1.5 font-medium">{e.title} <Icon name="arrow" className="size-3.5 text-ink-3 transition-transform group-hover:translate-x-0.5" /></span>
                  <span className="mt-1 block text-sm text-ink-2">{e.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

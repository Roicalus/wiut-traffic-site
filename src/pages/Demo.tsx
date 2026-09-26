import { useEffect, useRef, useState } from "react";
import ResultView, { type VideoSource } from "../components/ResultView";
import { ErrorBox, Icon, PageHeader } from "../components/ui";
import { checkHealth, runJob, type Progress } from "../lib/api";
import { API_BASE, MAX_DURATION_SEC, MAX_UPLOAD_MB, MOCK_MODE } from "../lib/config";
import { asset, useJson } from "../lib/data";
import type { DemoResult, Predictions, SamplesFile } from "../lib/types";

type State =
  | { kind: "idle" }
  | { kind: "processing"; file: File; progress: Progress; started: number }
  | { kind: "done"; name: string; sources: VideoSource[]; result: DemoResult; poster?: string; elapsed?: number }
  | { kind: "error"; message: string };

function readDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? v.duration : 0);
    v.onerror = () => resolve(0); // browser can't decode it; the server will still check
    v.src = url;
  });
}

const PHASES: { key: Progress["phase"]; label: string; hint: string }[] = [
  { key: "uploading", label: "Upload", hint: "Sending the file to the model server" },
  { key: "queued", label: "Queue", hint: "Waiting for a free worker (and waking the server if it slept)" },
  { key: "running", label: "Model", hint: "Part A events, Part B risk, rendering" },
  { key: "fetching", label: "Results", hint: "Downloading the annotated video" },
];

function overall(p: Progress): number {
  if (p.phase === "uploading") return 0.15 * p.progress;
  if (p.phase === "queued") return 0.15;
  if (p.phase === "running") return 0.15 + 0.8 * p.progress;
  return 1;
}

export default function Demo() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preds = useJson<Predictions>("predictions_samples.json");
  const samples = useJson<SamplesFile>("samples.json");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (state.kind !== "processing") return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [state.kind]);

  // Ping on arrival so a sleeping host starts waking up before the visitor uploads.
  useEffect(() => {
    checkHealth().then((ok) => setHealth(ok ? "online" : "offline"));
    return () => {
      abortRef.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start(file: File) {
    if (!/\.mp4$/i.test(file.name) && file.type !== "video/mp4") {
      return setState({ kind: "error", message: `${file.name} is not an .mp4 file. Choose an .mp4 video.` });
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      return setState({ kind: "error", message: `This file is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_UPLOAD_MB} MB; trim the clip and try again.` });
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const duration = await readDuration(url);
    if (duration > MAX_DURATION_SEC + 0.5) {
      return setState({ kind: "error", message: `This clip is ${duration.toFixed(0)} s long. The limit is ${MAX_DURATION_SEC} s; trim it and try again.` });
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const started = Date.now();
    setState({ kind: "processing", file, progress: { phase: "uploading", progress: 0 }, started });
    try {
      const result = await runJob(file, duration, (progress) => setState({ kind: "processing", file, progress, started }), ctrl.signal);
      const sources: VideoSource[] = [];
      if (result.annotated_video_url) {
        // the Space returns absolute URLs; a REST backend may return paths relative to its base
        const src = MOCK_MODE || /^https?:/i.test(result.annotated_video_url) ? result.annotated_video_url : new URL(result.annotated_video_url, API_BASE + "/").href;
        sources.push({ label: "Annotated", src });
      }
      sources.push({ label: "Your upload", src: url });
      if (!result.video?.duration) result.video = { ...result.video, duration };
      setState({ kind: "done", name: file.name, sources, result, elapsed: (Date.now() - started) / 1000 });
      setHealth("online");
    } catch (e) {
      if ((e as Error).name === "AbortError") return setState({ kind: "idle" });
      setState({ kind: "error", message: (e as Error).message });
    }
  }

  function trySample(name?: string) {
    name = name ?? (preds.data ? Object.keys(preds.data.videos)[0] : undefined);
    if (!name || !preds.data) return;
    const meta = samples.data?.videos[name];
    const sources: VideoSource[] = [];
    if (meta?.annotated_video) sources.push({ label: "Annotated", src: asset(meta.annotated_video)! });
    if (meta?.video) sources.push({ label: "Original", src: asset(meta.video)! });
    const p = preds.data!.videos[name];
    setState({ kind: "done", name: `${name} (precomputed sample)`, sources, poster: asset(meta?.poster), result: { video: { duration: meta?.duration ?? 0 }, events: p.events, risk: p.risk } });
  }

  const busy = state.kind === "processing";
  const sampleNames = preds.data ? Object.keys(preds.data.videos) : [];
  const limits = [
    ["Format", ".mp4 (H.264 / H.265)"],
    ["Length", MAX_DURATION_SEC >= 60 ? `up to ${+(MAX_DURATION_SEC / 60).toFixed(1)} min` : `up to ${MAX_DURATION_SEC} s`],
    ["Size", `up to ${MAX_UPLOAD_MB >= 1000 ? `${+(MAX_UPLOAD_MB / 1000).toFixed(1)} GB` : `${MAX_UPLOAD_MB} MB`}`],
    ["Hardware", "shared GPU, CPU fallback"],
  ];
  const cur = state.kind === "processing" ? PHASES.findIndex((p) => p.key === state.progress.phase) : -1;

  return (
    <div>
      <PageHeader title="Run the model on your own clip">
        Upload a clip from the junction camera and get back every detected event, the accident-risk curve and an annotated video. The same code as
        our submission runs on a Hugging Face Space; a 20 s clip takes about 15–20 s, a long 4K clip a few minutes on the CPU. It works best on
        footage from this camera: the scene zones are aligned to each recording, but only for this junction.
      </PageHeader>

      <div className="mb-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {!busy && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) start(f);
              }}
              className={`relative flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragging ? "border-sign bg-sign/5" : "border-line-2 bg-panel hover:border-ink-3"
              }`}
            >
              <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-line bg-panel-2 text-ink-2">
                <Icon name="upload" className="size-6" />
              </span>
              <p className="mb-1 font-display text-xl font-semibold">Drop an .mp4 here</p>
              <p className="mb-6 text-sm text-ink-3">or pick a file from your device</p>
              <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-primary">
                Choose a video
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,.mp4"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) start(f);
                }}
              />
            </div>
          )}

          {state.kind === "processing" && (
            <div className="card p-5 sm:p-7" aria-live="polite">
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="label mb-1">Processing</p>
                  <p className="truncate font-display text-xl font-semibold">{state.file.name}</p>
                </div>
                <span className="font-mono text-sm text-ink-2 tnum">
                  {Math.round(overall(state.progress) * 100)}% · {fmtElapsed((now - state.started) / 1000)}
                </span>
              </div>
              <ol className="mb-6 grid grid-cols-4 gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall(state.progress) * 100)}>
                {PHASES.map((ph, k) => {
                  const st = k < cur ? "done" : k === cur ? "active" : "todo";
                  const width = st === "done" ? 100 : st === "active" ? Math.max(8, (ph.key === "queued" ? 0.5 : state.progress.progress) * 100) : 0;
                  return (
                    <li key={ph.key} className="space-y-2">
                      <div className={`h-1.5 overflow-hidden rounded-full ${st === "todo" ? "bg-panel-2" : "bg-sign/20"}`}>
                        <div className="h-full rounded-full bg-sign transition-[width] duration-300" style={{ width: `${width}%` }} />
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${st === "todo" ? "text-ink-3" : "text-ink"}`}>
                        {st === "done" ? <Icon name="check" className="size-3.5 text-ok" /> : st === "active" ? <span className="size-1.5 rounded-full bg-sign" /> : null}
                        {ph.label}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="rounded-xl bg-panel-2 px-4 py-3 text-sm text-ink-2">
                {state.progress.stage || PHASES[cur]?.hint}
              </p>
              <button type="button" onClick={() => abortRef.current?.abort()} className="btn btn-ghost btn-sm mt-5">
                <Icon name="x" className="size-3.5" /> Cancel
              </button>
            </div>
          )}

          {state.kind === "error" && (
            <div className="mt-4">
              <ErrorBox message={state.message} />
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Model server</h2>
              {MOCK_MODE ? (
                <span className="rounded-full bg-mark/20 px-2.5 py-0.5 text-xs font-medium">Mock mode</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                  <span className={`size-2 rounded-full ${health === "online" ? "bg-ok" : health === "offline" ? "bg-danger" : "bg-ink-3"}`} />
                  {health === "online" ? "Online" : health === "offline" ? "Waking up" : "Checking"}
                </span>
              )}
            </div>
            <dl className="space-y-2.5 text-sm">
              {limits.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {health === "offline" && <p className="mt-4 text-xs text-ink-3">A sleeping Space starts on the first request; the upload waits for it.</p>}
          </div>
          <div className="card p-5">
            <h2 className="mb-1 text-base font-semibold">No clip at hand?</h2>
            <p className="mb-4 text-sm text-ink-3">Open the precomputed result of a sample video.</p>
            <div className="grid grid-cols-2 gap-2">
              {sampleNames.map((n) => (
                <button key={n} type="button" disabled={busy} onClick={() => trySample(n)} className="btn btn-ghost btn-sm disabled:opacity-40">
                  {n.replace(/\.mp4$/i, "")}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {state.kind === "idle" && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["film", "Annotated playback", "Tracks, zones, the signal and the active events drawn on the video."],
            ["layers", "Event timeline", "Every event as [start, end, class]; click a bar to jump there."],
            ["chart", "Risk curve", "The Part B score per frame with the 0.5 alarm line, plus a JSON download."],
          ].map(([icon, t, d]) => (
            <div key={t} className="flex gap-3 rounded-2xl border border-line p-4">
              <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-ink-3" />
              <div>
                <h3 className="text-sm font-semibold">{t}</h3>
                <p className="text-sm text-ink-2">{d}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {state.kind === "done" && (
        <section className="rise">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-8">
            <div className="min-w-0">
              <p className="label mb-1">Result{state.elapsed ? ` · ${fmtElapsed(state.elapsed)}` : ""}</p>
              <h2 className="truncate text-2xl font-semibold sm:text-3xl">{state.name}</h2>
            </div>
            <span className="text-sm text-ink-2">
              {state.result.events.length} events · {state.result.risk.some((r) => r[1] >= 0.5) ? "risk alarm raised" : "no risk alarm"}
            </span>
          </div>
          <ResultView
            key={state.name}
            sources={state.sources}
            events={state.result.events}
            risk={state.result.risk}
            duration={state.result.video.duration}
            poster={state.poster}
            downloadName={`${state.name.replace(/\.mp4.*$/i, "")}_events.json`}
          />
        </section>
      )}
    </div>
  );
}

function fmtElapsed(s: number) {
  return s < 60 ? `${Math.floor(s)} s` : `${Math.floor(s / 60)} min ${String(Math.floor(s % 60)).padStart(2, "0")} s`;
}

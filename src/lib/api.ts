import { Client, handle_file } from "@gradio/client";
import { API_BASE, GRADIO_SPACE, JOB_TIMEOUT_MS, MOCK_MODE, POLL_INTERVAL_MS } from "./config";
import type { DemoResult, Event, JobStatus, RiskPoint } from "./types";

export interface Progress {
  phase: "uploading" | "queued" | "running" | "fetching";
  progress: number; // 0–1 within the phase
  stage?: string;
}

async function errorMessage(r: Response): Promise<string> {
  try {
    const body = await r.json();
    const msg = body.detail ?? body.error ?? body.message;
    if (msg) return typeof msg === "string" ? msg : JSON.stringify(msg);
  } catch {
    /* body is not JSON */
  }
  return `Server returned HTTP ${r.status}.`;
}

export async function checkHealth(timeoutMs = 10000): Promise<boolean> {
  if (MOCK_MODE) return true;
  if (!API_BASE) return connectSpace(timeoutMs * 3).then(() => true, () => false);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function upload(file: File, onProgress: (p: number) => void, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/jobs`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.job_id) return resolve(body.job_id);
      const msg = body?.detail ?? body?.error ?? body?.message;
      reject(new Error(msg ? String(msg) : `Upload failed (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("The demo server could not be reached. Check your connection or try a sample video."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort());
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new DOMException("Aborted", "AbortError"));
    });
  });

export async function runJob(
  file: File,
  duration: number,
  onProgress: (p: Progress) => void,
  signal: AbortSignal
): Promise<DemoResult> {
  if (MOCK_MODE) return runMockJob(duration || 60, onProgress, signal);
  if (!API_BASE) return runSpaceJob(file, onProgress, signal);

  onProgress({ phase: "uploading", progress: 0 });
  const jobId = await upload(file, (p) => onProgress({ phase: "uploading", progress: p }), signal);

  const started = Date.now();
  let failures = 0;
  while (true) {
    if (Date.now() - started > JOB_TIMEOUT_MS) throw new Error("Processing took longer than expected. Try a shorter clip.");
    await sleep(POLL_INTERVAL_MS, signal);
    let status: JobStatus;
    try {
      const r = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}`, { signal });
      if (!r.ok) throw new Error(await errorMessage(r));
      status = await r.json();
      failures = 0;
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      if (++failures >= 5) throw new Error("Lost contact with the demo server while processing.");
      continue; // transient network hiccup: keep polling
    }
    if (status.status === "error") throw new Error(status.error || "The model could not process this video.");
    if (status.status === "done") break;
    onProgress({ phase: status.status, progress: status.progress ?? 0, stage: status.stage });
  }

  onProgress({ phase: "fetching", progress: 1 });
  const r = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}/result`, { signal });
  if (!r.ok) throw new Error(await errorMessage(r));
  const result = (await r.json()) as DemoResult;
  if (!Array.isArray(result.events) || !Array.isArray(result.risk)) throw new Error("The server returned a result in an unexpected format.");
  return result;
}

/* ---------- Hugging Face Space (Gradio API): the demo in the repository, demo/app.py ---------- */

// @gradio/client sends every request with credentials: "include", but the Space answers CORS
// preflights without Access-Control-Allow-Credentials, so the browser blocks them from any other
// site. Visitors are anonymous anyway: requests to *.hf.space go without cookies.
if (typeof window !== "undefined") {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return nativeFetch(input, /\.hf\.space\//.test(url) ? { ...init, credentials: "omit" } : init);
  };
}

let spacePromise: Promise<Client> | null = null;

/** One connection per page; a sleeping Space wakes up while the visitor chooses a file. */
function connectSpace(timeoutMs = 60000): Promise<Client> {
  if (!spacePromise) {
    // status events are opt-in: without them only the final result arrives
    spacePromise = Client.connect(GRADIO_SPACE, { events: ["data", "status"] }).catch((e) => {
      spacePromise = null;
      throw e;
    });
  }
  return Promise.race([
    spacePromise,
    new Promise<Client>((_, rej) => setTimeout(() => rej(new Error("The demo server did not respond.")), timeoutMs)),
  ]);
}

interface SpaceFile {
  url?: string;
  path?: string;
}

/**
 * Upload straight to the Space's Gradio upload endpoint with XHR, which (unlike the Gradio client)
 * reports progress: a 2-minute 4K clip from this camera is ~2 GB and takes minutes to send.
 * Resolves to the server-side path of the file.
 */
function uploadWithProgress(url: string, file: File, onProgress: (loaded: number) => void, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`upload failed (HTTP ${xhr.status})`));
      try {
        const paths = JSON.parse(xhr.responseText);
        if (typeof paths?.[0] === "string") return resolve(paths[0]);
      } catch {
        /* fall through */
      }
      reject(new Error("unexpected upload response"));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    signal.addEventListener("abort", () => {
      xhr.abort();
      reject(new DOMException("Aborted", "AbortError"));
    });
    const form = new FormData();
    form.append("files", file, file.name);
    xhr.send(form);
  });
}

const mb = (bytes: number) => (bytes / 1048576).toFixed(0);

async function runSpaceJob(file: File, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<DemoResult> {
  onProgress({ phase: "uploading", progress: 0, stage: "Connecting to the model server" });
  let app: Client;
  try {
    app = await connectSpace();
  } catch {
    throw new Error("The demo server could not be reached. It may be starting up; try again in a minute.");
  }
  // Own upload with progress; if the endpoint differs, fall back to the client's upload.
  let videoInput: unknown = handle_file(file);
  const cfg = app.config as { root?: string; api_prefix?: string } | undefined;
  if (cfg?.root) {
    const url = `${cfg.root.replace(/\/$/, "")}${cfg.api_prefix ?? "/gradio_api"}/upload?upload_id=${Math.random().toString(36).slice(2)}`;
    try {
      const path = await uploadWithProgress(url, file, (loaded) => onProgress({
        phase: "uploading", progress: Math.min(1, loaded / file.size), stage: `Uploading ${mb(loaded)} of ${mb(file.size)} MB`,
      }), signal);
      videoInput = { path, orig_name: file.name, size: file.size, mime_type: file.type || "video/mp4", meta: { _type: "gradio.FileData" } };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      console.warn("[demo] direct upload failed, using the Gradio client upload:", e);
    }
  }
  onProgress({ phase: "uploading", progress: 1, stage: "Sending the job to the model server" });
  const job = app.submit("/run", { video: { video: videoInput, subtitles: null } });
  signal.addEventListener("abort", () => job.cancel());

  let output: unknown[] | null = null;
  const started = Date.now();
  for await (const msg of job) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (Date.now() - started > JOB_TIMEOUT_MS) throw new Error("Processing took longer than expected. Try a shorter clip.");
    if (msg.type === "status") {
      if (msg.stage === "error") {
        const m = typeof msg.message === "string" ? msg.message : "";
        throw new Error(m || "The model could not process this video.");
      }
      // gr.Progress updates arrive with stage "pending" too, so progress data comes first
      if (msg.progress_data?.length) {
        const p = msg.progress_data[0];
        onProgress({ phase: "running", progress: p.progress ?? 0, stage: p.desc ?? undefined });
      } else if (msg.stage === "pending") {
        onProgress({ phase: "queued", progress: 0, stage: msg.position ? `position ${msg.position + 1} in the queue` : undefined });
      }
    } else if (msg.type === "data") {
      output = msg.data as unknown[];
      break;
    }
  }
  if (!output) throw new Error("The model server returned no result.");

  onProgress({ phase: "fetching", progress: 1 });
  const [video, , , jsonFile] = output as [{ video?: SpaceFile } | null, unknown, unknown, SpaceFile | null];
  if (!jsonFile?.url) throw new Error("The server returned a result in an unexpected format.");
  const r = await fetch(jsonFile.url, { signal });
  if (!r.ok) throw new Error(await errorMessage(r));
  const res = await r.json();
  if (!Array.isArray(res.events) || !Array.isArray(res.risk)) throw new Error("The server returned a result in an unexpected format.");
  return {
    video: { duration: res.info?.duration, fps: res.info?.fps, width: res.info?.width, height: res.info?.height },
    events: res.events,
    risk: res.risk,
    annotated_video_url: video?.video?.url ?? null,
  };
}

/* ---------- Mock mode: used when VITE_API_BASE is empty, so the UI can be built before the backend exists. ---------- */

async function runMockJob(duration: number, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<DemoResult> {
  for (let i = 0; i <= 10; i++) {
    onProgress({ phase: "uploading", progress: i / 10 });
    await sleep(80, signal);
  }
  const stages = ["Detecting objects", "Tracking", "Applying event rules", "Scoring risk"];
  for (let i = 0; i <= 40; i++) {
    onProgress({ phase: "running", progress: i / 40, stage: stages[Math.min(3, Math.floor(i / 10))] });
    await sleep(100, signal);
  }
  return mockResult(duration);
}

function mockResult(duration: number): DemoResult {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const labels = ["jaywalking", "stopped_vehicle", "solid_line_crossing", "congestion", "near_miss", "accident"];
  const events: Event[] = [];
  const count = Math.max(1, Math.floor(duration / 20));
  for (let i = 0; i < count; i++) {
    const s = rand() * duration * 0.85;
    const e = Math.min(duration, s + 3 + rand() * 12);
    const label = labels[i % labels.length];
    if (!events.some((x) => x[2] === label && s < x[1] && e > x[0])) events.push([+s.toFixed(2), +e.toFixed(2), label]);
  }
  const accidents = events.filter((e) => e[2] === "accident").map((e) => e[0]);
  const risk: RiskPoint[] = [];
  for (let t = 0; t <= duration; t += 0.2) {
    let r = 0.03 + rand() * 0.05;
    for (const s of accidents) if (t < s && t > s - 6) r = Math.max(r, 0.2 + 0.75 * (1 - (s - t) / 6));
    risk.push([+t.toFixed(2), +Math.min(1, r).toFixed(3)]);
  }
  return { video: { duration }, events, risk, annotated_video_url: null };
}

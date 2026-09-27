const env = import.meta.env;

// Demo backend: either our Hugging Face Space (Gradio API, default) or a REST server with the
// /jobs contract from README. Mock mode only when neither is configured.
export const GRADIO_SPACE: string = env.VITE_GRADIO_SPACE ?? "Roicaluste/wiut-traffic-events";
export const API_BASE: string = (env.VITE_API_BASE ?? "").replace(/\/$/, "");
export const MOCK_MODE = API_BASE === "" && GRADIO_SPACE === "";
export const MAX_UPLOAD_MB = Number(env.VITE_MAX_UPLOAD_MB || 3000);
export const MAX_DURATION_SEC = Number(env.VITE_MAX_DURATION_SEC || 150);
export const POLL_INTERVAL_MS = 1500;
export const JOB_TIMEOUT_MS = 20 * 60 * 1000;
export const RISK_THRESHOLD = 0.5; // θ from the task's alarm definition

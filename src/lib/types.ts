// Shapes match run_submission.py / evaluate.py exactly.
export type Event = [number, number, string]; // [start_sec, end_sec, label]
export type RiskPoint = [number, number]; // [t_sec, score]

export interface VideoPrediction {
  events: Event[];
  risk: RiskPoint[];
}

export interface Predictions {
  team: string;
  videos: Record<string, VideoPrediction>;
}

export interface SampleMeta {
  duration: number;
  fps: number;
  width: number;
  height: number;
  lighting?: string;
  video?: string; // original clip (optional)
  annotated_video?: string; // rendered with the team's tooling
  poster?: string;
  notes?: string;
}

export interface SamplesFile {
  placeholder?: boolean;
  videos: Record<string, SampleMeta>;
  class_examples?: { label: string; video: string; start: number; end: number; media?: string; poster?: string; caption?: string }[];
  failures?: { title: string; video?: string; start?: number; end?: number; media?: string; explanation: string }[];
}

export interface DemoResult {
  video: { duration: number; fps?: number; width?: number; height?: number };
  events: Event[];
  risk: RiskPoint[];
  annotated_video_url?: string | null;
}

export interface JobStatus {
  status: "queued" | "running" | "done" | "error";
  progress?: number;
  stage?: string;
  error?: string | null;
}

// Shapes of the hand-written content files in public/data/.

export interface Content {
  placeholder?: boolean;
  team_name: string;
  tagline: string;
  approach: {
    summary: string;
    pipeline: { name: string; short?: string; detail: string; kind: "learned" | "rule" | "io" }[];
    models: { name: string; role: string; why?: string; license?: string }[];
    datasets: { name: string; use: string; license: string }[];
    learned: string[];
    rule_based: string[];
    class_rules?: { label: string; rule: string }[];
    runtime?: string;
    rules_why?: string;
  };
  report: {
    built: string;
    worked: string[];
    did_not_work: string[];
    next: string[];
  };
  dev_scores?: { note?: string; score_a?: number; score_b?: number; model?: number; per_class?: { label: string; f1_03: number; f1_05: number; f1_07: number }[] };
  ablations?: { title: string; note?: string; columns: string[]; rows: (string | number | null)[][] }[];
  links: { label: string; url: string; description?: string }[];
}

export interface Team {
  members: {
    name: string;
    role: string;
    photo?: string;
    contributions: string[];
    github?: string;
    linkedin?: string;
    portfolio?: string;
    projects?: { name: string; url?: string; description: string }[];
  }[];
}

export interface Eda {
  placeholder?: boolean;
  findings: { title: string; text: string; shaped: string }[];
  counts_over_time: Record<string, { t: number[]; unit?: string; series: Record<string, number[]> }>;
  density?: Record<string, { t: number[]; unit?: string; values: number[] }>;
  heatmaps?: { video: string; src: string; caption?: string }[];
  trajectories?: { video: string; src: string; caption?: string }[];
  extra?: { title: string; src: string; caption?: string }[];
}

export function fmtTime(sec: number, decimals = 1): string {
  if (!Number.isFinite(sec)) return "–";
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const width = decimals ? 3 + decimals : 2;
  return `${m}:${s.toFixed(decimals).padStart(width, "0")}`;
}

export function fmtDuration(sec: number): string {
  return sec < 60 ? `${sec.toFixed(1)} s` : fmtTime(sec, 0);
}

/** Reduce a dense risk curve (one point per frame) to at most `max` points, keeping peaks. */
export function downsampleMax(points: [number, number][], max = 1500): [number, number][] {
  if (points.length <= max) return points;
  const bucket = Math.ceil(points.length / max);
  const out: [number, number][] = [];
  for (let i = 0; i < points.length; i += bucket) {
    let best = points[i];
    for (let j = i + 1; j < Math.min(i + bucket, points.length); j++) if (points[j][1] > best[1]) best = points[j];
    out.push([points[i][0], best[1]]);
  }
  return out;
}

/** Score at time t (last point at or before t). */
export function scoreAt(points: [number, number][], t: number): number | undefined {
  if (!points.length || t < points[0][0]) return undefined;
  let lo = 0, hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (points[mid][0] <= t) lo = mid; else hi = mid - 1;
  }
  return points[lo][1];
}

export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

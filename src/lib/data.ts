import { useEffect, useState } from "react";

/** Resolve a path from the data files: absolute URLs pass through, relative ones are served from /public. */
export function asset(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}

const cache = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  let p = cache.get(file);
  if (!p) {
    p = fetch(asset(`data/${file}`)!).then((r) => {
      if (!r.ok) throw new Error(`data/${file} could not be loaded (HTTP ${r.status})`);
      return r.json();
    });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return p as Promise<T>;
}

export function useJson<T>(file: string) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    load<T>(file)
      .then((data) => alive && setState({ data, loading: false }))
      .catch((e) => alive && setState({ error: String(e?.message ?? e), loading: false }));
    return () => {
      alive = false;
    };
  }, [file]);
  return state;
}

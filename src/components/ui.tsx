import { useEffect, useState, type ReactNode } from "react";
import { asset } from "../lib/data";

/* ---------- icons (inline, stroke = currentColor) ---------- */

const PATHS: Record<string, ReactNode> = {
  play: <path d="M7 5v14l11-7z" fill="currentColor" stroke="none" />,
  upload: <><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  next: <><path d="M4 12h12" /><path d="m12 6 6 6-6 6" /><path d="M20 5v14" /></>,
  github: <path d="M9 19c-4 1.3-4-2-6-2.5m12 5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.6 2.3 5.6 2.6 5.6 2.6a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9c0 4.6 2.8 5.6 5.5 6a3 3 0 0 0-.8 2.2V21" />,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  file: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="m7 15 4-4 3 3 5-6" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  zoom: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M11 8v6M8 11h6" /></>,
  download: <><path d="M12 4v12" /><path d="m6 10 6 6 6-6" /><path d="M4 20h16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

export function Icon({ name, className = "size-4" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** Team mark: an "S" of two brackets around a prompt chevron. Drawn in currentColor. */
export function LogoMark({ className = "h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M30 43V34a12 12 0 0 1 12-12h28" strokeWidth={7} />
      <path d="M70 55v9a12 12 0 0 1-12 12H30" strokeWidth={7} />
      <path d="m45 42 10.5 7L45 56.5" strokeWidth={4.6} />
    </svg>
  );
}

/* ---------- page structure ---------- */

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · SoWeNeedAName` : "SoWeNeedAName · Traffic events from one road camera";
  }, [title]);
}

export function PageHeader({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  usePageTitle(title);
  return (
    <header className="rise mb-12 max-w-3xl sm:mb-16">
      <h1 className="text-[2rem] sm:text-[2.75rem]">{title}</h1>
      {children && <div className="mt-4 text-[16.5px] leading-relaxed text-ink-2">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Section({ title, children, aside, id, lede }: { title: string; children: ReactNode; aside?: ReactNode; id?: string; lede?: ReactNode }) {
  return (
    <section className="mb-16 scroll-mt-24 sm:mb-20" id={id}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[1.35rem] sm:text-[1.55rem]">{title}</h2>
          {lede && <p className="prose-block mt-1.5 text-ink-2">{lede}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "danger" | "ok" }) {
  return (
    <div className="min-w-0">
      <dt className="label">{label}</dt>
      <dd className={`mt-1 font-display text-[1.6rem] leading-tight font-semibold tracking-tight tnum ${tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : ""}`}>{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-ink-3">{hint}</dd>}
    </div>
  );
}

export function Badge({ children, color, className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-xs font-medium text-ink-2 ${className}`}>
      {color && <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/** Segmented control, e.g. to pick a video. Scrolls sideways on a phone instead of wrapping. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="scroll-x max-w-full">
      <div role="tablist" aria-label={label} className="inline-flex gap-1 rounded-[10px] border border-line bg-panel-2 p-1 text-sm">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={o.value === value}
            onClick={() => onChange(o.value)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 font-medium transition-colors ${o.value === value ? "bg-panel text-ink shadow-card" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-4 py-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-panel-2" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-panel-2" />
      <div className="mt-8 aspect-[16/7] animate-pulse rounded-2xl bg-panel-2" />
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-ink">
      <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-danger" />
      <span>{message}</span>
    </div>
  );
}

/* ---------- media ---------- */

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={alt || "Image"} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-3 backdrop-blur-sm sm:p-8">
      <img src={src} alt={alt} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
      <button type="button" onClick={onClose} className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
        <Icon name="x" className="size-5" />
      </button>
    </div>
  );
}

/** Image with click-to-zoom and a visible fallback so a missing file never shows a broken icon. */
export function Figure({ src, caption, alt, className = "" }: { src?: string; caption?: ReactNode; alt?: string; className?: string }) {
  const [zoom, setZoom] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = asset(src);
  const text = alt ?? (typeof caption === "string" ? caption : "");
  return (
    <figure className={`space-y-2.5 ${className}`}>
      {url && !broken ? (
        <button type="button" onClick={() => setZoom(true)} className="group relative block w-full overflow-hidden rounded-xl border border-line bg-panel-2" aria-label={`Enlarge: ${text}`}>
          <img src={url} alt={text} loading="lazy" onError={() => setBroken(true)} className="w-full transition-transform duration-300 group-hover:scale-[1.015]" />
          <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-lg bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Icon name="zoom" />
          </span>
        </button>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-line bg-panel-2 p-4 text-center text-sm text-ink-3">
          {src ? `Image not found: ${src}` : "No image"}
        </div>
      )}
      {caption && <figcaption className="text-sm leading-relaxed text-ink-2">{caption}</figcaption>}
      {zoom && url && <Lightbox src={url} alt={text} onClose={() => setZoom(false)} />}
    </figure>
  );
}

export function Media({ src, caption, poster }: { src?: string; caption?: ReactNode; poster?: string }) {
  if (src && /\.(mp4|webm)$/i.test(src)) {
    return (
      <figure className="space-y-2.5">
        <video src={asset(src)} poster={asset(poster)} controls muted playsInline preload="none" className="aspect-video w-full rounded-xl bg-black" />
        {caption && <figcaption className="text-sm leading-relaxed text-ink-2">{caption}</figcaption>}
      </figure>
    );
  }
  return <Figure src={src} caption={caption} />;
}

export function PlaceholderNotice({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-6 rounded-xl border border-mark/40 bg-mark/10 px-4 py-3 text-sm text-ink-2">
      Placeholder data. Replace the files in <code>public/data/</code> with the team's real output before publishing.
    </div>
  );
}

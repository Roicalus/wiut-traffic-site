import { classInfo, sortByClassOrder } from "../lib/classes";
import type { Event } from "../lib/types";

interface Props {
  events: Event[];
  hidden: Set<string>;
  onToggle: (label: string) => void;
}

/** Legend that doubles as a filter: tap a class to hide or show it everywhere in the view. */
export default function ClassFilter({ events, hidden, onToggle }: Props) {
  const counts = new Map<string, number>();
  events.forEach((e) => counts.set(e[2], (counts.get(e[2]) ?? 0) + 1));
  const labels = sortByClassOrder([...counts.keys()]);
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Show or hide event classes">
      {labels.map((l) => {
        const info = classInfo(l);
        const off = hidden.has(l);
        return (
          <button
            key={l}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(l)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium transition-colors ${
              off ? "border-dashed border-line-2 text-ink-3" : "border-line bg-panel-2 text-ink hover:border-line-2"
            }`}
          >
            <span className="size-2 rounded-full" style={{ background: off ? "var(--line-2)" : info.color }} />
            <span className={off ? "line-through" : ""}>{info.name}</span>
            <span className="font-mono text-[11px] text-ink-3 tnum">{counts.get(l)}</span>
          </button>
        );
      })}
    </div>
  );
}

import { classInfo } from "../lib/classes";
import { fmtTime } from "../lib/format";
import type { Event } from "../lib/types";

interface Props {
  events: Event[];
  time: number;
  onSeek: (t: number) => void;
  hidden?: Set<string>;
}

export default function EventTable({ events, time, onSeek, hidden }: Props) {
  const rows = events.filter((e) => !hidden?.has(e[2])).sort((a, b) => a[0] - b[0]);
  if (!rows.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3 sm:px-5">
        <h3 className="text-lg font-semibold">All events</h3>
        <span className="text-xs text-ink-3">{rows.length}</span>
      </div>
      <div className="scroll-x max-h-[26rem] overflow-y-auto">
        <table className="w-full min-w-[26rem] text-sm tnum">
          <thead className="sticky top-0 bg-panel-2 text-left text-xs text-ink-3">
            <tr>
              <th className="px-4 py-2 font-medium sm:px-5">#</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Start</th>
              <th className="px-3 py-2 font-medium">End</th>
              <th className="px-3 py-2 text-right font-medium sm:pr-5">Length</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const info = classInfo(e[2]);
              const active = time >= e[0] && time <= e[1];
              return (
                <tr key={i} onClick={() => onSeek(e[0])} className={`cursor-pointer border-t border-line transition-colors ${active ? "bg-mark/15" : "hover:bg-panel-2"}`}>
                  <td className="px-4 py-2 font-mono text-xs text-ink-3 sm:px-5">{i + 1}</td>
                  <td className="px-3 py-2">
                    <button type="button" className="flex items-center gap-2 text-left font-medium" onClick={(ev) => { ev.stopPropagation(); onSeek(e[0]); }}>
                      <span className="size-2 shrink-0 rounded-full" style={{ background: info.color }} />
                      {info.name}
                      <code className="hidden !border-0 !bg-transparent text-[11px] font-normal text-ink-3 md:inline">{e[2]}</code>
                    </button>
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px]">{fmtTime(e[0])}</td>
                  <td className="px-3 py-2 font-mono text-[13px]">{fmtTime(e[1])}</td>
                  <td className="px-3 py-2 text-right font-mono text-[13px] text-ink-2 sm:pr-5">{(e[1] - e[0]).toFixed(1)} s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

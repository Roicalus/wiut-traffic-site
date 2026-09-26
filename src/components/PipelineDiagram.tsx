import { useState } from "react";
import type { Content } from "../lib/content";

type Step = Content["approach"]["pipeline"][number];

export const KIND = {
  learned: { label: "Learned", dot: "bg-sign" },
  rule: { label: "Rule-based", dot: "bg-mark" },
  io: { label: "Input / output", dot: "bg-ink-3" },
} as const;

function Arrow({ vertical }: { vertical?: boolean }) {
  return vertical ? (
    <svg viewBox="0 0 12 24" className="mx-auto h-6 w-3 text-line-2" aria-hidden>
      <path d="M6 0v20M2 16l4 5 4-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 12" className="h-3 w-full text-line-2" preserveAspectRatio="none" aria-hidden>
      <path d="M0 6h20M16 2l5 4-5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Node({ step, index, active, onSelect, className = "" }: { step: Step; index: number; active: boolean; onSelect: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group flex h-full w-full flex-col rounded-[10px] border bg-panel p-3 text-left transition-colors ${
        active ? "border-ink-3 shadow-float" : "border-line hover:border-line-2"
      } ${className}`}
    >
      <span className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">
        <span className={`size-1.5 rounded-full ${KIND[step.kind].dot}`} />
        {KIND[step.kind].label}
      </span>
      <span className="text-[14px] leading-snug font-medium">{step.name}</span>
      {step.short && <span className="mt-0.5 text-[12.5px] text-ink-3">{step.short}</span>}
      <span className="sr-only">Step {index + 1}</span>
    </button>
  );
}

/**
 * Pipeline as a flow diagram. Desktop: the Part A line left to right, Part B as a branch from the
 * video that joins the output. Phone: the same nodes top to bottom. Selecting a node shows its detail.
 */
export default function PipelineDiagram({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState(0);
  const bIdx = steps.findIndex((s) => /part b/i.test(s.name));
  const outIdx = steps.length - 1;
  const main = steps.map((s, i) => ({ s, i })).filter(({ i }) => i !== bIdx && i !== outIdx);
  const current = steps[sel];

  return (
    <div className="card overflow-hidden">
      {/* desktop */}
      <div className="hidden p-6 lg:block">
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: `repeat(${main.length}, minmax(0,1fr) 1.75rem) minmax(0,1fr)`, gridTemplateRows: "auto 2.25rem auto" }}
        >
          {main.map(({ s, i }, k) => (
            <div key={s.name} className="contents">
              <div style={{ gridColumn: 2 * k + 1, gridRow: 1 }}>
                <Node step={s} index={i} active={sel === i} onSelect={() => setSel(i)} />
              </div>
              <div style={{ gridColumn: 2 * k + 2, gridRow: 1 }} className="flex items-center px-1"><Arrow /></div>
            </div>
          ))}
          {/* output spans both rows */}
          <div style={{ gridColumn: 2 * main.length + 1, gridRow: "1 / 4" }} className="flex">
            <Node step={steps[outIdx]} index={outIdx} active={sel === outIdx} onSelect={() => setSel(outIdx)} className="justify-center" />
          </div>
          {bIdx >= 0 && (
            <>
              {/* elbow from the video node down into the Part B lane */}
              <div style={{ gridColumn: 1, gridRow: "2 / 4" }} className="relative" aria-hidden>
                <span className="absolute top-0 left-1/2 h-[calc(50%+1.1rem)] border-l-[1.5px] border-line-2" />
                <span className="absolute top-[calc(50%+1.1rem)] right-0 left-1/2 border-t-[1.5px] border-line-2" />
              </div>
              <div style={{ gridColumn: 2, gridRow: 3 }} className="flex items-center px-1"><Arrow /></div>
              <div style={{ gridColumn: `3 / ${2 * main.length}`, gridRow: 3 }}>
                <Node step={steps[bIdx]} index={bIdx} active={sel === bIdx} onSelect={() => setSel(bIdx)} />
              </div>
              <div style={{ gridColumn: 2 * main.length, gridRow: 3 }} className="flex items-center px-1"><Arrow /></div>
              <span style={{ gridColumn: `3 / ${2 * main.length}`, gridRow: 2 }} className="self-center text-center font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">
                Part A above · Part B below, a separate causal pass
              </span>
            </>
          )}
        </div>
      </div>

      {/* phone / tablet */}
      <ol className="p-4 lg:hidden">
        {[...main.map(({ i }) => i), outIdx].map((i, k, arr) => (
          <li key={i}>
            <Node step={steps[i]} index={i} active={sel === i} onSelect={() => setSel(i)} />
            {k < arr.length - 1 && <Arrow vertical />}
          </li>
        ))}
        {bIdx >= 0 && (
          <li className="mt-4 border-t border-dashed border-line-2 pt-4">
            <p className="mb-2 font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">In parallel, from the video</p>
            <Node step={steps[bIdx]} index={bIdx} active={sel === bIdx} onSelect={() => setSel(bIdx)} />
          </li>
        )}
      </ol>

      {current && (
        <div className="border-t border-line bg-panel-2 px-5 py-4 sm:px-6" aria-live="polite">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[15px]">{current.name}</h3>
            <span className="flex items-center gap-1.5 text-xs text-ink-3"><span className={`size-1.5 rounded-full ${KIND[current.kind].dot}`} />{KIND[current.kind].label}</span>
          </div>
          <p className="max-w-4xl text-sm leading-relaxed text-ink-2">{current.detail}</p>
        </div>
      )}
    </div>
  );
}

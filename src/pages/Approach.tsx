import PipelineDiagram, { KIND } from "../components/PipelineDiagram";
import { ErrorBox, Loading, PageHeader, PlaceholderNotice, Section } from "../components/ui";
import { classInfo } from "../lib/classes";
import type { Content } from "../lib/content";
import { useJson } from "../lib/data";

export default function Approach() {
  const c = useJson<Content>("content.json");
  if (c.loading) return <Loading />;
  if (c.error) return <ErrorBox message={c.error} />;
  const a = c.data!.approach;

  return (
    <div>
      <PageHeader title="Problem and approach">{a.summary}</PageHeader>
      <PlaceholderNotice show={c.data!.placeholder} />

      <Section
        title="Pipeline"
        lede="Select a stage to read what it does."
        aside={
          <div className="flex flex-wrap gap-4 text-xs text-ink-2">
            {Object.values(KIND).map((k) => (
              <span key={k.label} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${k.dot}`} />{k.label}</span>
            ))}
          </div>
        }
      >
        <PipelineDiagram steps={a.pipeline} />
      </Section>

      <Section title="What is learned and what is rule-based">
        <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          <div className="bg-panel p-6">
            <h3 className="mb-3 flex items-center gap-2 text-[17px]"><span className="size-2 rounded-full bg-sign" /> Learned</h3>
            <ul className="space-y-2 text-[15px] text-ink-2">{a.learned.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <p className="mt-4 text-sm text-ink-3">Only the detector has weights. Nothing is trained on the sample videos.</p>
          </div>
          <div className="bg-panel p-6">
            <h3 className="mb-3 flex items-center gap-2 text-[17px]"><span className="size-2 rounded-full bg-mark" /> Rule-based</h3>
            <ul className="space-y-2 text-[15px] text-ink-2">{a.rule_based.map((x, i) => <li key={i}>{x}</li>)}</ul>
            {a.rules_why && <p className="mt-4 text-sm text-ink-3">{a.rules_why}</p>}
          </div>
        </div>
      </Section>

      {!!a.class_rules?.length && (
        <Section title="How each submitted class is detected" lede="Distances and zones are in pixels of the reference 4K frame, after each recording is mapped onto it.">
          <div className="card divide-y divide-line">
            {a.class_rules.map((r) => (
              <div key={r.label} className="grid gap-2 p-5 md:grid-cols-[14rem_1fr] md:gap-6">
                <div>
                  <h3 className="flex items-center gap-2 text-[15px]">
                    <span className="size-2 rounded-full" style={{ background: classInfo(r.label).color }} />
                    {classInfo(r.label).name}
                  </h3>
                  <code className="mt-1 inline-block text-[11.5px]">{r.label}</code>
                </div>
                <p className="text-[15px] leading-relaxed text-ink-2">{r.rule}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Models and why we chose them">
        <div className="grid gap-4 md:grid-cols-2">
          {a.models.map((m) => (
            <article key={m.name} className="card p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-[15px]">{m.name}</h3>
                {m.license && <span className="rounded-md border border-line px-1.5 py-0.5 text-right font-mono text-[11px] text-ink-3">{m.license}</span>}
              </div>
              <p className="text-sm text-ink-2">{m.role}</p>
              {m.why && <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-2"><span className="font-medium text-ink">Why: </span>{m.why}</p>}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Data">
        <div className="card divide-y divide-line">
          {a.datasets.map((d) => (
            <div key={d.name} className="grid gap-1 p-5 md:grid-cols-[14rem_1fr_auto] md:gap-6">
              <h3 className="text-[15px]">{d.name}</h3>
              <p className="text-sm text-ink-2">{d.use}</p>
              <span className="font-mono text-[11.5px] text-ink-3">{d.license}</span>
            </div>
          ))}
        </div>
      </Section>

      {a.runtime && (
        <Section title="Runtime">
          <p className="prose-block text-[15px] leading-relaxed text-ink-2">{a.runtime}</p>
        </Section>
      )}
    </div>
  );
}

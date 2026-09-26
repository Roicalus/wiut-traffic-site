import { DataTable } from "../components/Charts";
import { ErrorBox, Icon, Loading, PageHeader, PlaceholderNotice, Section } from "../components/ui";
import { classInfo } from "../lib/classes";
import type { Content } from "../lib/content";
import { useJson } from "../lib/data";

const f = (v?: number) => (v == null ? null : v.toFixed(3));

const COLS = [
  { key: "worked", title: "What worked", icon: "check", tone: "text-ok bg-ok/10" },
  { key: "did_not_work", title: "What did not work", icon: "x", tone: "text-danger bg-danger/10" },
  { key: "next", title: "What we would do next", icon: "next", tone: "text-sign bg-sign/10" },
] as const;

export default function Report() {
  const c = useJson<Content>("content.json");
  if (c.loading) return <Loading />;
  if (c.error) return <ErrorBox message={c.error} />;
  const { report: r, dev_scores: s, ablations } = c.data!;

  return (
    <div>
      <PageHeader title="What we built, what worked, what did not">{r.built}</PageHeader>
      <PlaceholderNotice show={c.data!.placeholder} />

      <div className="mb-16 grid gap-5 lg:grid-cols-3 sm:mb-20">
        {COLS.map((col) => (
          <section key={col.key} className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold">
              <span className={`grid size-7 place-items-center rounded-lg ${col.tone}`}><Icon name={col.icon} className="size-4" /></span>
              {col.title}
            </h2>
            <ul className="list-disc space-y-3 pl-4 marker:text-ink-3">
              {r[col.key].map((x, i) => (
                <li key={i} className="text-[15px] leading-relaxed text-ink-2">
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {s && (
        <Section title="Scores on our own dev labels">
          {s.note && <p className="prose-block mb-4 text-ink-2">{s.note}</p>}
          <dl className="mb-6 flex flex-wrap gap-10">
            {[["Score A", s.score_a], ["Score B", s.score_b], ["Model score", s.model]].map(([k, v]) =>
              v != null ? (
                <div key={k as string}>
                  <dt className="text-sm text-ink-3">{k as string}</dt>
                  <dd className="font-display text-4xl font-semibold tnum">{(v as number).toFixed(3)}</dd>
                </div>
              ) : null
            )}
          </dl>
          {!!s.per_class?.length && (
            <DataTable columns={["Class", "F1 @ IoU 0.3", "F1 @ 0.5", "F1 @ 0.7"]} rows={s.per_class.map((p) => [classInfo(p.label).name, f(p.f1_03), f(p.f1_05), f(p.f1_07)])} />
          )}
        </Section>
      )}

      {!!ablations?.length && (
        <Section title="Ablations" lede="Each table compares variants we actually ran; the highlighted row is the configuration in the submitted code.">
          <div className="space-y-8">
            {ablations.map((ab) => (
              <article key={ab.title}>
                <h3 className="mb-1 flex items-baseline gap-3 text-lg font-semibold">
                  {ab.title}
                </h3>
                {ab.note && <p className="prose-block mb-3 text-sm text-ink-2">{ab.note}</p>}
                <DataTable columns={ab.columns} rows={ab.rows} />
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

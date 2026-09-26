import { ErrorBox, Icon, Loading, PageHeader } from "../components/ui";
import type { Content } from "../lib/content";
import { asset, useJson } from "../lib/data";

const iconFor = (label: string, url: string) =>
  /github\.com/.test(url) && /weights/i.test(label) ? "box" : /\.json/i.test(label) ? "file" : /github\.com/.test(url) ? "github" : /huggingface/.test(url) ? "play" : "external";

export default function Links() {
  const c = useJson<Content>("content.json");
  if (c.loading) return <Loading />;
  if (c.error) return <ErrorBox message={c.error} />;
  const links = [
    ...c.data!.links,
    { label: "predictions_samples.json (copy on this site)", url: asset("data/predictions_samples.json")!, description: "Our output on the sample videos, in the harness format." },
  ];
  return (
    <div>
      <PageHeader title="Code, weights and outputs">
        Everything needed to rerun the submission: <code>pip install -r requirements.txt</code>, then{" "}
        <code>python run_submission.py --videos /data/test --out predictions.json</code>.
      </PageHeader>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.label} className="min-w-0">
            <a href={l.url} target="_blank" rel="noreferrer" className="card group flex h-full gap-4 p-5 transition-shadow transition-colors hover:border-line-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-panel-2 text-ink">
                <Icon name={iconFor(l.label, l.url)} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 font-display text-lg font-semibold [overflow-wrap:anywhere]">
                  {l.label}
                  <Icon name="external" className="size-4 shrink-0 text-ink-3 transition-colors group-hover:text-ink" />
                </span>
                {l.description && <span className="mt-1 block text-sm text-ink-2">{l.description}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

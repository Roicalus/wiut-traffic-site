import { ErrorBox, Icon, Loading, PageHeader } from "../components/ui";
import type { Team as TeamT } from "../lib/content";
import { asset, useJson } from "../lib/data";

const pending = (x?: string) => !x || /^to be added$/i.test(x.trim());

export default function Team() {
  const t = useJson<TeamT>("team.json");
  const c = useJson<{ team_name?: string }>("content.json");
  if (t.loading) return <Loading />;
  if (t.error) return <ErrorBox message={t.error} />;

  return (
    <div>
      <PageHeader title={c.data?.team_name ?? "Team"}>
        Three people, one submission for the WIUT Hackathon 2026 Computer Vision track.
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-3">
        {t.data!.members.map((m) => {
          const contributions = m.contributions.filter((x) => !pending(x));
          const links = ([["GitHub", m.github, "github"], ["LinkedIn", m.linkedin, "linkedin"], ["Portfolio", m.portfolio, "globe"]] as const).filter(([, u]) => u);
          return (
            <article key={m.name} className="card flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                {m.photo ? (
                  <img src={asset(m.photo)} alt={`Photo of ${m.name}`} loading="lazy" className="mb-4 size-20 rounded-2xl border border-line object-cover" />
                ) : (
                  <div aria-hidden className="mb-4 grid size-16 place-items-center rounded-full bg-panel-2 font-display text-xl font-semibold text-ink-2">
                    {m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                )}
                <h2 className="text-xl font-semibold">{m.name}</h2>
                <p className="mb-5 text-sm font-medium text-ink-3">{pending(m.role) ? "Role to be added" : m.role}</p>

                <h3 className="label mb-2">Contributions</h3>
                {contributions.length ? (
                  <ul className="mb-5 space-y-1.5 text-[15px] text-ink-2">
                    {contributions.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-3" />{x}</li>)}
                  </ul>
                ) : (
                  <p className="mb-5 text-sm text-ink-3">To be added.</p>
                )}

                {!!m.projects?.length && (
                  <>
                    <h3 className="label mb-2">Projects we're proud of</h3>
                    <ul className="mb-5 space-y-2.5">
                      {m.projects.map((p) => (
                        <li key={p.name} className="text-sm">
                          {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="link font-semibold">{p.name}</a> : <span className="font-semibold">{p.name}</span>}
                          <p className="text-ink-2">{p.description}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                  {links.length ? links.map(([label, url, icon]) => (
                    <a key={label} href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      <Icon name={icon} className="size-4" /> {label}
                    </a>
                  )) : <span className="text-sm text-ink-3">Links to be added.</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

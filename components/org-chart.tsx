import Link from "next/link";
import { PersonAvatar } from "@/components/person-avatar";
import { readableLabel } from "@/lib/utils";

export type OrgPerson = {
  id: string;
  fullName: string;
  positionTitle: string | null;
  photoStorageKey: string | null;
  updatedAt: Date;
};

export function OrgChart({
  people,
  edges,
}: {
  people: OrgPerson[];
  edges: { personId: string; superiorId: string }[];
}) {
  const byId = new Map(people.map((person) => [person.id, person]));
  const children = new Map<string, string[]>();
  const superiors = new Map<string, string[]>();
  for (const edge of edges) {
    if (!byId.has(edge.personId) || !byId.has(edge.superiorId) || edge.personId === edge.superiorId) continue;
    const reports = children.get(edge.superiorId) ?? [];
    if (!reports.includes(edge.personId)) reports.push(edge.personId);
    children.set(edge.superiorId, reports);
    const above = superiors.get(edge.personId) ?? [];
    if (!above.includes(edge.superiorId)) above.push(edge.superiorId);
    superiors.set(edge.personId, above);
  }
  const involved = new Set([...children.keys(), ...superiors.keys()]);
  const roots = [...involved].filter((id) => !(superiors.get(id) ?? []).some((superiorId) => involved.has(superiorId)));
  const depth = new Map<string, number>();
  const queue = [...roots];
  for (const id of roots) depth.set(id, 0);
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const child of children.get(id) ?? []) {
      if (depth.has(child)) continue;
      depth.set(child, (depth.get(id) ?? 0) + 1);
      queue.push(child);
    }
  }
  const maxDepth = Math.max(-1, ...depth.values());
  const rows = Array.from({ length: maxDepth + 1 }, (_, level) =>
    [...depth.entries()]
      .filter(([, value]) => value === level)
      .map(([id]) => byId.get(id))
      .filter((person): person is OrgPerson => Boolean(person))
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
  );
  const looped = [...involved].filter((id) => !depth.has(id)).map((id) => byId.get(id)).filter((person): person is OrgPerson => Boolean(person));
  const unattached = people.filter((person) => !involved.has(person.id)).sort((a, b) => a.fullName.localeCompare(b.fullName));

  if (involved.size === 0) {
    return <p className="text-sm text-secondary">No reporting links yet. A person can report to as many as three people.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max min-w-full flex-col items-center">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col items-center">
              {index > 0 ? <span className="h-6 w-px bg-border" aria-hidden /> : null}
              <div className="flex gap-3">
                {row.map((person) => (
                  <OrgCard key={person.id} person={person} superiorNames={(superiors.get(person.id) ?? []).map((id) => byId.get(id)?.fullName).filter((name): name is string => Boolean(name))} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {looped.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Links that loop</p>
          <div className="flex gap-3 overflow-x-auto">
            {looped.map((person) => (
              <OrgCard key={person.id} person={person} superiorNames={(superiors.get(person.id) ?? []).map((id) => byId.get(id)?.fullName).filter((name): name is string => Boolean(name))} />
            ))}
          </div>
        </div>
      ) : null}
      {unattached.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">No reporting link</p>
          <div className="flex flex-wrap gap-2">
            {unattached.map((person) => (
              <Link key={person.id} href={`/team/${person.id}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas py-1 pl-1 pr-3 text-sm font-semibold">
                <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} size="sm" />
                {person.fullName}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrgCard({ person, superiorNames }: { person: OrgPerson; superiorNames: string[] }) {
  return (
    <Link href={`/team/${person.id}`} className="flex w-44 shrink-0 flex-col items-center rounded-[16px] border border-border bg-canvas px-3 py-3 text-center shadow-[var(--shadow-card)] hover:border-pink">
      <PersonAvatar personId={person.id} name={person.fullName} hasPhoto={Boolean(person.photoStorageKey)} version={person.updatedAt.getTime()} size="sm" />
      <span className="mt-2 line-clamp-2 text-sm font-bold text-text">{person.fullName}</span>
      <span className="mt-0.5 line-clamp-2 text-[11px] text-secondary">{person.positionTitle ? readableLabel(person.positionTitle) : "No position title"}</span>
      {superiorNames.length > 0 ? <span className="mt-1 line-clamp-2 text-[11px] font-semibold text-pink">Reports to {superiorNames.join(", ")}</span> : null}
    </Link>
  );
}

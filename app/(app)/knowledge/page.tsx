import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Layers, Users } from "lucide-react";
import { saveKnowledge } from "@/lib/actions/core";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { knowledgeVersions } from "@/lib/db/schema";
import { listKnowledge, listPeople } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { RecordList } from "@/components/list-controls";
import { Metric, ViewPills, WorkHero, linkButton } from "@/components/work-surface";
import { formatDate, readableLabel } from "@/lib/utils";

const CATEGORY_OPTIONS = ["SOP", "policy", "guide", "template", "FAQ"] as const;

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { category = "all" } = await searchParams;
  const canManage = hasPermission(ctx, "knowledge:manage");
  const [rows, peopleRows, versions] = await Promise.all([
    listKnowledge(true),
    listPeople(),
    db.select().from(knowledgeVersions),
  ]);
  const peopleById = new Map(peopleRows.map((person) => [person.id, person]));
  const versionCount = new Map<string, number>();
  for (const version of versions) versionCount.set(version.articleId, (versionCount.get(version.articleId) ?? 0) + 1);
  const categories = [...new Set(rows.map((row) => row.category))];
  const filtered = category === "all" ? rows : rows.filter((row) => row.category === category);
  const owners = new Set(rows.map((row) => row.ownerId).filter((id): id is string => Boolean(id && peopleById.has(id))));
  const summary = rows.length === 0
    ? "Published SOPs, guides, policies, templates, and FAQs."
    : `${rows.length} published ${rows.length === 1 ? "article" : "articles"} across ${categories.length} ${categories.length === 1 ? "category" : "categories"}.`;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="knowledge"
        kicker="Knowledge"
        title="How the work is done"
        artWash="bg-purple-soft"
        description={canManage ? `${summary} You can publish and update articles.` : `${summary} Publishing uses the knowledge permission.`}
        actions={
          <>
            {canManage ? <a className={linkButton("primary")} href="#publish">Publish</a> : null}
            <Link className={linkButton()} href="/ai">AI assistant</Link>
            <Link className={linkButton()} href="/notices">Notices</Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric label="Articles" value={rows.length} note="Published articles you can read." icon={BookOpen} wash="bg-purple-soft" ink="text-purple" href="/knowledge" />
        <Metric label="Categories" value={categories.length} note="Groups already used on articles." icon={Layers} wash="bg-blue-soft" ink="text-info" />
        <Metric label="Authors" value={owners.size} note="People recorded as the owner." icon={Users} wash="bg-pink-soft" ink="text-pink" href="/team" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-4">
          <ViewPills
            items={[
              { key: "all", href: "/knowledge", label: "All", active: category === "all", count: rows.length },
              ...categories.map((item) => ({
                key: item,
                href: `/knowledge?category=${encodeURIComponent(item)}`,
                label: readableLabel(item),
                active: category === item,
                count: rows.filter((row) => row.category === item).length,
              })),
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState illustration="knowledge" title="No published articles in this view" body="An article appears here after it is published." />
          ) : (
            <RecordList className="space-y-3" sortLabel="Updated">
              {filtered.map((article) => {
                const owner = article.ownerId ? peopleById.get(article.ownerId) : null;
                const history = versionCount.get(article.id) ?? 0;
                return (
                  <article
                    key={article.id}
                    id={article.id}
                    data-record=""
                    data-sort={article.updatedAt ? new Date(article.updatedAt).toISOString() : ""}
                    data-label-text={`${article.title} ${article.category} ${article.body} ${owner?.fullName ?? ""}`}
                    className="rounded-[18px] border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="purple">{readableLabel(article.category)}</Badge>
                      {history > 0 ? <Badge>{history} saved {history === 1 ? "version" : "versions"}</Badge> : null}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-text">{article.title}</h2>
                    <p className="mt-1 text-xs text-secondary">
                      Updated {formatDate(article.updatedAt)}
                      {owner ? <> · <Link href={`/team/${owner.id}`} className="font-semibold text-text hover:text-primary">{owner.fullName}</Link></> : null}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{article.body}</p>
                    {canManage ? (
                      <details className="mt-4 rounded-[14px] bg-canvas px-3 py-2">
                        <summary className="cursor-pointer text-sm font-semibold">Update this article</summary>
                        <div className="mt-3">
                          <ActionForm action={saveKnowledge} submitLabel="Save update">
                            <input type="hidden" name="id" value={article.id} />
                            <Field label="Title"><Input name="title" required defaultValue={article.title} /></Field>
                            <Field label="Category">
                              <Select name="category" defaultValue={article.category}>
                                {(CATEGORY_OPTIONS.some((item) => item.toLowerCase() === article.category.toLowerCase())
                                  ? CATEGORY_OPTIONS.map((item) => (item.toLowerCase() === article.category.toLowerCase() ? article.category : item))
                                  : [...CATEGORY_OPTIONS, article.category]
                                ).map((item) => <option key={item} value={item}>{readableLabel(item)}</option>)}
                              </Select>
                            </Field>
                            <Field label="Body"><Textarea name="body" required defaultValue={article.body} /></Field>
                          </ActionForm>
                        </div>
                      </details>
                    ) : null}
                  </article>
                );
              })}
            </RecordList>
          )}
        </section>
        {canManage ? (
          <Card id="publish" className="xl:sticky xl:top-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Publish</p>
            <h2 className="mt-1 text-lg font-bold">New article</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-secondary">A published article is an SOP or guide. It is separate from a team notice.</p>
            <ActionForm action={saveKnowledge} submitLabel="Publish article">
              <Field label="Title"><Input name="title" required /></Field>
              <Field label="Category">
                <Select name="category" defaultValue="SOP">
                  {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{readableLabel(item)}</option>)}
                </Select>
              </Field>
              <Field label="Body"><Textarea name="body" required /></Field>
            </ActionForm>
          </Card>
        ) : (
          <Card>
            <p className="text-sm leading-relaxed text-secondary">You can read published articles. Publishing and updates use the knowledge permission.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

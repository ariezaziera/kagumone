"use client";

import { useState } from "react";
import Link from "next/link";
import { askAssistant } from "@/lib/actions/auth-extra";
import { Button, Card, Textarea } from "@/components/ui";
import { WorkHero, linkButton } from "@/components/work-surface";
import { readableLabel } from "@/lib/utils";

const PROMPTS = ["Summarise my workload", "Find overdue work", "Summarise this project", "Find related records"];

function sourceHref(type: string, id: string) {
  if (type === "project") return `/projects/${id}`;
  if (type === "task") return `/tasks/${id}`;
  if (type === "knowledge") return `/knowledge#${id}`;
  if (type === "activity") return "/activity";
  return null;
}

export default function AiPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ type: string; id: string; label: string }[]>([]);
  const [labels, setLabels] = useState<Record<string, string> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="ai"
        kicker="AI Assistant"
        title="Ask the records"
        artWash="bg-purple-soft"
        description="Answers stay inside the records you can already see. A suggestion still needs you to confirm it."
        actions={
          <>
            <Link className={linkButton()} href="/knowledge">Knowledge</Link>
            <Link className={linkButton()} href="/my-tasks">My tasks</Link>
          </>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                aria-pressed={question === prompt}
                className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors active:scale-[0.98] motion-reduce:active:scale-100 ${
                  question === prompt
                    ? "border-purple bg-purple text-white"
                    : "border-transparent bg-purple-soft text-purple hover:border-purple"
                }`}
                onClick={() => setQuestion(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="space-y-3 rounded-[18px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            onSubmit={async (event) => {
              event.preventDefault();
              const q = question.trim();
              if (!q) return;
              setPending(true);
              setError(null);
              try {
                const result = await askAssistant(q);
                setAnswer(result.answer);
                setSources(result.sources);
                setLabels(result.labels);
              } catch (cause) {
                setAnswer("");
                setSources([]);
                setLabels(null);
                setError(cause instanceof Error ? cause.message : "Unable to ask right now.");
              } finally {
                setPending(false);
              }
            }}
          >
            <Textarea name="question" required placeholder="Ask about a project, a task, or an SOP..." value={question} onChange={(event) => setQuestion(event.target.value)} />
            <Button type="submit" disabled={pending}>{pending ? "Looking through records…" : "Ask"}</Button>
            {error ? <p className="text-sm text-error">{error}</p> : null}
          </form>
          {answer ? (
            <Card accent="purple">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Answer</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{answer}</p>
            </Card>
          ) : null}
          {labels ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {(["recorded", "inferred", "suggested"] as const).map((key) => (
                <div key={key} className="rounded-[16px] border border-border bg-surface px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{readableLabel(key)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-secondary">{labels[key]}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Card className="xl:sticky xl:top-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Sources</p>
          <h2 className="mt-1 text-lg font-bold">Records used</h2>
          {sources.length === 0 ? (
            <p className="mt-3 text-sm text-secondary">Matching projects, tasks, articles, and recent activity appear here after you ask.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sources.map((source) => {
                const href = sourceHref(source.type, source.id);
                return (
                  <li key={`${source.type}-${source.id}`} className="rounded-[12px] bg-canvas px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{readableLabel(source.type)}</p>
                    {href ? (
                      <Link href={href} className="text-sm font-semibold text-info">{source.label}</Link>
                    ) : (
                      <p className="text-sm font-semibold">{source.label}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

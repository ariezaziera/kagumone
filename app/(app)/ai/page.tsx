"use client";

import { useState } from "react";
import { askAssistant } from "@/lib/actions/auth-extra";
import { Button, Card, PageHeader, Textarea } from "@/components/ui";
import { Illustration } from "@/components/illustrations";

const PROMPTS = ["Summarise my workload", "Find overdue work", "Summarise this project", "Find related records"];

export default function AiPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<{ type: string; id: string; label: string }[]>([]);
  const [labels, setLabels] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <PageHeader module="ai" title="KAGUM ONE Assistant" description="Assistive only. Suggestions require human confirmation and normal authorization." />
      <Card accent="purple" className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration name="ai" className="h-24 w-40 shrink-0" />
          <div>
            <p className="text-lg font-bold">What would you like to understand?</p>
            <p className="mt-1 text-sm text-secondary">Answers stay inside the records you are already allowed to see.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-border bg-purple-soft px-3 py-1 text-sm font-medium text-purple"
                  onClick={() => setQuestion(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <form
        className="space-y-3"
        action={async (form) => {
          const q = String(form.get("question") || "");
          const result = await askAssistant(q);
          setAnswer(result.answer);
          setSources(result.sources);
          setLabels(result.labels);
        }}
      >
        <Textarea name="question" required placeholder="Ask KAGUM ONE..." value={question} onChange={(event) => setQuestion(event.target.value)} />
        <Button type="submit">Ask</Button>
      </form>
      {answer ? (
        <Card className="mt-4 whitespace-pre-wrap text-sm">{answer}</Card>
      ) : null}
      {labels ? (
        <Card className="mt-3 text-sm">
          <p>
            <strong>Recorded:</strong> {labels.recorded}
          </p>
          <p>
            <strong>Inferred:</strong> {labels.inferred}
          </p>
          <p>
            <strong>Suggested:</strong> {labels.suggested}
          </p>
        </Card>
      ) : null}
      {sources.length ? (
        <Card className="mt-3">
          <h2 className="font-semibold">Sources</h2>
          <ul className="kagum-list mt-2 text-sm">
            {sources.map((s) => (
              <li key={`${s.type}-${s.id}`}>
                {s.type}: {s.label}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

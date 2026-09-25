"use client";

import { useState } from "react";
import { askAssistant } from "@/lib/actions/auth-extra";
import { Button, Card, PageHeader, Textarea } from "@/components/ui";

export default function AiPage() {
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<{ type: string; id: string; label: string }[]>([]);
  const [labels, setLabels] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <PageHeader title="AI Assistant" description="Assistive only. Suggestions require human confirmation and normal authorization." />
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
        <Textarea name="question" required placeholder="Ask about projects, tasks, or history you can access." />
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
          <h2 className="font-medium">Sources</h2>
          <ul className="text-sm">
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

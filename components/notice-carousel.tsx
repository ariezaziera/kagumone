"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

export type NoticeSlide = {
  id: string;
  title: string;
  body: string;
  kind: string;
  requiresParticipation: boolean;
};

export function NoticeCarousel({ notices }: { notices: NoticeSlide[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (notices.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % notices.length), 8000);
    return () => window.clearInterval(timer);
  }, [notices.length]);
  if (notices.length === 0) {
    return (
      <Card>
        <p className="font-medium">Team notices</p>
        <p className="mt-1 text-sm text-secondary">Event notices and participation posts will rotate here.</p>
      </Card>
    );
  }
  const current = notices[index] ?? notices[0];
  const kindLabel =
    current.kind === "event_notice"
      ? "Event notice"
      : current.kind === "participation"
        ? "Needs participation"
        : "Announcement";
  return (
    <Card className="border-info/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-info">{kindLabel}</p>
          <h2 className="mt-1 text-lg font-semibold">{current.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">{current.body}</p>
          {current.requiresParticipation ? (
            <p className="mt-2 text-sm text-warning">All team participation requested.</p>
          ) : null}
        </div>
        <Link className="text-sm text-info" href="/notices">
          All notices
        </Link>
      </div>
      {notices.length > 1 ? (
        <div className="mt-3 flex gap-1">
          {notices.map((n, i) => (
            <button
              key={n.id}
              type="button"
              aria-label={`Show notice ${i + 1}`}
              className={`h-2 flex-1 rounded-full ${i === index ? "bg-info" : "bg-border"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

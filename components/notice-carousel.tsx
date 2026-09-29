"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { Illustration, type IllustrationName } from "@/components/illustrations";

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
      <Card accent="red">
        <div className="flex items-center gap-4">
          <Illustration name="quiet" className="h-20 w-32 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Team notices</p>
            <p className="mt-1 font-semibold text-text">Nothing posted right now</p>
            <p className="mt-1 text-sm text-secondary">Event notices and participation posts will rotate here.</p>
          </div>
        </div>
      </Card>
    );
  }
  const current = notices[index] ?? notices[0];
  const kindLabel =
    current.kind === "event_notice" ? "Event notice" : current.kind === "participation" ? "Needs participation" : "Announcement";
  const art: IllustrationName = current.kind === "event_notice" ? "calendar" : current.kind === "participation" ? "team" : "knowledge";
  return (
    <Card accent="red" className="border-primary/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration name={art} className="h-24 w-36 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{kindLabel}</p>
            <Link className="shrink-0 text-sm font-semibold text-primary" href="/notices">
              All notices
            </Link>
          </div>
          <h2 className="mt-1 text-xl font-bold text-text">{current.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{current.body}</p>
          {current.requiresParticipation ? <p className="mt-2 text-sm font-semibold text-warning">All team participation requested.</p> : null}
        </div>
      </div>
      {notices.length > 1 ? (
        <div className="mt-3 flex gap-1">
          {notices.map((n, i) => (
            <button
              key={n.id}
              type="button"
              aria-label={`Show notice ${i + 1}`}
              aria-pressed={i === index}
              className={`h-2 flex-1 cursor-pointer rounded-full transition-colors active:scale-95 motion-reduce:active:scale-100 ${i === index ? "bg-primary" : "bg-border hover:bg-charcoal"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

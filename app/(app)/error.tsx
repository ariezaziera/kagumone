"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[18px] border border-error/30 bg-surface p-6 shadow-[var(--shadow-card)]">
      <h1 className="text-lg font-bold text-error">Something went wrong</h1>
      <p className="mt-1 text-sm text-secondary">{error.message || "Please try again."}</p>
      <button className={buttonClass("primary", "mt-4")} onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}

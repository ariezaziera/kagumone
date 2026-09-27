"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[18px] border border-error/30 bg-surface p-6 shadow-[var(--shadow-card)]">
      <h1 className="text-lg font-bold text-error">Something went wrong</h1>
      <p className="mt-1 text-sm text-secondary">{error.message || "Please try again."}</p>
      <button className="mt-4 rounded-[12px] bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}

"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-error/30 bg-surface p-4">
      <h1 className="font-medium text-error">Something went wrong</h1>
      <p className="mt-1 text-sm text-secondary">{error.message || "Please try again."}</p>
      <button className="mt-3 text-sm text-info" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}

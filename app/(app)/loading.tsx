export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="kagum-skeleton h-11 w-11 rounded-[14px]" />
        <div className="space-y-2">
          <div className="kagum-skeleton h-3 w-24 rounded-full" />
          <div className="kagum-skeleton h-6 w-48 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="kagum-skeleton h-24 rounded-[18px]" />
        <div className="kagum-skeleton h-24 rounded-[18px]" />
        <div className="kagum-skeleton h-24 rounded-[18px]" />
        <div className="kagum-skeleton h-24 rounded-[18px]" />
      </div>
      <div className="kagum-skeleton h-40 rounded-[18px]" />
      <p className="text-sm text-secondary">Loading records…</p>
    </div>
  );
}

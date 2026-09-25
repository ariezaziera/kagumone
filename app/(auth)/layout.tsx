export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-light px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">KAGUM Advance Group</p>
        <h1 className="mb-4 text-2xl font-semibold text-primary">KAGUM ONE</h1>
        {children}
      </div>
    </div>
  );
}

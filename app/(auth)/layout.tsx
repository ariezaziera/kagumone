export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="kagum-auth w-full max-w-md rounded-[22px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-lg font-bold text-white">K</span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">KAGUM Advance Group</p>
              <h1 className="text-2xl font-bold tracking-tight text-text">KAGUM ONE</h1>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

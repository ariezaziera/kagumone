import Image from "next/image";
import { BrandWordmark } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="kagum-auth w-full max-w-md rounded-[22px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <Image src="/kagum-mark.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">KAGUM Advance Group</p>
              <h1 className="text-2xl font-bold leading-snug">
                <BrandWordmark />
              </h1>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";

export function ConfirmAction({
  label,
  prompt,
  className,
  children,
  onConfirm,
  disabled,
}: {
  label: string;
  prompt: string;
  className?: string;
  children: React.ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="text-xs font-semibold text-text">{prompt}</span>
        <button type="button" className={buttonClass("danger", "px-2 py-1 text-xs")} onClick={() => { setOpen(false); onConfirm(); }}>
          Confirm
        </button>
        <button type="button" className={buttonClass("ghost", "px-2 py-1 text-xs")} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button type="button" className={className} aria-label={label} disabled={disabled} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

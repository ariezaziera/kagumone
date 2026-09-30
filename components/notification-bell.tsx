"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { clearNotifications, markNotificationRead, markNotificationsRead, previewNotifications } from "@/lib/actions/notifications";
import type { NotificationPreview } from "@/lib/queries";
import { buttonClass, iconButtonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export function NotificationOpenLink({ id, href, className, children }: { id: string; href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        void markNotificationRead(id);
        router.push(href);
      }}
    >
      {children}
    </Link>
  );
}

export function NotificationBell({
  initial,
  onUnread,
}: {
  initial: NotificationPreview;
  onUnread: (unread: number) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [preview, setPreview] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [box, setBox] = useState<{ top: number; right: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewKey = `${initial.unread}:${initial.items.map((item) => `${item.id}${item.unread ? "1" : "0"}`).join(",")}`;

  useEffect(() => {
    setPreview(initial);
  }, [previewKey, initial]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    onUnread(preview.unread);
  }, [preview.unread, onUnread]);

  useEffect(() => {
    let stop = false;
    const id = window.setInterval(async () => {
      if (stop || document.visibilityState !== "visible") return;
      const next = await previewNotifications();
      if (!stop) setPreview(next);
    }, 20000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const narrow = window.innerWidth < 640;
    const width = narrow ? window.innerWidth - 24 : 352;
    const aligned = Math.max(12, window.innerWidth - rect.right);
    const right = narrow || window.innerWidth - aligned - width < 12 ? 12 : aligned;
    setBox({ top: rect.bottom + 8, right, width });
  }

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setOpen(true);
    const next = await previewNotifications();
    setPreview(next);
  }

  function forgetDot(id: string) {
    setPreview((current) => ({
      unread: Math.max(0, current.unread - (current.items.some((row) => row.id === id && row.unread) ? 1 : 0)),
      items: current.items.map((row) => (row.id === id ? { ...row, unread: false } : row)),
    }));
  }

  async function openItem(item: NotificationPreview["items"][number]) {
    if (item.unread) {
      forgetDot(item.id);
      try {
        setPreview(await markNotificationRead(item.id));
      } catch {
        // The record still opens. A failed save shows the dot again on the next refresh.
      }
    }
    router.push(item.href);
  }

  async function readAll() {
    if (pending || preview.unread === 0) return;
    setPending(true);
    setPreview((current) => ({ unread: 0, items: current.items.map((row) => ({ ...row, unread: false })) }));
    try {
      setPreview(await markNotificationsRead());
    } finally {
      setPending(false);
    }
  }

  async function clearAll() {
    if (pending || preview.items.length === 0) return;
    if (!window.confirm("Clear all notifications?")) return;
    setPending(true);
    try {
      setPreview(await clearNotifications());
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={cn(iconButtonClass("relative p-2"), open && "bg-canvas")}
        aria-label={preview.unread > 0 ? `Notifications, ${preview.unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => void toggle()}
      >
        <Bell size={18} />
        {preview.unread > 0 ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" aria-hidden /> : null}
      </button>
      {open && box ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-black/20" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Notifications"
            className="fixed z-50 flex max-h-[min(24rem,70dvh)] flex-col overflow-hidden rounded-[16px] border border-border bg-surface shadow-[var(--shadow-lift)]"
            style={{ top: box.top, right: box.right, width: box.width }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text">Notifications</p>
                {preview.unread > 0 ? <p className="text-xs font-semibold text-primary">{preview.unread} new</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {preview.unread > 0 ? (
                  <button type="button" className={buttonClass("ghost", "px-2 py-1 text-xs")} disabled={pending} onClick={() => void readAll()}>
                    Read all
                  </button>
                ) : null}
                {preview.items.length > 0 ? (
                  <button type="button" className={iconButtonClass("p-1.5 text-secondary hover:text-error disabled:opacity-50")} aria-label="Clear all notifications" disabled={pending} onClick={() => void clearAll()}>
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
            {preview.items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-secondary">No notifications yet.</p>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {preview.items.map((item) => (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    <Link
                      href={item.href}
                      className="block px-3 py-2.5 hover:bg-canvas"
                      onClick={(event) => {
                        event.preventDefault();
                        openItem(item);
                      }}
                    >
                      <span className="flex items-start gap-2">
                        {item.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden /> : <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />}
                        <span className="min-w-0">
                          <span className={cn("block text-sm text-text", item.unread ? "font-semibold" : "font-medium")}>{item.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-secondary">{item.body}</span>
                          <span className="mt-1 block text-[11px] text-muted">{item.timeLabel}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border p-2">
              <Link href="/notifications" className={buttonClass("secondary", "w-full")}>
                See more
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

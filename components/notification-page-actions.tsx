"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearNotifications, markNotificationsRead } from "@/lib/actions/notifications";
import { ConfirmAction } from "@/components/confirm-action";
import { Button, buttonClass } from "@/components/ui";

export function NotificationPageActions({ unread, hasRows }: { unread: number; hasRows: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function readAll() {
    if (pending || unread === 0) return;
    setPending(true);
    try {
      await markNotificationsRead();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function clearAll() {
    if (pending || !hasRows) return;
    setPending(true);
    try {
      await clearNotifications();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {unread > 0 ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={() => void readAll()}>
          Read all
        </Button>
      ) : null}
      {hasRows ? (
        <ConfirmAction
          label="Clear all notifications"
          prompt="Clear all notifications?"
          className={buttonClass("danger", "px-3 py-2 text-sm")}
          disabled={pending}
          onConfirm={() => void clearAll()}
        >
          Clear all
        </ConfirmAction>
      ) : null}
    </>
  );
}

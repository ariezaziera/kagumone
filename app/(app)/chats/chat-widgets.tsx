"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addGroupChatMember,
  createGroupChat,
  openDirectChat,
  pinChat,
  pinChatMessage,
  pollChat,
  removeChat,
  removeChatMessage,
  sendChatMessage,
  starChatMessage,
} from "@/lib/actions/chats";
import { ConfirmAction } from "@/components/confirm-action";
import { Button, EmptyState, Input, Select, Textarea, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

function isNavigationError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = String((error as { digest?: unknown }).digest);
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}

export type ChatFile = { id: string; filename: string; mimeType: string | null };

export type ChatBubble = {
  id: string;
  body: string;
  authorName: string;
  mine: boolean;
  timeLabel: string;
  deleted: boolean;
  canDelete: boolean;
  starred: boolean;
  pinned: boolean;
  file: ChatFile | null;
};

function MessageText({ body, mine }: { body: string; mine: boolean }) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a key={`${part}-${index}`} className={cn("underline", mine ? "text-white" : "text-info")} href={part} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
        ),
      )}
    </p>
  );
}

function messageActionClass(active: boolean, danger = false) {
  return cn(
    "inline-flex min-h-8 cursor-pointer items-center rounded-[10px] border px-2.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
    danger
      ? "border-error/40 bg-surface text-error hover:bg-primary-light"
      : active
        ? "border-primary bg-primary-light text-primary"
        : "border-border bg-surface text-secondary hover:border-[#f0b4b6] hover:bg-primary-light hover:text-text",
  );
}

export function ChatThread({
  conversationId,
  initial,
  initialPinned,
  emptyBody,
  canSend,
}: {
  conversationId: string;
  initial: ChatBubble[];
  initialPinned: { id: string; body: string; authorName: string } | null;
  emptyBody: string;
  canSend: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [pinned, setPinned] = useState(initialPinned);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages[messages.length - 1]?.id;
  const initialKey = initial.map((message) => `${message.id}:${message.deleted}:${message.starred}:${message.pinned}`).join("|");

  useEffect(() => {
    setMessages(initial);
    setPinned(initialPinned);
  }, [initialKey, initial, initialPinned]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  useEffect(() => {
    let stop = false;
    const id = window.setInterval(async () => {
      if (stop || document.visibilityState !== "visible") return;
      const next = await pollChat(conversationId);
      if (!stop && next) {
        setMessages(next.messages);
        setPinned(next.pinned);
      }
    }, 8000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [conversationId]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      const next = await pollChat(conversationId);
      if (next) {
        setMessages(next.messages);
        setPinned(next.pinned);
      }
      router.refresh();
    } catch (err) {
      if (isNavigationError(err)) throw err;
      setError(err instanceof Error ? err.message : "Unable to update the chat.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {pinned ? (
        <button
          type="button"
          className="border-b border-border bg-yellow-soft px-3 py-2 text-left text-xs text-text transition-colors hover:bg-yellow-soft/80"
          onClick={() => document.getElementById(`message-${pinned.id}`)?.scrollIntoView({ block: "center" })}
        >
          <span className="font-semibold">Pinned</span>
          <span className="mt-0.5 block truncate">{pinned.authorName}: {pinned.body}</span>
        </button>
      ) : null}
      {messages.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmptyState illustration="quiet" title="No messages yet" body={emptyBody} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.map((message) => (
            <article key={message.id} id={`message-${message.id}`} className={cn("flex max-w-[85%] flex-col", message.mine ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn("rounded-[16px] px-3 py-2", message.deleted ? "bg-canvas text-muted" : message.mine ? "bg-primary text-white" : "bg-canvas text-text")}>
                {message.mine || message.deleted ? null : <p className="text-xs font-semibold text-secondary">{message.authorName}</p>}
                {message.deleted ? <p className="text-sm italic">Message deleted</p> : <MessageText body={message.body} mine={message.mine} />}
                {message.file ? (
                  message.file.mimeType?.startsWith("image/") ? (
                    <a className="mt-2 block" href={`/api/files/${message.file.id}`} target="_blank" rel="noreferrer">
                      <img src={`/api/files/${message.file.id}`} alt={message.file.filename} className="max-h-48 rounded-[12px]" />
                    </a>
                  ) : (
                    <a className={cn("mt-1 block text-sm underline", message.mine ? "text-white" : "text-info")} href={`/api/files/${message.file.id}`}>
                      {message.file.filename}
                    </a>
                  )
                ) : null}
                <p className={cn("mt-1 text-[11px]", message.mine && !message.deleted ? "text-white/80" : "text-muted")}>{message.timeLabel}</p>
              </div>
              {message.deleted ? null : (
                <div className={cn("mt-1 flex flex-wrap gap-1", message.mine ? "justify-end" : "justify-start")}>
                  {canSend ? (
                    <button type="button" className={messageActionClass(message.pinned)} onClick={() => void run(() => pinChatMessage(conversationId, message.id, !message.pinned))}>
                      {message.pinned ? "Unpin" : "Pin"}
                    </button>
                  ) : null}
                  <button type="button" className={messageActionClass(message.starred)} onClick={() => void run(() => starChatMessage(message.id, !message.starred))}>
                    {message.starred ? "Unstar" : "Star"}
                  </button>
                  {message.canDelete ? (
                    <ConfirmAction
                      label="Delete message"
                      prompt="Delete this message for everyone?"
                      className={messageActionClass(false, true)}
                      onConfirm={() => void run(() => removeChatMessage(message.id))}
                    >
                      Delete
                    </ConfirmAction>
                  ) : null}
                </div>
              )}
            </article>
          ))}
          <div ref={endRef} />
        </div>
      )}
      {error ? <p className="px-3 pb-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function ChatComposer({ conversationId, disabled }: { conversationId: string; disabled: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="border-t border-border p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || pending) return;
        const form = new FormData(event.currentTarget);
        form.set("conversationId", conversationId);
        form.set("body", body);
        const file = fileRef.current?.files?.[0];
        if (!body.trim() && !file) {
          setError("Write a message, paste a link, or attach a file.");
          return;
        }
        setPending(true);
        setError(null);
        try {
          await sendChatMessage(form);
          setBody("");
          setFileName(null);
          if (fileRef.current) fileRef.current.value = "";
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to send.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        maxLength={2000}
        placeholder={disabled ? "This account cannot send messages." : "Write a message or paste a link"}
        disabled={disabled || pending}
        aria-label="Message"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <label className={buttonClass("secondary", cn("cursor-pointer px-2.5 py-1.5 text-xs", (disabled || pending) && "pointer-events-none opacity-50"))}>
          Attach file
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            name="file"
            disabled={disabled || pending}
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
        </label>
        <span className="min-w-0 flex-1 truncate text-xs text-muted">{fileName ?? "Enter to send. Files up to 8 MB."}</span>
        <Button type="submit" className="shrink-0" disabled={disabled || pending || (body.trim().length === 0 && !fileName)}>
          Send
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function ChatHeaderActions({
  conversationId,
  pinned,
  closeLabel,
}: {
  conversationId: string;
  pinned: boolean;
  closeLabel: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant={pinned ? "secondary" : "ghost"}
        className="px-2.5 py-1.5 text-xs"
        onClick={() =>
          void pinChat(conversationId, !pinned)
            .then(() => router.refresh())
            .catch((err) => setError(err instanceof Error ? err.message : "Unable to pin this chat."))
        }
      >
        {pinned ? "Unpin chat" : "Pin chat"}
      </Button>
      {closeLabel ? (
        <ConfirmAction
          label={closeLabel}
          prompt={`${closeLabel}?`}
          className={buttonClass("danger", "px-2.5 py-1.5 text-xs")}
          onConfirm={() => {
            void removeChat(conversationId).catch((err) => {
              if (isNavigationError(err)) throw err;
              setError(err instanceof Error ? err.message : "Unable to update this chat.");
            });
          }}
        >
          {closeLabel}
        </ConfirmAction>
      ) : null}
      {error ? <p className="w-full text-right text-xs text-error">{error}</p> : null}
    </div>
  );
}

export function AddMember({ conversationId, people }: { conversationId: string; people: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  if (people.length === 0) return null;
  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-3"
      action={async (form) => {
        setError(null);
        try {
          await addGroupChatMember(form);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to add that person.");
        }
      }}
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <Select name="personId" defaultValue="" required aria-label="Add a teammate" className="max-w-xs">
        <option value="" disabled>
          Add a teammate
        </option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Add
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function GroupMembers({
  conversationId,
  members,
  people,
  canManage,
}: {
  conversationId: string;
  members: { id: string; name: string; you: boolean; owner: boolean }[];
  people: { id: string; name: string }[];
  canManage: boolean;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-3">
        <div>
          <h2 className="text-sm font-bold text-text">Members</h2>
          <p className="text-xs text-secondary">{members.length} {members.length === 1 ? "person" : "people"}</p>
        </div>
        <Link className={cn(buttonClass("ghost", "px-2.5 py-1.5 text-xs"), "lg:hidden")} href={`/chats?c=${conversationId}`}>
          Messages
        </Link>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-2 px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white">
              {member.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">{member.you ? `${member.name} (you)` : member.name}</span>
              {member.owner ? <span className="block text-[11px] text-muted">Created this group</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {canManage ? <AddMember conversationId={conversationId} people={people} /> : null}
    </aside>
  );
}

export function ChatStartPanels({ people }: { people: { id: string; name: string }[] }) {
  const [panel, setPanel] = useState<"direct" | "group" | null>(null);
  return (
    <section className="rounded-[18px] border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={panel === "direct" ? "primary" : "secondary"} className="px-2 py-1.5 text-xs" onClick={() => setPanel((current) => (current === "direct" ? null : "direct"))}>
          Private chat
        </Button>
        <Button type="button" variant={panel === "group" ? "primary" : "secondary"} className="px-2 py-1.5 text-xs" onClick={() => setPanel((current) => (current === "group" ? null : "group"))}>
          New group
        </Button>
      </div>
      {panel === "direct" ? (
        <div className="mt-3">
          <StartChat people={people} />
        </div>
      ) : null}
      {panel === "group" ? (
        <div className="mt-3">
          <CreateGroup people={people} />
        </div>
      ) : null}
    </section>
  );
}

export function StartChat({ people }: { people: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  if (people.length === 0) return <p className="text-sm text-secondary">No other active teammates to message yet.</p>;
  return (
    <form
      className="space-y-2"
      action={async (form) => {
        setError(null);
        try {
          await openDirectChat(form);
        } catch (err) {
          if (isNavigationError(err)) throw err;
          setError(err instanceof Error ? err.message : "Unable to open that chat.");
        }
      }}
    >
      <Select name="personId" defaultValue="" required aria-label="Teammate">
        <option value="" disabled>
          Choose a teammate
        </option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </Select>
      <Button type="submit" className="w-full">
        Open chat
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function CreateGroup({ people }: { people: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  if (people.length === 0) return null;
  return (
    <form
      className="space-y-2"
      action={async (form) => {
        setError(null);
        try {
          await createGroupChat(form);
        } catch (err) {
          if (isNavigationError(err)) throw err;
          setError(err instanceof Error ? err.message : "Unable to create the group.");
        }
      }}
    >
      <Input name="name" required minLength={2} maxLength={80} placeholder="Group name" aria-label="Group name" />
      <div className="max-h-36 space-y-1 overflow-y-auto rounded-[12px] border border-border p-2">
        {people.map((person) => (
          <label key={person.id} className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" name="memberIds" value={person.id} />
            <span className="truncate">{person.name}</span>
          </label>
        ))}
      </div>
      <Button type="submit" className="w-full" variant="secondary">
        Create group
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}

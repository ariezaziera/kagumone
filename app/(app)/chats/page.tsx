import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { loadChatPage } from "@/lib/services/chats";
import { Badge, EmptyState, buttonClass } from "@/components/ui";
import { cn, DISPLAY_TZ } from "@/lib/utils";
import { ChatComposer, ChatHeaderActions, ChatStartPanels, ChatThread, GroupMembers } from "./chat-widgets";

function chatTime(value: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: DISPLAY_TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ c?: string; view?: string; panel?: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  const { c, view, panel } = await searchParams;
  const page = await loadChatPage(c ?? null);
  const selected = page.thread;
  const showStarred = view === "starred" && !selected;
  const missing = Boolean(c) && !selected;
  const showMembers = panel === "members" && selected?.kind === "group";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn("grid min-h-0 flex-1 gap-3", selected?.kind === "group" ? "lg:grid-cols-[260px_minmax(0,1fr)_240px]" : "lg:grid-cols-[280px_minmax(0,1fr)]")}>
        <aside className={cn("flex min-h-0 flex-col gap-3", selected ? "hidden lg:flex" : "flex")}>
          <ChatStartPanels people={page.partners} />
          <section className="min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-border bg-surface p-2 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Conversations</h2>
              <Link className={buttonClass(showStarred ? "primary" : "ghost", "px-2.5 py-1 text-xs")} href="/chats?view=starred">
                Starred
              </Link>
            </div>
            <ul className="space-y-1">
              {page.items.map((item) => {
                const active = item.id === selected?.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/chats?c=${item.id}`}
                      className={cn("flex items-center gap-2 rounded-[12px] px-2 py-2 transition-colors hover:bg-canvas", active ? "bg-primary-light" : "")}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">{initial(item.title)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-text">{item.title}</span>
                          {item.unread > 0 ? <Badge tone="info">{item.unread > 99 ? "99+" : item.unread}</Badge> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-secondary">{item.preview}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">{item.pinned ? "Pinned · " : ""}{item.meta}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
        <section className={cn("min-h-0 flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadow-card)]", selected || missing || showStarred ? (showMembers ? "hidden lg:flex" : "flex") : "hidden lg:flex")}>
          {selected ? (
            <>
              <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">{initial(selected.title)}</span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-text">{selected.title}</h2>
                    <p className="line-clamp-2 text-xs text-secondary">{selected.hint}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className={cn(buttonClass("ghost", "px-2.5 py-1.5 text-xs"), "lg:hidden")} href="/chats">
                    All chats
                  </Link>
                  {selected.kind === "group" ? (
                    <Link className={cn(buttonClass("secondary", "px-2.5 py-1.5 text-xs"), "lg:hidden")} href={`/chats?c=${selected.id}&panel=members`}>
                      Members
                    </Link>
                  ) : null}
                  <ChatHeaderActions conversationId={selected.id} pinned={selected.chatPinned} closeLabel={selected.closeLabel} />
                </div>
              </header>
              <ChatThread
                conversationId={selected.id}
                emptyBody={selected.kind === "team" ? "Say hello. The whole team can read this chat." : selected.kind === "group" ? "Say hello to the group." : "Say hello. Only the two of you can read this chat."}
                canSend={page.canSend}
                initialPinned={selected.pinnedMessage}
                initial={selected.messages.map((message) => ({
                  id: message.id,
                  body: message.body,
                  authorName: message.authorName,
                  mine: message.mine,
                  deleted: message.deleted,
                  canDelete: message.canDelete,
                  starred: message.starred,
                  pinned: message.pinned,
                  file: message.file,
                  timeLabel: chatTime(message.createdAt),
                }))}
              />
              <ChatComposer conversationId={selected.id} disabled={!page.canSend} />
            </>
          ) : showStarred ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-text">Starred messages</h2>
                <Link className={cn(buttonClass("ghost", "px-2.5 py-1.5 text-xs"), "lg:hidden")} href="/chats">
                  All chats
                </Link>
              </div>
              {page.starred.length === 0 ? (
                <EmptyState illustration="quiet" title="No starred messages" body="Star a message to keep it here. Stars are only yours." />
              ) : (
                <ul className="space-y-2">
                  {page.starred.map((message) => (
                    <li key={message.id}>
                      <Link className="block rounded-[12px] border border-border px-3 py-2 hover:bg-canvas" href={`/chats?c=${message.conversationId}`}>
                        <span className="text-xs font-semibold text-secondary">{message.conversationTitle} · {message.authorName}</span>
                        <span className="mt-1 block text-sm text-text">{message.body}</span>
                        <span className="mt-1 block text-[11px] text-muted">{chatTime(message.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : missing ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex justify-end border-b border-border px-3 py-3 lg:hidden">
                <Link className={buttonClass("ghost", "px-2.5 py-1.5 text-xs")} href="/chats">
                  All chats
                </Link>
              </div>
              <EmptyState illustration="quiet" title="That conversation is not available" body="It may belong to someone else, or it may have been removed from your list." />
            </div>
          ) : (
            <EmptyState illustration="quiet" title="Choose a conversation" body="Open the team chat, a private chat, or a group." />
          )}
        </section>
        {selected?.kind === "group" ? (
          <div className={cn("min-h-0 flex-col", showMembers ? "flex" : "hidden lg:flex")}>
            <GroupMembers conversationId={selected.id} members={selected.members} people={selected.invitees} canManage={selected.canManage} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

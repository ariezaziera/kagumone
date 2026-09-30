import { and, count, desc, eq, gt, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatConversations, chatMessages, chatParticipants, chatStars, files, people } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth/context";
import { hideDemoWorkspace } from "@/lib/services/demo-scope";
import { storeFile } from "@/lib/integrations/storage";
import { notify, recordActivity, recordAudit } from "@/lib/services/records";
import { newId, now } from "@/lib/utils";

const TEAM_KEY = "team";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function chatPersonName(person: { fullName: string; preferredName: string | null }) {
  return person.preferredName?.trim() || person.fullName;
}

function pairKey(left: string, right: string) {
  return [left, right].sort().join(":");
}

function clip(body: string) {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "Sent a file";
  return flat.length > 90 ? `${flat.slice(0, 87)}...` : flat;
}

async function requireViewer() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.person.organizationalStatus === "deleted") throw new Error("You must be signed in.");
  return ctx;
}

export async function ensureTeamConversation() {
  const [existing] = await db.select().from(chatConversations).where(eq(chatConversations.pairKey, TEAM_KEY)).limit(1);
  if (existing) return existing;
  const createdAt = now();
  const row = {
    id: newId(),
    kind: "team",
    pairKey: TEAM_KEY,
    title: null,
    createdById: null,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  try {
    await db.insert(chatConversations).values(row);
    return row;
  } catch {
    const [again] = await db.select().from(chatConversations).where(eq(chatConversations.pairKey, TEAM_KEY)).limit(1);
    if (!again) throw new Error("Unable to open team chat.");
    return again;
  }
}

async function touchRead(conversationId: string, personId: string, at: Date) {
  const [row] = await db
    .select()
    .from(chatParticipants)
    .where(and(eq(chatParticipants.conversationId, conversationId), eq(chatParticipants.personId, personId)))
    .limit(1);
  if (!row) {
    await db.insert(chatParticipants).values({
      id: newId(),
      conversationId,
      personId,
      lastReadAt: at,
      pinned: false,
      createdAt: at,
    });
    return;
  }
  await db.update(chatParticipants).set({ lastReadAt: at, hiddenAt: null }).where(eq(chatParticipants.id, row.id));
}

type DirectoryPerson = {
  id: string;
  fullName: string;
  preferredName: string | null;
  userId: string | null;
  organizationalStatus: string;
  isDemo: boolean;
};

async function loadDirectory() {
  return db
    .select({
      id: people.id,
      fullName: people.fullName,
      preferredName: people.preferredName,
      userId: people.userId,
      organizationalStatus: people.organizationalStatus,
      isDemo: people.isDemo,
    })
    .from(people);
}

function activePartners(directory: DirectoryPerson[], viewerId: string, hideDemo: boolean) {
  return directory
    .filter((person) => person.id !== viewerId && person.organizationalStatus === "active" && person.userId && (!hideDemo || !person.isDemo))
    .map((person) => ({ id: person.id, name: chatPersonName(person) }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function conversationAccess(personId: string, conversationId: string, directory: DirectoryPerson[]) {
  const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
  if (!conversation || conversation.deletedAt) return null;
  const members = await db.select().from(chatParticipants).where(eq(chatParticipants.conversationId, conversationId));
  const mine = members.find((member) => member.personId === personId) ?? null;
  if (conversation.kind === "direct" && !mine) return null;
  if (conversation.kind === "group" && (!mine || mine.leftAt)) return null;
  if (conversation.kind !== "team" && conversation.kind !== "direct" && conversation.kind !== "group") return null;
  const other = members.map((member) => directory.find((person) => person.id === member.personId)).find((person) => person && person.id !== personId) ?? null;
  const hideDemo = await hideDemoWorkspace();
  if (conversation.kind === "direct" && hideDemo && other?.isDemo) return null;
  return { conversation, members, mine, other };
}

export type ChatListItem = {
  id: string;
  kind: "team" | "direct" | "group";
  title: string;
  meta: string;
  preview: string;
  updatedAt: Date;
  unread: number;
  pinned: boolean;
};

export type ChatMember = {
  id: string;
  name: string;
  you: boolean;
  owner: boolean;
};

export type ChatFile = { id: string; filename: string; mimeType: string | null };

export type ChatMessageView = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string;
  mine: boolean;
  deleted: boolean;
  canDelete: boolean;
  starred: boolean;
  pinned: boolean;
  file: ChatFile | null;
};

export type ChatThread = {
  id: string;
  kind: "team" | "direct" | "group";
  title: string;
  hint: string;
  chatPinned: boolean;
  closeLabel: string | null;
  canManage: boolean;
  members: ChatMember[];
  invitees: { id: string; name: string }[];
  pinnedMessage: { id: string; body: string; authorName: string } | null;
  messages: ChatMessageView[];
};

export type StarredMessage = {
  id: string;
  conversationId: string;
  conversationTitle: string;
  body: string;
  authorName: string;
  createdAt: Date;
};

function conversationTitle(
  conversation: { kind: string; title: string | null },
  members: { personId: string }[],
  names: Map<string, string>,
  viewerId: string,
) {
  if (conversation.kind === "team") return "Team";
  if (conversation.kind === "group") return conversation.title?.trim() || "Group";
  const otherId = members.find((member) => member.personId !== viewerId)?.personId;
  return names.get(otherId ?? "") ?? "Conversation";
}

export async function unreadChatCount() {
  const ctx = await requireViewer();
  await ensureTeamConversation();
  const directory = await loadDirectory();
  const hideDemo = await hideDemoWorkspace();
  const [conversations, participants] = await Promise.all([
    db.select().from(chatConversations),
    db.select().from(chatParticipants),
  ]);
  const mineByConversation = new Map(participants.filter((row) => row.personId === ctx.person.id).map((row) => [row.conversationId, row]));
  const visible = conversations.filter((conversation) => {
    if (conversation.deletedAt) return false;
    const mine = mineByConversation.get(conversation.id);
    if (conversation.kind === "team") return !mine?.hiddenAt;
    if (mine?.hiddenAt || mine?.leftAt) return false;
    if (conversation.kind === "group") return Boolean(mine);
    if (conversation.kind !== "direct" || !mine) return false;
    if (!hideDemo) return true;
    const others = participants.filter((row) => row.conversationId === conversation.id && row.personId !== ctx.person.id);
    return !others.some((row) => directory.find((person) => person.id === row.personId)?.isDemo);
  });
  let total = 0;
  for (const conversation of visible) {
    const readAt = mineByConversation.get(conversation.id)?.lastReadAt ?? null;
    const unreadWhere = [eq(chatMessages.conversationId, conversation.id), ne(chatMessages.authorId, ctx.person.id), isNull(chatMessages.deletedAt)];
    if (readAt) unreadWhere.push(gt(chatMessages.createdAt, readAt));
    const [unreadRow] = await db.select({ value: count() }).from(chatMessages).where(and(...unreadWhere));
    total += Number(unreadRow?.value ?? 0);
  }
  return total;
}

export async function loadChatPage(conversationId: string | null) {
  const ctx = await requireViewer();
  await ensureTeamConversation();
  const directory = await loadDirectory();
  const names = new Map(directory.map((person) => [person.id, chatPersonName(person)]));
  const hideDemo = await hideDemoWorkspace();
  const [conversations, participants, myStars] = await Promise.all([
    db.select().from(chatConversations),
    db.select().from(chatParticipants),
    db.select().from(chatStars).where(eq(chatStars.personId, ctx.person.id)),
  ]);
  const mineByConversation = new Map(participants.filter((row) => row.personId === ctx.person.id).map((row) => [row.conversationId, row]));
  const visible = conversations.filter((conversation) => {
    if (conversation.deletedAt) return false;
    const mine = mineByConversation.get(conversation.id);
    if (conversation.kind === "team") return !mine?.hiddenAt;
    if (mine?.hiddenAt || mine?.leftAt) return false;
    if (conversation.kind === "group") return Boolean(mine);
    if (conversation.kind !== "direct" || !mine) return false;
    if (!hideDemo) return true;
    const others = participants.filter((row) => row.conversationId === conversation.id && row.personId !== ctx.person.id);
    return !others.some((row) => directory.find((person) => person.id === row.personId)?.isDemo);
  });

  const items: ChatListItem[] = [];
  for (const conversation of visible) {
    const [latest] = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.conversationId, conversation.id), isNull(chatMessages.deletedAt)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    const mine = mineByConversation.get(conversation.id);
    const readAt = mine?.lastReadAt ?? null;
    const unreadWhere = [eq(chatMessages.conversationId, conversation.id), ne(chatMessages.authorId, ctx.person.id), isNull(chatMessages.deletedAt)];
    if (readAt) unreadWhere.push(gt(chatMessages.createdAt, readAt));
    const [unreadRow] = await db.select({ value: count() }).from(chatMessages).where(and(...unreadWhere));
    const members = participants.filter((row) => row.conversationId === conversation.id && !row.leftAt);
    const kind = conversation.kind === "group" ? "group" : conversation.kind === "team" ? "team" : "direct";
    items.push({
      id: conversation.id,
      kind,
      title: conversationTitle(conversation, members, names, ctx.person.id),
      meta: kind === "group" ? `Group · ${members.length} ${members.length === 1 ? "person" : "people"}` : kind === "team" ? "Team" : "Private",
      preview: !latest ? "No messages yet" : latest.authorId === ctx.person.id ? `You: ${clip(latest.body)}` : clip(latest.body),
      updatedAt: latest?.createdAt ?? conversation.updatedAt,
      unread: Number(unreadRow?.value ?? 0),
      pinned: Boolean(mine?.pinned),
    });
  }
  items.sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  const partners = activePartners(directory, ctx.person.id, hideDemo);
  const starredIds = new Set(myStars.map((star) => star.messageId));

  let thread: ChatThread | null = null;
  if (conversationId) {
    const access = await conversationAccess(ctx.person.id, conversationId, directory);
    if (access) {
      const rows = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, access.conversation.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(200);
      rows.reverse();
      const fileIds = rows.map((row) => row.fileId).filter((id): id is string => Boolean(id));
      const fileRows = fileIds.length ? await db.select().from(files).where(inArray(files.id, fileIds)) : [];
      const fileById = new Map(fileRows.map((file) => [file.id, file]));
      const members = access.members.filter((member) => !member.leftAt);
      const canManage = access.conversation.kind === "group" && access.conversation.createdById === ctx.person.id;
      const memberIds = new Set(members.map((member) => member.personId));
      const memberViews: ChatMember[] = members
        .map((member) => ({
          id: member.personId,
          name: names.get(member.personId) ?? "Teammate",
          you: member.personId === ctx.person.id,
          owner: member.personId === access.conversation.createdById,
        }))
        .sort((left, right) => Number(right.owner) - Number(left.owner) || left.name.localeCompare(right.name));
      const pinnedRow = rows.find((row) => row.pinnedAt && !row.deletedAt) ?? null;
      const kind = access.conversation.kind === "group" ? "group" : access.conversation.kind === "team" ? "team" : "direct";
      thread = {
        id: access.conversation.id,
        kind,
        title: conversationTitle(access.conversation, access.members, names, ctx.person.id),
        hint:
          kind === "team"
            ? "Everyone signed in can read this chat."
            : kind === "direct"
              ? "Only the two of you can read this chat."
              : memberViews.map((member) => (member.you ? "You" : member.name)).join(", "),
        chatPinned: Boolean(access.mine?.pinned),
        closeLabel: kind === "team" ? null : canManage ? "Delete group" : kind === "group" ? "Leave group" : "Delete chat",
        canManage,
        members: kind === "group" ? memberViews : [],
        invitees: canManage ? partners.filter((person) => !memberIds.has(person.id)) : [],
        pinnedMessage: pinnedRow
          ? {
              id: pinnedRow.id,
              body: pinnedRow.body.trim() || fileById.get(pinnedRow.fileId ?? "")?.filename || "File",
              authorName: names.get(pinnedRow.authorId) ?? "Teammate",
            }
          : null,
        messages: rows.map((row) => {
          const file = row.fileId ? fileById.get(row.fileId) : undefined;
          const deleted = Boolean(row.deletedAt);
          return {
            id: row.id,
            body: deleted ? "Message deleted" : row.body,
            createdAt: row.createdAt,
            authorName: names.get(row.authorId) ?? "Teammate",
            mine: row.authorId === ctx.person.id,
            deleted,
            canDelete: !deleted && (row.authorId === ctx.person.id || canManage),
            starred: starredIds.has(row.id),
            pinned: Boolean(row.pinnedAt),
            file: !deleted && file ? { id: file.id, filename: file.filename, mimeType: file.mimeType } : null,
          };
        }),
      };
    }
  }

  const starredMessages = myStars.length
    ? await db.select().from(chatMessages).where(inArray(chatMessages.id, myStars.map((star) => star.messageId)))
    : [];
  const starred: StarredMessage[] = [];
  for (const message of starredMessages) {
    if (message.deletedAt) continue;
    const conversation = conversations.find((row) => row.id === message.conversationId);
    if (!conversation || conversation.deletedAt) continue;
    const access = await conversationAccess(ctx.person.id, conversation.id, directory);
    if (!access) continue;
    starred.push({
      id: message.id,
      conversationId: conversation.id,
      conversationTitle: conversationTitle(conversation, access.members, names, ctx.person.id),
      body: message.body.trim() || "File",
      authorName: names.get(message.authorId) ?? "Teammate",
      createdAt: message.createdAt,
    });
  }
  starred.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return {
    canSend: ctx.person.organizationalStatus === "active",
    items,
    partners,
    thread,
    starred,
  };
}

async function notifyPeople(personIds: string[], input: { title: string; body: string; href: string }) {
  for (const personId of personIds) {
    await notify({ personId, title: input.title, body: input.body, href: input.href, kind: "chat" });
  }
}

export async function openDirectConversation(targetId: string) {
  const ctx = await requireViewer();
  if (ctx.person.organizationalStatus !== "active") throw new Error("Your account cannot start a chat.");
  if (targetId === ctx.person.id) throw new Error("Choose another person.");
  const directory = await loadDirectory();
  const target = directory.find((person) => person.id === targetId);
  if (!target || target.organizationalStatus !== "active" || !target.userId) throw new Error("That person cannot be reached in chat.");
  const hideDemo = await hideDemoWorkspace();
  if (hideDemo && target.isDemo) throw new Error("That person cannot be reached in chat.");
  const key = pairKey(ctx.person.id, target.id);
  const [existing] = await db.select().from(chatConversations).where(eq(chatConversations.pairKey, key)).limit(1);
  if (existing) {
    await db
      .update(chatParticipants)
      .set({ hiddenAt: null })
      .where(and(eq(chatParticipants.conversationId, existing.id), eq(chatParticipants.personId, ctx.person.id)));
    return existing.id;
  }
  const createdAt = now();
  const id = newId();
  try {
    await db.insert(chatConversations).values({
      id,
      kind: "direct",
      pairKey: key,
      title: null,
      createdById: ctx.person.id,
      deletedAt: null,
      createdAt,
      updatedAt: createdAt,
    });
  } catch {
    const [again] = await db.select().from(chatConversations).where(eq(chatConversations.pairKey, key)).limit(1);
    if (!again) throw new Error("Unable to open that chat.");
    return again.id;
  }
  await db.insert(chatParticipants).values([
    { id: newId(), conversationId: id, personId: ctx.person.id, lastReadAt: createdAt, pinned: false, createdAt },
    { id: newId(), conversationId: id, personId: target.id, lastReadAt: null, pinned: false, createdAt },
  ]);
  await recordAudit({
    actorId: ctx.person.id,
    action: "chat.started",
    entityType: "chat",
    entityId: id,
    newValue: { kind: "direct", with: target.id },
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "chat.started",
    entityType: "chat",
    entityId: id,
    summary: `${ctx.person.fullName} started a chat with ${target.fullName}.`,
  });
  return id;
}

export async function createGroupConversation(name: string, memberIds: string[]) {
  const ctx = await requireViewer();
  if (ctx.person.organizationalStatus !== "active") throw new Error("Your account cannot create a group.");
  const title = name.trim();
  if (title.length < 2 || title.length > 80) throw new Error("Give the group a name.");
  const directory = await loadDirectory();
  const hideDemo = await hideDemoWorkspace();
  const unique = [...new Set(memberIds.filter((id) => id && id !== ctx.person.id))];
  if (unique.length === 0) throw new Error("Choose at least one teammate.");
  const members = unique.map((id) => directory.find((person) => person.id === id));
  if (members.some((person) => !person || person.organizationalStatus !== "active" || !person.userId || (hideDemo && person.isDemo))) {
    throw new Error("Choose teammates who can join a chat.");
  }
  const chosen = members.filter((person): person is DirectoryPerson => Boolean(person));
  const createdAt = now();
  const id = newId();
  await db.insert(chatConversations).values({
    id,
    kind: "group",
    pairKey: null,
    title,
    createdById: ctx.person.id,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  });
  await db.insert(chatParticipants).values([
    { id: newId(), conversationId: id, personId: ctx.person.id, lastReadAt: createdAt, pinned: false, createdAt },
    ...chosen.map((person) => ({ id: newId(), conversationId: id, personId: person.id, lastReadAt: null, pinned: false, createdAt })),
  ]);
  await recordAudit({
    actorId: ctx.person.id,
    action: "chat.group_created",
    entityType: "chat",
    entityId: id,
    newValue: { title, memberIds: chosen.map((person) => person.id) },
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: "chat.group_created",
    entityType: "chat",
    entityId: id,
    summary: `${ctx.person.fullName} created the group ${title}.`,
  });
  await notifyPeople(chosen.map((person) => person.id), {
    title: `Added to ${title}`,
    body: `${chatPersonName(ctx.person)} added you to this group.`,
    href: `/chats?c=${id}`,
  });
  return id;
}

export async function addGroupMember(conversationId: string, personId: string) {
  const ctx = await requireViewer();
  if (ctx.person.organizationalStatus !== "active") throw new Error("Your account cannot add people.");
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access || access.conversation.kind !== "group" || access.conversation.createdById !== ctx.person.id) {
    throw new Error("Only the person who created the group can add people.");
  }
  const target = directory.find((person) => person.id === personId);
  const hideDemo = await hideDemoWorkspace();
  if (!target || target.organizationalStatus !== "active" || !target.userId || (hideDemo && target.isDemo)) {
    throw new Error("That person cannot join this group.");
  }
  const existing = access.members.find((member) => member.personId === target.id);
  const createdAt = now();
  if (existing) {
    if (!existing.leftAt) throw new Error("That person is already in the group.");
    await db.update(chatParticipants).set({ leftAt: null, hiddenAt: null }).where(eq(chatParticipants.id, existing.id));
  } else {
    await db.insert(chatParticipants).values({
      id: newId(),
      conversationId: access.conversation.id,
      personId: target.id,
      lastReadAt: null,
      pinned: false,
      createdAt,
    });
  }
  await notify({
    personId: target.id,
    title: `Added to ${access.conversation.title || "a group"}`,
    body: `${chatPersonName(ctx.person)} added you to this group.`,
    href: `/chats?c=${access.conversation.id}`,
    kind: "chat",
  });
}

export async function postChatMessage(conversationId: string, body: string, file: File | null) {
  const ctx = await requireViewer();
  if (ctx.person.organizationalStatus !== "active") throw new Error("Your account cannot send messages.");
  const text = body.trim();
  if (!text && !file) throw new Error("Write a message or attach a file.");
  if (text.length > 2000) throw new Error("Keep the message under 2000 characters.");
  if (file && file.size > MAX_FILE_BYTES) throw new Error("Attach a file under 8 MB.");
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  const createdAt = now();
  const messageId = newId();
  let fileId: string | null = null;
  if (file && file.size > 0) {
    const stored = await storeFile(file);
    fileId = newId();
    await db.insert(files).values({
      id: fileId,
      filename: stored.filename,
      mimeType: stored.mimeType || null,
      storageKey: stored.storageKey,
      relatedType: "chat",
      relatedId: messageId,
      category: "chat",
      uploaderId: ctx.person.id,
      version: 1,
      createdAt,
    });
  }
  await db.insert(chatMessages).values({
    id: messageId,
    conversationId: access.conversation.id,
    authorId: ctx.person.id,
    body: text,
    fileId,
    createdAt,
  });
  await db.update(chatConversations).set({ updatedAt: createdAt }).where(eq(chatConversations.id, access.conversation.id));
  await touchRead(access.conversation.id, ctx.person.id, createdAt);
  const preview = text ? (text.length > 140 ? `${text.slice(0, 137)}...` : text) : `Sent a file${file ? `: ${file.name}` : ""}`;
  const titleName = access.conversation.kind === "group" ? access.conversation.title || "Group" : chatPersonName(ctx.person);
  const title = access.conversation.kind === "direct" ? `Message from ${chatPersonName(ctx.person)}` : `Message in ${titleName}`;
  const recipients =
    access.conversation.kind === "team"
      ? directory.filter((person) => person.id !== ctx.person.id && person.organizationalStatus === "active" && person.userId).map((person) => person.id)
      : access.members.filter((member) => member.personId !== ctx.person.id && !member.leftAt).map((member) => member.personId);
  await notifyPeople(recipients, { title, body: preview, href: `/chats?c=${access.conversation.id}` });
  const place = access.conversation.kind === "group"
    ? access.conversation.title || "a group"
    : access.conversation.kind === "team"
      ? "team chat"
      : "a private chat";
  await recordActivity({
    actorId: ctx.person.id,
    action: "chat.message",
    entityType: "chat",
    entityId: access.conversation.id,
    summary: `${ctx.person.fullName} sent a message in ${place}.`,
  });
}

export async function markConversationRead(conversationId: string) {
  const ctx = await requireViewer();
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access) return;
  await touchRead(access.conversation.id, ctx.person.id, now());
}

export async function setChatPinned(conversationId: string, pinned: boolean) {
  const ctx = await requireViewer();
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  if (!access.mine) {
    await db.insert(chatParticipants).values({
      id: newId(),
      conversationId: access.conversation.id,
      personId: ctx.person.id,
      lastReadAt: now(),
      pinned,
      createdAt: now(),
    });
  } else {
    await db.update(chatParticipants).set({ pinned }).where(eq(chatParticipants.id, access.mine.id));
  }
  await recordAudit({
    actorId: ctx.person.id,
    action: pinned ? "chat.pinned" : "chat.unpinned",
    entityType: "chat",
    entityId: access.conversation.id,
    newValue: { pinned },
  });
}

export async function setMessagePinned(conversationId: string, messageId: string, pinned: boolean) {
  const ctx = await requireViewer();
  if (ctx.person.organizationalStatus !== "active") throw new Error("Your account cannot pin messages.");
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  const [message] = await db.select().from(chatMessages).where(and(eq(chatMessages.id, messageId), eq(chatMessages.conversationId, access.conversation.id))).limit(1);
  if (!message || message.deletedAt) throw new Error("That message is not available.");
  await db.update(chatMessages).set({ pinnedAt: null }).where(eq(chatMessages.conversationId, access.conversation.id));
  if (pinned) await db.update(chatMessages).set({ pinnedAt: now() }).where(eq(chatMessages.id, message.id));
  await recordAudit({
    actorId: ctx.person.id,
    action: pinned ? "chat.message_pinned" : "chat.message_unpinned",
    entityType: "chat_message",
    entityId: message.id,
    newValue: { conversationId: access.conversation.id, pinned },
  });
  await recordActivity({
    actorId: ctx.person.id,
    action: pinned ? "chat.message_pinned" : "chat.message_unpinned",
    entityType: "chat",
    entityId: access.conversation.id,
    summary: `${ctx.person.fullName} ${pinned ? "pinned" : "unpinned"} a message.`,
  });
}

export async function setMessageStarred(messageId: string, starred: boolean) {
  const ctx = await requireViewer();
  const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!message || message.deletedAt) throw new Error("That message is not available.");
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, message.conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  const [existing] = await db
    .select()
    .from(chatStars)
    .where(and(eq(chatStars.messageId, message.id), eq(chatStars.personId, ctx.person.id)))
    .limit(1);
  if (starred && !existing) {
    await db.insert(chatStars).values({ id: newId(), messageId: message.id, personId: ctx.person.id, createdAt: now() });
  }
  if (!starred && existing) await db.delete(chatStars).where(eq(chatStars.id, existing.id));
  if (starred !== Boolean(existing)) {
    await recordAudit({
      actorId: ctx.person.id,
      action: starred ? "chat.message_starred" : "chat.message_unstarred",
      entityType: "chat_message",
      entityId: message.id,
      newValue: { starred },
    });
  }
}

export async function deleteChatMessage(messageId: string) {
  const ctx = await requireViewer();
  const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!message || message.deletedAt) throw new Error("That message is not available.");
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, message.conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  const canManage = access.conversation.kind === "group" && access.conversation.createdById === ctx.person.id;
  if (message.authorId !== ctx.person.id && !canManage) throw new Error("You can delete your own messages.");
  await db.update(chatMessages).set({ deletedAt: now(), pinnedAt: null, body: "" }).where(eq(chatMessages.id, message.id));
  await db.delete(chatStars).where(eq(chatStars.messageId, message.id));
  await recordAudit({
    actorId: ctx.person.id,
    action: "chat.message_deleted",
    entityType: "chat_message",
    entityId: message.id,
    previousValue: { conversationId: message.conversationId },
  });
}

export async function closeConversation(conversationId: string) {
  const ctx = await requireViewer();
  const directory = await loadDirectory();
  const access = await conversationAccess(ctx.person.id, conversationId, directory);
  if (!access) throw new Error("That conversation is not available.");
  if (access.conversation.kind === "team") throw new Error("The team chat stays available.");
  if (access.conversation.kind === "group" && access.conversation.createdById === ctx.person.id) {
    await db.update(chatConversations).set({ deletedAt: now() }).where(eq(chatConversations.id, access.conversation.id));
    const others = access.members.filter((member) => member.personId !== ctx.person.id && !member.leftAt).map((member) => member.personId);
    await notifyPeople(others, {
      title: `${access.conversation.title || "Group"} was deleted`,
      body: `${chatPersonName(ctx.person)} deleted this group.`,
      href: "/chats",
    });
    await recordAudit({
      actorId: ctx.person.id,
      action: "chat.group_deleted",
      entityType: "chat",
      entityId: access.conversation.id,
      previousValue: { title: access.conversation.title },
    });
    await recordActivity({
      actorId: ctx.person.id,
      action: "chat.group_deleted",
      entityType: "chat",
      entityId: access.conversation.id,
      summary: `${ctx.person.fullName} deleted the group ${access.conversation.title || "group"}.`,
    });
    return;
  }
  if (access.conversation.kind === "group") {
    if (!access.mine) throw new Error("That conversation is not available.");
    await db.update(chatParticipants).set({ leftAt: now() }).where(eq(chatParticipants.id, access.mine.id));
    await recordActivity({
      actorId: ctx.person.id,
      action: "chat.group_left",
      entityType: "chat",
      entityId: access.conversation.id,
      summary: `${ctx.person.fullName} left the group ${access.conversation.title || "group"}.`,
    });
    return;
  }
  if (!access.mine) throw new Error("That conversation is not available.");
  await db.update(chatParticipants).set({ hiddenAt: now(), pinned: false }).where(eq(chatParticipants.id, access.mine.id));
}

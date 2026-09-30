"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  addGroupMember,
  closeConversation,
  createGroupConversation,
  deleteChatMessage,
  loadChatPage,
  markConversationRead,
  openDirectConversation,
  postChatMessage,
  setChatPinned,
  setMessagePinned,
  setMessageStarred,
} from "@/lib/services/chats";
import { DISPLAY_TZ } from "@/lib/utils";

const idSchema = z.string().uuid();

function parseId(value: unknown, message: string) {
  const parsed = idSchema.safeParse(String(value || ""));
  if (!parsed.success) throw new Error(message);
  return parsed.data;
}

function refreshChats() {
  revalidatePath("/chats");
}

function chatTime(value: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: DISPLAY_TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export async function sendChatMessage(form: FormData) {
  const conversationId = parseId(form.get("conversationId"), "That conversation is not available.");
  const body = String(form.get("body") || "");
  const file = form.get("file");
  await postChatMessage(conversationId, body, file instanceof File && file.size > 0 ? file : null);
  refreshChats();
}

export async function openDirectChat(form: FormData) {
  const personId = parseId(form.get("personId"), "Choose a teammate.");
  const id = await openDirectConversation(personId);
  refreshChats();
  redirect(`/chats?c=${id}`);
}

export async function createGroupChat(form: FormData) {
  const name = String(form.get("name") || "");
  const memberIds = form.getAll("memberIds").map((value) => parseId(value, "Choose teammates who can join a chat."));
  const id = await createGroupConversation(name, memberIds);
  refreshChats();
  redirect(`/chats?c=${id}`);
}

export async function addGroupChatMember(form: FormData) {
  const conversationId = parseId(form.get("conversationId"), "That conversation is not available.");
  const personId = parseId(form.get("personId"), "Choose a teammate.");
  await addGroupMember(conversationId, personId);
  refreshChats();
}

export async function pinChat(conversationId: string, pinned: boolean) {
  await setChatPinned(parseId(conversationId, "That conversation is not available."), pinned === true);
  refreshChats();
}

export async function pinChatMessage(conversationId: string, messageId: string, pinned: boolean) {
  await setMessagePinned(
    parseId(conversationId, "That conversation is not available."),
    parseId(messageId, "That message is not available."),
    pinned === true,
  );
  refreshChats();
}

export async function starChatMessage(messageId: string, starred: boolean) {
  await setMessageStarred(parseId(messageId, "That message is not available."), starred === true);
  refreshChats();
}

export async function removeChatMessage(messageId: string) {
  await deleteChatMessage(parseId(messageId, "That message is not available."));
  refreshChats();
}

export async function removeChat(conversationId: string) {
  await closeConversation(parseId(conversationId, "That conversation is not available."));
  refreshChats();
  redirect("/chats");
}

export async function pollChat(conversationId: string) {
  const parsed = idSchema.safeParse(conversationId);
  if (!parsed.success) return null;
  conversationId = parsed.data;
  await markConversationRead(conversationId);
  const page = await loadChatPage(conversationId);
  if (!page.thread) return null;
  return {
    pinned: page.thread.pinnedMessage
      ? { id: page.thread.pinnedMessage.id, body: page.thread.pinnedMessage.body, authorName: page.thread.pinnedMessage.authorName }
      : null,
    messages: page.thread.messages.map((message) => ({
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
    })),
  };
}

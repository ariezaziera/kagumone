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
  const conversationId = String(form.get("conversationId") || "");
  const body = String(form.get("body") || "");
  const file = form.get("file");
  const parsed = z.object({ conversationId: z.string().min(1) }).safeParse({ conversationId });
  if (!parsed.success) throw new Error("That conversation is not available.");
  await postChatMessage(parsed.data.conversationId, body, file instanceof File && file.size > 0 ? file : null);
  refreshChats();
}

export async function openDirectChat(form: FormData) {
  const personId = String(form.get("personId") || "").trim();
  if (!personId) throw new Error("Choose a teammate.");
  const id = await openDirectConversation(personId);
  refreshChats();
  redirect(`/chats?c=${id}`);
}

export async function createGroupChat(form: FormData) {
  const name = String(form.get("name") || "");
  const memberIds = form.getAll("memberIds").map((value) => String(value));
  const id = await createGroupConversation(name, memberIds);
  refreshChats();
  redirect(`/chats?c=${id}`);
}

export async function addGroupChatMember(form: FormData) {
  const conversationId = String(form.get("conversationId") || "");
  const personId = String(form.get("personId") || "");
  if (!personId) throw new Error("Choose a teammate.");
  await addGroupMember(conversationId, personId);
  refreshChats();
}

export async function pinChat(conversationId: string, pinned: boolean) {
  await setChatPinned(conversationId, pinned);
  refreshChats();
}

export async function pinChatMessage(conversationId: string, messageId: string, pinned: boolean) {
  await setMessagePinned(conversationId, messageId, pinned);
  refreshChats();
}

export async function starChatMessage(messageId: string, starred: boolean) {
  await setMessageStarred(messageId, starred);
  refreshChats();
}

export async function removeChatMessage(messageId: string) {
  await deleteChatMessage(messageId);
  refreshChats();
}

export async function removeChat(conversationId: string) {
  await closeConversation(conversationId);
  refreshChats();
  redirect("/chats");
}

export async function pollChat(conversationId: string) {
  if (!conversationId) return null;
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

import { redirect } from "next/navigation";
import { getAuthContext, hasPermission } from "@/lib/auth/context";
import { AppShell } from "@/components/app-shell";
import { navAttention, notificationPreview } from "@/lib/queries";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?ended=1");
  if (ctx.person.mustChangePassword) redirect("/first-password");
  const [notices, attention] = await Promise.all([
    notificationPreview(ctx.person.id),
    navAttention(ctx.person.id, hasPermission(ctx, "task:approve_extension")),
  ]);
  return (
    <AppShell
      notices={notices}
      attention={{ ...attention, "/notifications": notices.unread }}
      personName={ctx.person.fullName}
      personId={ctx.person.id}
      hasPhoto={Boolean(ctx.person.photoStorageKey)}
      photoVersion={ctx.person.updatedAt.getTime()}
      permissions={ctx.permissionKeys}
      isDev={process.env.NODE_ENV !== "production"}
    >
      {children}
    </AppShell>
  );
}

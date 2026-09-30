import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { AppShell } from "@/components/app-shell";
import { notificationPreview } from "@/lib/queries";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?ended=1");
  if (ctx.person.mustChangePassword) redirect("/first-password");
  const notices = await notificationPreview(ctx.person.id);
  return (
    <AppShell
      notices={notices}
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

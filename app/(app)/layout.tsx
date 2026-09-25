import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { AppShell } from "@/components/app-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return (
    <AppShell
      personName={ctx.person.fullName}
      permissions={ctx.permissionKeys}
      isDev={process.env.NODE_ENV !== "production"}
    >
      {children}
    </AppShell>
  );
}

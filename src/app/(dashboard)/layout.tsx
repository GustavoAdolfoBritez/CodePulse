import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentOrganizationContext } from "@/lib/current-org";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentOrganizationContext();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar organizationName={context?.organization.name} userName={context?.user.name} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getCurrentOrganizationContext } from "@/lib/current-org";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentOrganizationContext();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} enableColorScheme={false}>
      <div className="flex min-h-screen flex-col bg-zinc-50 md:flex-row dark:bg-zinc-950">
        <Sidebar organizationName={context?.organization.name} userName={context?.user.name} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ThemeProvider>
  );
}

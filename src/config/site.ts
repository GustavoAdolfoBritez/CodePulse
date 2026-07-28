import {
  LayoutGrid,
  FolderGit2,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const siteConfig = {
  name: "CodePulse",
  description:
    "Plataforma de auditoría e insights automatizados para repositorios y APIs.",
  navSections: [
    {
      label: "Main Navigation",
      items: [{ label: "Overview", href: "/dashboard", icon: LayoutGrid }],
    },
    {
      label: "Analytics & Insights",
      items: [
        { label: "Projects", href: "/dashboard/projects", icon: FolderGit2 },
        { label: "Insights", href: "/dashboard/insights", icon: Sparkles },
      ],
    },
  ] satisfies NavSection[],
  supportItems: [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ] satisfies NavItem[],
};

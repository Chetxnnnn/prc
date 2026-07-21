"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Separator orientation="vertical" className="h-6 lg:hidden" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

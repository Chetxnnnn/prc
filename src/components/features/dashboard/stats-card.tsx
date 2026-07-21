import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "success";
}

export function StatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-md",
              variant === "warning" && "bg-warning/10 text-warning",
              variant === "success" && "bg-success/10 text-success",
              variant === "default" && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

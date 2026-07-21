import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, IndianRupee, Upload, UserPlus, BarChart3 } from "lucide-react";

interface QuickActionsProps {
  isAdmin: boolean;
}

const actions = [
  {
    label: "Mark attendance",
    href: "/attendance",
    icon: CalendarCheck,
    color: "bg-primary/10 text-primary",
    show: true,
  },
  {
    label: "Add student",
    href: "/students?action=new",
    icon: UserPlus,
    color: "bg-primary/10 text-primary",
    show: true,
  },
  {
    label: "Upload CSV",
    href: "/students",
    icon: Upload,
    color: "bg-primary/10 text-primary",
    show: true,
  },
  {
    label: "Record payment",
    href: "/fees",
    icon: IndianRupee,
    color: "bg-success/10 text-success",
    show: true,
  },
  {
    label: "View students",
    href: "/students",
    icon: Users,
    color: "bg-primary/10 text-primary",
    show: true,
  },
  {
    label: "Fee collection",
    href: "/fees",
    icon: BarChart3,
    color: "bg-success/10 text-success",
    show: true,
  },
];

export function QuickActions({ isAdmin }: QuickActionsProps) {
  const visibleActions = actions.filter((a) => a.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className={`p-2 rounded-md ${action.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

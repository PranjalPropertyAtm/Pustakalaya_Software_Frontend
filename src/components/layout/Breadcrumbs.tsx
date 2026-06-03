import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  register: "Register",
  seats: "Seat Map",
  plans: "Plans",
  payments: "Payments",
  renewals: "Renewals",
  reports: "Reports",
  notifications: "Notifications",
  branches: "Branches",
  counsellors: "Counsellors",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const isLast = i === segments.length - 1;
    const label =
      routeLabels[seg] ??
      (seg.length > 20 ? `${seg.slice(0, 8)}…` : seg.charAt(0).toUpperCase() + seg.slice(1));
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn("hidden md:flex items-center gap-1 min-w-0", typography.breadcrumb)}>
      <Link to="/dashboard" className="hover:text-foreground transition-colors shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          {c.isLast ? (
            <span className={cn(typography.breadcrumbCurrent, "truncate")}>{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-foreground transition-colors truncate">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  CreditCard,
  RefreshCw,
  BarChart3,
  Package,
  Bell,
  Building2,
  UserCog,
  UserPlus,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: "all", prefetch: () => import("@/pages/dashboard/DashboardPage") },
  { to: "/branches", label: "Branches", icon: Building2, roles: "super", prefetch: () => import("@/pages/branches/BranchesPage") },
  { to: "/counsellors", label: "Counsellors", icon: UserCog, roles: "super", prefetch: () => import("@/pages/counsellors/CounsellorsPage") },
  { to: "/students", label: "Students", icon: Users, roles: "all", prefetch: () => import("@/pages/students/StudentsPage") },
  { to: "/students/register", label: "Register", icon: UserPlus, roles: "staff", prefetch: () => import("@/pages/students/StudentRegisterPage") },
  { to: "/seats", label: "Seat Map", icon: Grid3X3, roles: "all", prefetch: () => import("@/pages/seats/SeatsPage") },
  { to: "/plans", label: "Plans", icon: Package, roles: "all", prefetch: () => import("@/pages/plans/PlansPage") },
  { to: "/payments", label: "Payments", icon: CreditCard, roles: "all", prefetch: () => import("@/pages/payments/PaymentsPage") },
  { to: "/renewals", label: "Renewals", icon: RefreshCw, roles: "all", prefetch: () => import("@/pages/renewals/RenewalsPage") },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: "all", prefetch: () => import("@/pages/reports/ReportsPage") },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: "all", prefetch: () => import("@/pages/notifications/NotificationsPage") },
];

function canSee(role: string | undefined, itemRoles: string) {
  if (itemRoles === "all") return true;
  if (itemRoles === "staff") {
    return role === ROLES.SUPER_ADMIN || role === ROLES.COUNSELLOR || role === ROLES.BRANCH_COUNSELLOR;
  }
  if (itemRoles === "super") return role === ROLES.SUPER_ADMIN;
  return true;
}

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

function SidebarInner({ onNavigate, collapsed: collapsedProp }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const storeCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const collapsed = collapsedProp ?? storeCollapsed;

  const visibleItems = navItems.filter((item) => canSee(user?.role, item.roles));

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/80 bg-card transition-[width] duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/60 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed ? (
          <Logo variant="icon" />
        ) : (
          <>
            <Logo className="min-w-0" />
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 shrink-0"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {collapsed && (
        <div className="hidden lg:flex justify-center py-2 border-b border-border/40">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar} aria-label="Expand sidebar">
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleItems.map(({ to, label, icon: Icon, prefetch }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/students"}
            onClick={onNavigate}
            onMouseEnter={() => void prefetch()}
            onFocus={() => void prefetch()}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                typography.navItem,
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-border/60 p-3">
          <p className={cn("truncate px-2", typography.navUserName)}>{user?.fullName}</p>
          <p className={cn("truncate px-2", typography.navUserRole)}>
            {user?.role?.replace(/_/g, " ")}
          </p>
        </div>
      )}
    </aside>
  );
}

export const Sidebar = memo(SidebarInner);

import { lazy, Suspense, memo, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useBranchContext } from "@/hooks/useBranchContext";
import { useUiStore } from "@/stores/uiStore";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/common/PageLoader";

const SocketProvider = lazy(() => import("@/components/layout/SocketProvider"));
const CreateBranchDialog = lazy(() =>
  import("@/features/branches/CreateBranchDialog").then((m) => ({ default: m.CreateBranchDialog }))
);

function AppShellInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const { requiresBranchSelection } = useBranchContext();

  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={null}>
        <SocketProvider />
      </Suspense>
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative h-full w-64 bg-card shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className={cn("flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto")}>
          {requiresBranchSelection ? (
            <Card className="max-w-lg mx-auto mt-12">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <Building2 className="h-12 w-12 text-primary" aria-hidden />
                <div>
                  <h2 className={typography.sectionTitle}>Select a branch</h2>
                  <p className={cn(typography.pageDescription, "mt-1 max-w-none")}>
                    Choose a branch from the header, or create one to get started.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Suspense fallback={<Button disabled>Create branch</Button>}>
                    <CreateBranchDialog trigger={<Button>Create branch</Button>} />
                  </Suspense>
                  <Button variant="outline" asChild>
                    <Link to="/branches">View all branches</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export const AppShell = memo(AppShellInner);

/** Suspense wrapper for lazy-loaded shell. */
export function AppShellLoader() {
  return (
    <Suspense fallback={<PageLoader className="min-h-screen" withStats />}>
      <AppShell />
    </Suspense>
  );
}

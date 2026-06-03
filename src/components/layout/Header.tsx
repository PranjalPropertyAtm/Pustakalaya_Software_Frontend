import { memo } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BranchSelector } from "@/components/layout/BranchSelector";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { UserMenu } from "@/components/layout/UserMenu";
import { useBranchContext } from "@/hooks/useBranchContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

function HeaderInner({ onMenuClick }: HeaderProps) {
  const { isSuperAdmin } = useBranchContext();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/80 bg-card/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 shrink-0"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Breadcrumbs />
      <div className="flex-1" />
      <div className="flex items-center gap-1 sm:gap-2">
        {isSuperAdmin && <BranchSelector />}
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

export const Header = memo(HeaderInner);

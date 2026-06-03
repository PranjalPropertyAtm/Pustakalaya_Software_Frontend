import { Outlet } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-16 sm:h-20 max-w-[320px]" />
          <p className={cn(typography.bodyMedium, "mt-2 text-secondary")}>नया भारत शिक्षित भारत</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

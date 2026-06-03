import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PageLoader } from "@/components/common/PageLoader";
import { ROLES } from "@/lib/constants";

const AppShellLoader = lazy(() =>
  import("@/components/layout/AppShell").then((m) => ({ default: m.AppShellLoader }))
);

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const StudentsPage = lazy(() => import("@/pages/students/StudentsPage"));
const StudentRegisterPage = lazy(() => import("@/pages/students/StudentRegisterPage"));
const StudentDetailPage = lazy(() => import("@/pages/students/StudentDetailPage"));
const SeatsPage = lazy(() => import("@/pages/seats/SeatsPage"));
const PlansPage = lazy(() => import("@/pages/plans/PlansPage"));
const PaymentsPage = lazy(() => import("@/pages/payments/PaymentsPage"));
const RenewalsPage = lazy(() => import("@/pages/renewals/RenewalsPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage"));
const BranchesPage = lazy(() => import("@/pages/branches/BranchesPage"));
const CounsellorsPage = lazy(() => import("@/pages/counsellors/CounsellorsPage"));

function Lazy({ children, withStats }: { children: React.ReactNode; withStats?: boolean }) {
  return (
    <Suspense fallback={<PageLoader className="min-h-[40vh]" withStats={withStats} />}>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Lazy><LoginPage /></Lazy> },
      { path: "forgot-password", element: <Lazy><ForgotPasswordPage /></Lazy> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader className="min-h-screen" />}>
          <AppShellLoader />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <Lazy withStats><DashboardPage /></Lazy> },
      {
        path: "branches",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <Lazy><BranchesPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: "counsellors",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <Lazy><CounsellorsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      { path: "students", element: <Lazy withStats><StudentsPage /></Lazy> },
      {
        path: "students/register",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR]}>
            <Lazy><StudentRegisterPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      { path: "students/:studentId", element: <Lazy><StudentDetailPage /></Lazy> },
      { path: "seats", element: <Lazy><SeatsPage /></Lazy> },
      { path: "plans", element: <Lazy><PlansPage /></Lazy> },
      { path: "payments", element: <Lazy><PaymentsPage /></Lazy> },
      { path: "renewals", element: <Lazy withStats><RenewalsPage /></Lazy> },
      { path: "reports", element: <Lazy withStats><ReportsPage /></Lazy> },
      { path: "notifications", element: <Lazy><NotificationsPage /></Lazy> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

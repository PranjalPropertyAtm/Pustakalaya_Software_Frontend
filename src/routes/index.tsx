import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { HomeRedirect } from "@/routes/HomeRedirect";
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
const EnquiriesPage = lazy(() => import("@/pages/enquiries/EnquiriesPage"));
const EnquiryCreatePage = lazy(() => import("@/pages/enquiries/EnquiryCreatePage"));
const EnquiryDetailPage = lazy(() => import("@/pages/enquiries/EnquiryDetailPage"));
const EnquiryReportsPage = lazy(() => import("@/pages/enquiries/EnquiryReportsPage"));

const libraryStaffRoles = [ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR] as const;

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
    element: <HomeRedirect />,
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
      { path: "students", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy withStats><StudentsPage /></Lazy>
          </ProtectedRoute>
        ) },
      {
        path: "students/register",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR]}>
            <Lazy><StudentRegisterPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      { path: "students/:studentId", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy><StudentDetailPage /></Lazy>
          </ProtectedRoute>
        ) },
      {
        path: "enquiries",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR]}>
            <Lazy withStats><EnquiriesPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: "enquiries/new",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR]}>
            <Lazy><EnquiryCreatePage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: "enquiries/reports",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <Lazy withStats><EnquiryReportsPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      {
        path: "enquiries/:enquiryId",
        element: (
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.BRANCH_COUNSELLOR]}>
            <Lazy><EnquiryDetailPage /></Lazy>
          </ProtectedRoute>
        ),
      },
      { path: "seats", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy><SeatsPage /></Lazy>
          </ProtectedRoute>
        ) },
      { path: "plans", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy><PlansPage /></Lazy>
          </ProtectedRoute>
        ) },
      { path: "payments", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy><PaymentsPage /></Lazy>
          </ProtectedRoute>
        ) },
      { path: "renewals", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy withStats><RenewalsPage /></Lazy>
          </ProtectedRoute>
        ) },
      { path: "reports", element: (
          <ProtectedRoute roles={[...libraryStaffRoles]}>
            <Lazy withStats><ReportsPage /></Lazy>
          </ProtectedRoute>
        ) },
      { path: "notifications", element: <Lazy><NotificationsPage /></Lazy> },
    ],
  },
  { path: "*", element: <HomeRedirect /> },
]);

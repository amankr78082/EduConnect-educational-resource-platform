import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

type Role = "admin" | "teacher" | "maintenance" | "student";

interface RoleRouteProps {
  children: ReactNode;
  /** Allowed roles. Admin always allowed. If empty, any authenticated user. */
  allow?: Role[];
}

/** Route guard — redirects unauthenticated users to /auth and disallowed roles to /dashboard. */
const RoleRoute = ({ children, allow }: RoleRouteProps) => {
  const { user, roles, isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!allow || allow.length === 0) return <>{children}</>;
  if (isAdmin) return <>{children}</>;
  const ok = allow.some((r) => roles.includes(r));
  if (!ok) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default RoleRoute;



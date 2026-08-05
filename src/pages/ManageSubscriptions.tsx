import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/layout/Navbar";
import AdminSubscriptionManager from "@/components/admin/AdminSubscriptionManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown } from "lucide-react";

const ManageSubscriptions = () => {
  const { user, isTeacher, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isTeacher)) {
      navigate(user ? "/dashboard" : "/auth");
    }
  }, [user, isTeacher, loading, navigate]);

  if (loading || !user || !isTeacher) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Subscription Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and approve student premium subscription requests
          </p>
        </div>

        <AdminSubscriptionManager />
      </main>
    </div>
  );
};

export default ManageSubscriptions;



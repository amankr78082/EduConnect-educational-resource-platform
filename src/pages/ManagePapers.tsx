import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/layout/Navbar";
import PaperUploadForm from "@/components/papers/PaperUploadForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ManagePapers = () => {
  const { user, isTeacher, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isTeacher)) navigate("/dashboard");
  }, [user, isTeacher, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold font-display mb-6">Manage Previous Year Papers</h1>
        <PaperUploadForm />
      </main>
    </div>
  );
};

export default ManagePapers;


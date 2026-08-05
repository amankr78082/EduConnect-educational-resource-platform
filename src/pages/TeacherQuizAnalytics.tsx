import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import QuizAnalyticsDashboard from "@/components/quiz/QuizAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TeacherQuizAnalytics = () => {
  const navigate = useNavigate();
  const { user, isTeacher, loading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await mysqlClient.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !isTeacher) {
      navigate("/dashboard");
    }
  }, [loading, isTeacher, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/teacher/quizzes")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quiz Management
          </Button>
          <h1 className="text-3xl font-bold font-display">Quiz Analytics</h1>
          <p className="text-muted-foreground">
            View performance statistics for your quizzes
          </p>
        </div>

        <QuizAnalyticsDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default TeacherQuizAnalytics;



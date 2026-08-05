import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import QuizBrowser from "@/components/quiz/QuizBrowser";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";

const Quizzes = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 mt-20 max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Quiz Arena</h1>
            <p className="text-sm text-muted-foreground">
              Practice syllabus quizzes with timer, score, corrections, and leaderboard.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <QuizBrowser />
      </main>
      <Footer />
    </div>
  );
};

export default Quizzes;



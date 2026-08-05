import { Navigate, useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import TakeQuiz from "@/components/quiz/TakeQuiz";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";

const QuizTake = () => {
  const { quizId } = useParams<{ quizId: string }>();
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

  if (!quizId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff_45%,#f8fafc)]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/quizzes")}
          className="mb-5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>

        <TakeQuiz quizId={quizId} />
      </main>
    </div>
  );
};

export default QuizTake;



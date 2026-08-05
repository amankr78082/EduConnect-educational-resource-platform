import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import QuizForm from "@/components/quiz/QuizForm";
import QuizList from "@/components/quiz/QuizList";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft, Plus, List, BarChart3 } from "lucide-react";

const TeacherQuizzes = () => {
  const navigate = useNavigate();
  const { isTeacher, isAdmin, loading: isLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("list");
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

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
    if (!isLoading && !isTeacher && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isTeacher, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isTeacher && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display">Quiz Management</h1>
              <p className="text-muted-foreground">
                Create and manage MCQ quizzes for your students
              </p>
            </div>
            <Button onClick={() => navigate("/teacher/quiz-analytics")} variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              My Quizzes
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              {editingQuizId ? "Edit Quiz" : "Create Quiz"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <QuizList onEdit={(quizId) => {
              setEditingQuizId(quizId);
              setActiveTab("create");
            }} />
          </TabsContent>

          <TabsContent value="create">
            <QuizForm
              quizId={editingQuizId}
              onSuccess={() => {
                setEditingQuizId(null);
                setActiveTab("list");
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherQuizzes;



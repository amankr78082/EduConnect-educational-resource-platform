import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Clock, FileText, Trash2, Eye, EyeOff, Pencil } from "lucide-react";

interface Quiz {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  difficulty_level: number;
  is_published: boolean;
  created_at: string;
  subjects: {
    name: string;
    code: string;
    semester: number;
  } | null;
  questions: { id: string }[];
}

const DIFFICULTY_LABELS = ["Beginner", "Intermediate", "Advanced"];
const DIFFICULTY_COLORS = ["bg-green-500", "bg-yellow-500", "bg-red-500"];

interface QuizListProps {
  onEdit?: (quizId: string) => void;
}

const QuizList = ({ onEdit }: QuizListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const quizRows = (data || []) as Omit<Quiz, "subjects" | "questions">[];
      const quizIds = quizRows.map((quiz) => quiz.id);
      const subjectIds = [...new Set(quizRows.map((quiz) => quiz.subject_id).filter(Boolean))];

      const [subjectRes, questionRes] = await Promise.all([
        subjectIds.length ? mysqlClient.from("subjects").select("id, name, code, semester").in("id", subjectIds) : { data: [] },
        quizIds.length ? mysqlClient.from("questions").select("id, quiz_id").in("quiz_id", quizIds) : { data: [] },
      ]);

      const subjectById = new Map((subjectRes.data || []).map((subject: any) => [subject.id, subject]));
      const questionsByQuiz = new Map<string, { id: string }[]>();
      (questionRes.data || []).forEach((question: any) => {
        questionsByQuiz.set(question.quiz_id, [...(questionsByQuiz.get(question.quiz_id) || []), { id: question.id }]);
      });

      return quizRows.map((quiz) => ({
        ...quiz,
        subjects: subjectById.get(quiz.subject_id) || null,
        questions: questionsByQuiz.get(quiz.id) || [],
      })) as Quiz[];
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { error } = await mysqlClient
        .from("quizzes")
        .update({ is_published: !isPublished })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz updated" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mysqlClient.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz deleted" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!quizzes?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">No quizzes yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{quiz.title}</h3>
                  <Badge variant={quiz.is_published ? "default" : "secondary"} className="text-xs">
                    {quiz.is_published ? "Live" : "Draft"}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${DIFFICULTY_COLORS[quiz.difficulty_level]}`} 
                       title={DIFFICULTY_LABELS[quiz.difficulty_level]} />
                </div>
                {quiz.subjects && (
                  <p className="text-xs text-muted-foreground">
                    {quiz.subjects.name} • Sem {quiz.subjects.semester}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {quiz.questions?.length || 0} Qs
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {quiz.time_limit_minutes}m
                  </span>
                  <span>{DIFFICULTY_LABELS[quiz.difficulty_level]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(quiz.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    togglePublishMutation.mutate({
                      id: quiz.id,
                      isPublished: quiz.is_published,
                    })
                  }
                  disabled={togglePublishMutation.isPending}
                >
                  {quiz.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this quiz?")) {
                      deleteQuizMutation.mutate(quiz.id);
                    }
                  }}
                  disabled={deleteQuizMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizList;



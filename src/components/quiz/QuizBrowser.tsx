import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubscription } from "@/hooks/useSubscription";
import { BarChart3, CheckCircle2, Clock, Crown, FileQuestion, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  difficulty_level: number;
  subjects: {
    name: string;
    code: string;
    semester: number;
  } | null;
  questions: { id: string; marks: number }[];
}

interface QuizAttempt {
  quiz_id: string;
  is_completed: boolean;
  score: number | null;
  total_marks: number | null;
  total_questions: number | null;
}

interface LeaderboardRow {
  userId: string;
  name: string;
  score: number;
  total: number;
  quizzes: number;
  percent: number;
}

const DIFFICULTY_LABELS = ["Beginner", "Intermediate", "Advanced"];
const FREE_QUESTION_LIMIT = 20;
const SECONDS_PER_QUESTION = 20;

const QuizBrowser = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [view, setView] = useState<"quizzes" | "leaderboard">("quizzes");
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    mysqlClient.auth.getUser().then(({ data: { user } }) => setUserId(user?.id));
  }, []);

  const subscription = useSubscription(userId);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["published-quizzes"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("quizzes")
        .select("id, subject_id, title, difficulty_level, is_published, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const quizRows = (data || []) as any[];
      const quizIds = quizRows.map((quiz) => quiz.id);
      const subjectIds = [...new Set(quizRows.map((quiz) => quiz.subject_id).filter(Boolean))];

      const [subjectRes, questionRes] = await Promise.all([
        subjectIds.length
          ? mysqlClient.from("subjects").select("id, name, code, semester").in("id", subjectIds)
          : { data: [] },
        quizIds.length
          ? mysqlClient.from("questions").select("id, quiz_id, marks").in("quiz_id", quizIds)
          : { data: [] },
      ]);

      const subjectById = new Map((subjectRes.data || []).map((subject: any) => [subject.id, subject]));
      const questionsByQuiz = new Map<string, { id: string; marks: number }[]>();

      (questionRes.data || []).forEach((question: any) => {
        questionsByQuiz.set(question.quiz_id, [
          ...(questionsByQuiz.get(question.quiz_id) || []),
          { id: question.id, marks: question.marks || 1 },
        ]);
      });

      return quizRows.map((quiz) => ({
        ...quiz,
        subjects: subjectById.get(quiz.subject_id) || null,
        questions: questionsByQuiz.get(quiz.id) || [],
      })) as Quiz[];
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["my-quiz-attempts"],
    queryFn: async () => {
      const { data: { user } } = await mysqlClient.auth.getUser();
      if (!user) return [];

      const { data, error } = await mysqlClient
        .from("quiz_attempts")
        .select("quiz_id, is_completed, score, total_marks, total_questions")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as QuizAttempt[];
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["quiz-leaderboard"],
    queryFn: async () => {
      const { data: attemptRows, error } = await mysqlClient
        .from("quiz_attempts")
        .select("user_id, score, total_marks, total_questions, is_completed")
        .eq("is_completed", true);

      if (error) throw error;

      const grouped = new Map<string, { score: number; total: number; quizzes: number }>();
      (attemptRows || []).forEach((attempt: any) => {
        if (!attempt.user_id) return;
        const current = grouped.get(attempt.user_id) || { score: 0, total: 0, quizzes: 0 };
        current.score += Number(attempt.score || 0);
        current.total += Number(attempt.total_marks || attempt.total_questions || 0);
        current.quizzes += 1;
        grouped.set(attempt.user_id, current);
      });

      const userIds = Array.from(grouped.keys());
      const { data: profiles } = userIds.length
        ? await mysqlClient.from("profiles").select("user_id, full_name").in("user_id", userIds)
        : { data: [] };
      const profileById = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.full_name || "Student"]));

      return userIds
        .map((id) => {
          const row = grouped.get(id)!;
          return {
            userId: id,
            name: profileById.get(id) || "Student",
            score: row.score,
            total: row.total,
            quizzes: row.quizzes,
            percent: row.total ? Math.round((row.score / row.total) * 100) : 0,
          };
        })
        .sort((a, b) => b.percent - a.percent || b.score - a.score)
        .slice(0, 10) as LeaderboardRow[];
    },
  });

  const attemptsMap = new Map(attempts?.map((attempt) => [attempt.quiz_id, attempt]));
  const semesters = [...new Set(quizzes?.map((quiz) => quiz.subjects?.semester).filter(Boolean))].sort();

  const filteredQuizzes = quizzes?.filter((quiz) => {
    if (selectedSemester !== "all" && quiz.subjects?.semester !== Number(selectedSemester)) return false;
    if (selectedLevel !== "all" && quiz.difficulty_level !== Number(selectedLevel)) return false;
    return true;
  });

  if (isLoading || subscription.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester} value={String(semester)}>
                  Semester {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {DIFFICULTY_LABELS.map((label, index) => (
                <SelectItem key={label} value={String(index)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant={view === "quizzes" ? "default" : "outline"} size="sm" onClick={() => setView("quizzes")}>
            <FileQuestion className="mr-2 h-4 w-4" />
            Quizzes
          </Button>
          <Button variant={view === "leaderboard" ? "default" : "outline"} size="sm" onClick={() => setView("leaderboard")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      {view === "leaderboard" ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="grid grid-cols-[70px_1fr_110px_120px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Rank</span>
            <span>Student</span>
            <span>Score</span>
            <span>Quizzes</span>
          </div>
          {!leaderboard?.length ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No completed quiz records yet.</div>
          ) : (
            <div className="divide-y">
              {leaderboard.map((row, index) => (
                <div key={row.userId} className="grid grid-cols-[70px_1fr_110px_120px] gap-3 px-4 py-3 text-sm">
                  <span className="font-semibold">#{index + 1}</span>
                  <span className="truncate">{row.name}</span>
                  <span className="font-semibold">{row.percent}%</span>
                  <span className="text-muted-foreground">{row.quizzes}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !filteredQuizzes?.length ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileQuestion className="mx-auto mb-2 h-9 w-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No quizzes available for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => {
            const attempt = attemptsMap.get(quiz.id);
            const semester = quiz.subjects?.semester || 1;
            const hasPremium = subscription.hasPremium(semester);
            const visibleQuestions = hasPremium ? quiz.questions.length : Math.min(FREE_QUESTION_LIMIT, quiz.questions.length);
            const lockedQuestions = Math.max(0, quiz.questions.length - visibleQuestions);
            const totalMarks = quiz.questions.reduce((sum, question) => sum + question.marks, 0);
            const percentage = attempt?.is_completed
              ? Math.round(((attempt.score || 0) / (attempt.total_marks || attempt.total_questions || 1)) * 100)
              : null;

            return (
              <Card key={quiz.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex min-h-[76px] flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 font-semibold leading-snug">{quiz.title}</h3>
                      {attempt?.is_completed && (
                        <Badge className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {percentage}%
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {quiz.subjects?.code || "Subject"} • Sem {semester}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-bold">{visibleQuestions}</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-bold">{SECONDS_PER_QUESTION}s</p>
                      <p className="text-xs text-muted-foreground">Per Q</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-bold">{totalMarks}</p>
                      <p className="text-xs text-muted-foreground">Marks</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{DIFFICULTY_LABELS[quiz.difficulty_level] || "Practice"}</Badge>
                    {hasPremium ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Crown className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    ) : lockedQuestions > 0 ? (
                      <Badge variant="secondary">{lockedQuestions} locked</Badge>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>

                  <Button className="mt-5 h-10 w-full" onClick={() => navigate(`/quiz/${quiz.id}`)}>
                    <Play className="mr-2 h-4 w-4" />
                    {attempt ? "Open Quiz" : "Start Quiz"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizBrowser;

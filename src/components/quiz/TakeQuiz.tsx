import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface Question {
  id: string;
  question_text: string;
  marks: number;
  question_order: number;
  options: {
    id: string;
    option_text: string;
    option_order: number;
    is_correct: boolean;
  }[];
}

interface TakeQuizProps {
  quizId: string;
}

interface AnswerResult {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
}

const DIFFICULTY_LABELS = ["Beginner", "Intermediate", "Advanced"];
const SECONDS_PER_QUESTION = 20;
const FREE_QUESTION_LIMIT = 20;

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong";
};

const toMysqlDateTime = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");
};

const getAccessibleQuestions = (quizData: any, hasPremiumAccess: boolean) => {
  const questions = (quizData?.questions || []) as Question[];
  return hasPremiumAccess ? questions : questions.slice(0, FREE_QUESTION_LIMIT);
};

const TakeQuiz = ({ quizId }: TakeQuizProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [results, setResults] = useState<{
    score: number;
    totalMarks: number;
    answers: AnswerResult[];
  } | null>(null);

  useEffect(() => {
    mysqlClient.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const subscription = useSubscription(userId);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (error) throw new Error(toErrorMessage(error));

      const quizData = data as any;
      const [subjectRes, questionRes] = await Promise.all([
        mysqlClient
          .from("subjects")
          .select("id, name, code, semester")
          .eq("id", quizData.subject_id)
          .maybeSingle(),
        mysqlClient
          .from("questions")
          .select("id, quiz_id, question_text, marks, question_order")
          .eq("quiz_id", quizId)
          .order("question_order", { ascending: true }),
      ]);

      const questionRows = (questionRes.data || []) as Question[];
      const questionIds = questionRows.map((question) => question.id);
      const { data: optionRows } = questionIds.length
        ? await mysqlClient
            .from("options")
            .select("id, question_id, option_text, option_order, is_correct")
            .in("question_id", questionIds)
            .order("option_order", { ascending: true })
        : { data: [] };

      const optionsByQuestion = new Map<string, Question["options"]>();
      (optionRows || []).forEach((option: any) => {
        optionsByQuestion.set(option.question_id, [
          ...(optionsByQuestion.get(option.question_id) || []),
          {
            id: option.id,
            option_text: option.option_text,
            option_order: option.option_order,
            is_correct: Boolean(option.is_correct),
          },
        ]);
      });

      const sortedQuestions = questionRows
        .sort((a, b) => a.question_order - b.question_order)
        .map((question) => ({
          ...question,
          options: (optionsByQuestion.get(question.id) || []).sort(
            (a, b) => a.option_order - b.option_order,
          ),
        }));

      return { ...quizData, subjects: subjectRes.data || null, questions: sortedQuestions };
    },
  });

  const { data: existingAttempt } = useQuery({
    queryKey: ["quiz-attempt", quizId],
    queryFn: async () => {
      const {
        data: { user },
      } = await mysqlClient.auth.getUser();
      if (!user) return null;

      const { data, error } = await mysqlClient
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(toErrorMessage(error));
      if (!data) return null;

      const { data: answers } = await mysqlClient
        .from("student_answers")
        .select("*")
        .eq("attempt_id", (data as any).id);

      return { ...(data as any), student_answers: answers || [] };
    },
    enabled: !!quizId,
  });

  useEffect(() => {
    if (!existingAttempt) return;

    const answerMap: Record<string, string> = {};
    const uniqueAnswers = new Map<string, AnswerResult>();

    existingAttempt.student_answers?.forEach(
      (answer: { question_id: string; selected_option_id: string | null; is_correct: boolean }) => {
        if (answer.selected_option_id) {
          answerMap[answer.question_id] = answer.selected_option_id;
        }
        const question = ((quiz as any)?.questions || []).find((q: Question) => q.id === answer.question_id);
        const correctOption = question?.options.find((option: Question["options"][number]) => option.is_correct);
        uniqueAnswers.set(answer.question_id, {
          questionId: answer.question_id,
          selectedOptionId: answer.selected_option_id || null,
          correctOptionId: correctOption?.id || null,
          isCorrect: Boolean(answer.is_correct),
        });
      },
    );

    if (existingAttempt.is_completed) {
      setSelectedAnswers(answerMap);
      setIsSubmitted(true);
      setAttemptId(existingAttempt.id);
      setResults({
        score: existingAttempt.score || 0,
        totalMarks: existingAttempt.total_marks || existingAttempt.total_questions || 0,
        answers: Array.from(uniqueAnswers.values()),
      });
      return;
    }

    setAttemptId(existingAttempt.id);
    setSelectedAnswers({});
    setTimeLeft(SECONDS_PER_QUESTION);
  }, [existingAttempt, quiz]);

  const semester = (quiz as any)?.subjects?.semester || 1;
  const canTake = subscription.canTakeQuiz(semester);
  const limit = subscription.getQuizLimit(semester);
  const isPremium = subscription.hasPremium(semester);

  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await mysqlClient.auth.getUser();
      if (!user) throw new Error("Please login before starting the quiz.");
      if (!canTake) throw new Error("Premium access is required for the full quiz bank.");

      const { data, error } = await mysqlClient
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(toErrorMessage(error));
      return data as { id: string };
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      setTimeLeft(SECONDS_PER_QUESTION);
    },
    onError: (error) => {
      toast({
        title: "Quiz could not start",
        description: toErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId || !quiz) throw new Error("Quiz attempt is not ready.");

      const questions = getAccessibleQuestions(quiz, isPremium);
      let score = 0;
      let totalMarks = 0;

      const answerResults = questions.map((question) => {
        totalMarks += question.marks;
        const selectedOptionId = selectedAnswers[question.id] || null;
        const correctOption = question.options.find((option) => option.is_correct);
        const isCorrect = Boolean(selectedOptionId && selectedOptionId === correctOption?.id);

        if (isCorrect) score += question.marks;

        return {
          questionId: question.id,
          selectedOptionId,
          correctOptionId: correctOption?.id || null,
          isCorrect,
        };
      });

      const clearAnswers = await mysqlClient
        .from("student_answers")
        .delete()
        .eq("attempt_id", attemptId);

      if (clearAnswers.error) throw new Error(toErrorMessage(clearAnswers.error));

      const answerRows = answerResults.map((answer) => ({
        attempt_id: attemptId,
        question_id: answer.questionId,
        selected_option_id: answer.selectedOptionId,
        is_correct: answer.isCorrect,
      }));

      if (answerRows.length) {
        const answerInsert = await mysqlClient.from("student_answers").insert(answerRows);
        if (answerInsert.error) throw new Error(toErrorMessage(answerInsert.error));
      }

      const { error } = await mysqlClient
        .from("quiz_attempts")
        .update({
          submitted_at: toMysqlDateTime(),
          completed_at: toMysqlDateTime(),
          score,
          total_marks: totalMarks,
          total_questions: questions.length,
          is_completed: true,
        })
        .eq("id", attemptId);

      if (error) throw new Error(toErrorMessage(error));

      await subscription.incrementQuizUsage(1);

      const {
        data: { user },
      } = await mysqlClient.auth.getUser();
      if (user && (quiz as any).subject_id) {
        await mysqlClient.rpc("update_enrollment_progress", {
          p_user_id: user.id,
          p_subject_id: (quiz as any).subject_id,
        });
      }

      return { score, totalMarks, answers: answerResults };
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      setResults(data);
      toast({
        title: "Quiz submitted",
        description: "Your score and corrections are ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Quiz submit failed",
        description: toErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!attemptId || timeLeft === null || isSubmitted || submitQuizMutation.isPending) return;

    if (timeLeft <= 0) {
      const questions = getAccessibleQuestions(quiz, isPremium);
      if (currentQuestionIndex >= questions.length - 1) {
        submitQuizMutation.mutate();
      } else {
        setCurrentQuestionIndex((previous) => previous + 1);
        setTimeLeft(SECONDS_PER_QUESTION);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previous) => (previous === null ? null : previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [attemptId, currentQuestionIndex, isPremium, isSubmitted, quiz, submitQuizMutation, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setSelectedAnswers((previous) => ({ ...previous, [questionId]: optionId }));
  }, []);

  const moveToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setTimeLeft(SECONDS_PER_QUESTION);
  }, []);

  if (quizLoading || subscription.loading) {
    return (
      <Card className="border-0 bg-white/80 shadow-xl">
        <CardContent className="py-14 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading quiz environment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="border-0 bg-white shadow-xl">
        <CardContent className="py-14 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="font-semibold">Quiz not found</p>
          <p className="text-sm text-muted-foreground">This quiz may have been removed.</p>
        </CardContent>
      </Card>
    );
  }

  const quizData = quiz as any;
  const allQuestions = quizData.questions as Question[];
  const questions = getAccessibleQuestions(quizData, isPremium);
  const answeredCount = questions.filter((question) => selectedAnswers[question.id]).length;
  const lockedQuestionCount = Math.max(0, allQuestions.length - questions.length);

  if (isSubmitted && results) {
    const percentage = results.totalMarks ? Math.round((results.score / results.totalMarks) * 100) : 0;
    const correctCount = results.answers.filter((answer) => answer.isCorrect).length;
    const wrongCount = results.answers.filter((answer) => !answer.isCorrect && answer.selectedOptionId).length;
    const skippedCount = Math.max(0, questions.length - correctCount - wrongCount);

    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Trophy className="mr-1 h-3.5 w-3.5" />
                  Quiz Result
                </Badge>
                <h2 className="text-3xl font-bold">{quizData.title}</h2>
                <p className="mt-2 max-w-2xl text-slate-500">
                  Score, correction, and answer review are saved in your learning record.
                </p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 text-center shadow-inner">
                <div className="text-6xl font-black">{percentage}%</div>
                <p className="mt-1 text-sm text-slate-500">
                  {results.score} / {results.totalMarks} marks
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-3xl font-bold">{correctCount}</p>
                <p className="text-sm text-slate-500">Correct answers</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-3xl font-bold">{wrongCount}</p>
                <p className="text-sm text-slate-500">Wrong answers</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-3xl font-bold">{skippedCount}</p>
                <p className="text-sm text-slate-500">Skipped questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-xl">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Quiz access</p>
                <p className="text-sm text-muted-foreground">
                  {isPremium ? "Premium semester quiz bank is active." : `Free users can access up to ${FREE_QUESTION_LIMIT} questions per subject quiz.`}
                </p>
              </div>
              {isPremium ? (
                <Badge className="w-fit bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Premium active
                </Badge>
              ) : (
                <Button size="sm" onClick={() => navigate("/subscription")}>
                  <Crown className="mr-2 h-4 w-4" />
                  Unlock 50+ questions
                </Button>
              )}
            </div>
            <Progress value={Math.min(100, (questions.length / Math.max(allQuestions.length || questions.length, 1)) * 100)} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const result = results.answers.find((answer) => answer.questionId === question.id);
            const selectedOptionId = result?.selectedOptionId || selectedAnswers[question.id] || null;

            return (
              <Card key={question.id} className="border-0 bg-white shadow-lg">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Question {index + 1}
                      </Badge>
                      <p className="text-lg font-semibold">{question.question_text}</p>
                    </div>
                    {result?.isCorrect ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Review
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {question.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      const isCorrect = option.is_correct;

                      return (
                        <div
                          key={option.id}
                          className={`rounded-2xl border p-4 text-sm transition ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : isSelected
                                ? "border-rose-300 bg-rose-50 text-rose-900"
                                : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isSelected
                                    ? "bg-rose-600 text-white"
                                    : "bg-white text-slate-600"
                              }`}
                            >
                              {isCorrect ? "OK" : isSelected ? "!" : option.option_order}
                            </span>
                            <div>
                              <p>{option.option_text}</p>
                              {isCorrect && <p className="mt-1 text-xs font-semibold">Correct answer</p>}
                              {isSelected && !isCorrect && <p className="mt-1 text-xs font-semibold">Your answer</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate("/quizzes")} className="flex-1">
            Back to Quizzes
          </Button>
          <Button onClick={() => navigate("/dashboard")} className="flex-1">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!attemptId && !canTake) {
    return (
      <Card className="overflow-hidden border-0 bg-white shadow-xl">
        <CardContent className="p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 text-rose-600">
            <Lock className="h-8 w-8" />
          </div>
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold">Premium Quiz Bank Locked</h2>
            <p className="mt-3 text-muted-foreground">
              Free access includes the first {FREE_QUESTION_LIMIT} questions. Premium unlocks the full quiz bank with 50+ questions where available.
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span>Today used</span>
              <span className="font-semibold">{FREE_QUESTION_LIMIT} free questions</span>
            </div>
            <Progress value={100} className="mt-3 h-2" />
          </div>
          <div className="mx-auto mt-6 flex max-w-md gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/quizzes")}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => navigate("/subscription")}>
              <Crown className="mr-2 h-4 w-4" />
              Get Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attemptId) {
    return (
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-xl">
        <div className="border-b bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 text-slate-950">
          <Badge className="mb-5 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            EduConnect Practice Arena
          </Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-tight">{quizData.title}</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            {quizData.description || "Attempt this syllabus-based quiz and review every correction after submit."}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold">{questions.length}</p>
              <p className="text-sm text-slate-500">{isPremium ? "Unlocked questions" : "Free questions"}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold">{SECONDS_PER_QUESTION}s</p>
              <p className="text-sm text-slate-500">Per question</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold">{DIFFICULTY_LABELS[quizData.difficulty_level] || "Practice"}</p>
              <p className="text-sm text-slate-500">Level</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold">{isPremium ? "Full" : lockedQuestionCount}</p>
              <p className="text-sm text-slate-500">{isPremium ? "Semester access" : "Locked premium"}</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold">{quizData.subjects?.name || "Subject quiz"}</p>
              <p className="text-sm text-muted-foreground">
                Answers are saved after submit and corrections are shown immediately.
              </p>
            </div>
            <Badge variant={isPremium ? "secondary" : "outline"} className="w-fit">
              {isPremium ? (
                <>
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Premium quiz bank: {limit}+
                </>
              ) : (
                <>Free bank: {questions.length} / {allQuestions.length || questions.length} questions</>
              )}
            </Badge>
          </div>
          {!isPremium && lockedQuestionCount > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Premium for Semester {semester} unlocks the remaining {lockedQuestionCount} questions and the full quiz bank for this subject.
            </div>
          )}
          <Button
            onClick={() => startAttemptMutation.mutate()}
            disabled={startAttemptMutation.isPending}
            className="mt-6 h-12 w-full rounded-xl text-base font-bold"
          >
            {startAttemptMutation.isPending ? "Starting..." : "Start Quiz"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
      <div className="space-y-5">
        <Card className="overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-xl">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge className="mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Live Quiz Session</Badge>
                <h2 className="text-2xl font-black">{quizData.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <div
                className={`flex w-fit items-center rounded-2xl px-5 py-3 font-mono text-xl font-black shadow-inner ${
                  timeLeft !== null && timeLeft <= 3 ? "bg-rose-500 text-white" : "bg-white text-indigo-700"
                }`}
              >
                <Clock className="mr-2 h-5 w-5" />
                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </div>
            </div>
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-bold text-slate-700">{answeredCount}/{questions.length} answered</span>
              </div>

              <div className="rounded-3xl border bg-slate-50 p-7 shadow-inner">
                <div className="mb-5 flex items-center justify-between">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Marks: {currentQuestion.marks}</Badge>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    {DIFFICULTY_LABELS[quizData.difficulty_level] || "Practice"}
                  </Badge>
                </div>
                <h3 className="text-3xl font-black leading-relaxed tracking-tight">{currentQuestion.question_text}</h3>
              </div>

              <div className="mt-5 grid gap-3">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="pt-1 text-base font-semibold text-slate-900">{option.option_text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => moveToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="h-12 flex-1 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={() => submitQuizMutation.mutate()}
              disabled={submitQuizMutation.isPending}
              className="h-12 flex-1 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
            >
              {submitQuizMutation.isPending ? "Submitting..." : "Submit & View Score"}
            </Button>
          ) : (
            <Button
              onClick={() => moveToQuestion(currentQuestionIndex + 1)}
              className="h-12 flex-1 rounded-xl font-bold"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Card className="h-fit border border-slate-200 bg-white text-slate-950 shadow-xl">
        <CardContent className="p-5">
          <p className="font-bold">Question Map</p>
          <p className="mt-1 text-sm text-slate-500">Jump fast and track progress.</p>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => moveToQuestion(index)}
                className={`h-11 rounded-xl text-sm font-bold transition ${
                  index === currentQuestionIndex
                    ? "bg-indigo-600 text-white shadow-lg"
                    : selectedAnswers[question.id]
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Answered</span>
              <span className="font-bold">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Remaining</span>
              <span className="font-bold">{questions.length - answeredCount}</span>
            </div>
          </div>
          {!isPremium && lockedQuestionCount > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {lockedQuestionCount} more questions unlock with Semester {semester} premium.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeQuiz;

import { useQuery } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Trophy, Clock, TrendingUp } from "lucide-react";

interface Quiz {
  id: string;
  subject_id: string;
  title: string;
  difficulty_level: number;
  time_limit_minutes: number;
  subjects: { name: string } | null;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number | null;
  total_marks: number | null;
  is_completed: boolean;
  started_at: string;
  submitted_at: string | null;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  0: "Beginner",
  1: "Intermediate",
  2: "Advanced",
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const QuizAnalyticsDashboard = () => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");

  // Fetch teacher's quizzes
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ["teacher-quizzes-analytics"],
    queryFn: async () => {
      const { data: { user } } = await mysqlClient.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await mysqlClient
        .from("quizzes")
        .select("id, subject_id, title, difficulty_level, time_limit_minutes")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const quizRows = (data || []) as Omit<Quiz, "subjects">[];
      const subjectIds = [...new Set(quizRows.map((quiz) => quiz.subject_id).filter(Boolean))];
      const subjectRes = subjectIds.length
        ? await mysqlClient.from("subjects").select("id, name").in("id", subjectIds)
        : { data: [] };
      const subjectById = new Map((subjectRes.data || []).map((subject: any) => [subject.id, subject]));
      return quizRows.map((quiz) => ({ ...quiz, subjects: subjectById.get(quiz.subject_id) || null })) as Quiz[];
    },
  });

  // Fetch attempts for teacher's quizzes
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["quiz-attempts-analytics", quizzes?.map(q => q.id)],
    queryFn: async () => {
      if (!quizzes || quizzes.length === 0) return [];

      const quizIds = quizzes.map(q => q.id);
      const { data, error } = await mysqlClient
        .from("quiz_attempts")
        .select("id, quiz_id, score, total_marks, is_completed, started_at, submitted_at")
        .in("quiz_id", quizIds);

      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!quizzes && quizzes.length > 0,
  });

  if (quizzesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No quizzes created yet. Create a quiz to see analytics.
        </CardContent>
      </Card>
    );
  }

  // Filter attempts based on selected quiz
  const filteredAttempts = selectedQuizId === "all"
    ? attempts || []
    : (attempts || []).filter(a => a.quiz_id === selectedQuizId);

  const completedAttempts = filteredAttempts.filter(a => a.is_completed);

  // Calculate statistics
  const totalAttempts = filteredAttempts.length;
  const completedCount = completedAttempts.length;
  const averageScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => {
        if (a.score !== null && a.total_marks !== null && a.total_marks > 0) {
          return sum + (a.score / a.total_marks) * 100;
        }
        return sum;
      }, 0) / completedAttempts.length
    : 0;

  const passRate = completedAttempts.length > 0
    ? (completedAttempts.filter(a => 
        a.score !== null && a.total_marks !== null && a.total_marks > 0 && 
        (a.score / a.total_marks) >= 0.5
      ).length / completedAttempts.length) * 100
    : 0;

  // Score distribution for chart
  const scoreRanges = [
    { range: "0-25%", count: 0 },
    { range: "26-50%", count: 0 },
    { range: "51-75%", count: 0 },
    { range: "76-100%", count: 0 },
  ];

  completedAttempts.forEach(a => {
    if (a.score !== null && a.total_marks !== null && a.total_marks > 0) {
      const percentage = (a.score / a.total_marks) * 100;
      if (percentage <= 25) scoreRanges[0].count++;
      else if (percentage <= 50) scoreRanges[1].count++;
      else if (percentage <= 75) scoreRanges[2].count++;
      else scoreRanges[3].count++;
    }
  });

  // Quiz performance comparison
  const quizPerformance = quizzes.map(quiz => {
    const quizAttempts = (attempts || []).filter(a => a.quiz_id === quiz.id && a.is_completed);
    const avgScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => {
          if (a.score !== null && a.total_marks !== null && a.total_marks > 0) {
            return sum + (a.score / a.total_marks) * 100;
          }
          return sum;
        }, 0) / quizAttempts.length
      : 0;
    
    return {
      name: quiz.title.length > 15 ? quiz.title.substring(0, 15) + "..." : quiz.title,
      fullName: quiz.title,
      attempts: quizAttempts.length,
      avgScore: Math.round(avgScore),
    };
  }).filter(q => q.attempts > 0);

  // Completion status for pie chart
  const completionData = [
    { name: "Completed", value: completedCount },
    { name: "In Progress", value: totalAttempts - completedCount },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Quiz Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Quiz:</label>
        <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Quizzes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quizzes</SelectItem>
            {quizzes.map((quiz) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all completed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 50% to pass
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-xs text-muted-foreground">
              Created by you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {completedAttempts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No completed attempts yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            {totalAttempts > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No attempts yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Performance Comparison */}
        {quizPerformance.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quiz Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value, name) => [
                      name === "avgScore" ? `${value}%` : value,
                      name === "avgScore" ? "Avg Score" : "Attempts"
                    ]}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((level) => {
              const levelQuizzes = quizzes.filter(q => q.difficulty_level === level);
              const levelAttempts = (attempts || []).filter(a => 
                levelQuizzes.some(q => q.id === a.quiz_id) && a.is_completed
              );
              const levelAvg = levelAttempts.length > 0
                ? levelAttempts.reduce((sum, a) => {
                    if (a.score !== null && a.total_marks !== null && a.total_marks > 0) {
                      return sum + (a.score / a.total_marks) * 100;
                    }
                    return sum;
                  }, 0) / levelAttempts.length
                : 0;

              return (
                <div
                  key={level}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {DIFFICULTY_LABELS[level]}
                  </div>
                  <div className="text-2xl font-bold">
                    {levelAvg.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {levelQuizzes.length} quizzes • {levelAttempts.length} attempts
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizAnalyticsDashboard;



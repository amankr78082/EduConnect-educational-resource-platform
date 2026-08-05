import { useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SubjectSelector } from "@/components/cms/SubjectSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  marks: number;
  options: Option[];
}

interface QuizFormProps {
  onSuccess?: () => void;
  quizId?: string | null;
}

const DIFFICULTY_LABELS = ["Beginner", "Intermediate", "Advanced"];

const QuizForm = ({ onSuccess, quizId }: QuizFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      text: "",
      marks: 1,
      options: [
        { id: crypto.randomUUID(), text: "", isCorrect: true },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    },
  ]);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;

      const { data: quiz } = await mysqlClient
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .maybeSingle();
      if (!quiz) return;

      const quizData = quiz as any;
      setSelectedSubject(quizData.subject_id);
      const { data: subject } = await mysqlClient
        .from("subjects")
        .select("semester")
        .eq("id", quizData.subject_id)
        .maybeSingle();
      if ((subject as any)?.semester) setSelectedSemester((subject as any).semester);
      setTitle(quizData.title || "");
      setDescription(quizData.description || "");
      setTimeLimit(quizData.time_limit_minutes || 30);
      setDifficultyLevel(quizData.difficulty_level || 0);
      setIsPublished(Boolean(quizData.is_published));

      const { data: quizQuestions } = await mysqlClient
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("question_order", { ascending: true });
      const questionIds = (quizQuestions || []).map((question: any) => question.id);
      const { data: quizOptions } = questionIds.length
        ? await mysqlClient
            .from("options")
            .select("*")
            .in("question_id", questionIds)
            .order("option_order", { ascending: true })
        : { data: [] };

      const loadedQuestions = (quizQuestions || []).map((question: any) => ({
        id: question.id,
        text: question.question_text,
        marks: question.marks || 1,
        options: (quizOptions || [])
          .filter((option: any) => option.question_id === question.id)
          .map((option: any) => ({
            id: option.id,
            text: option.option_text,
            isCorrect: Boolean(option.is_correct),
          })),
      }));

      if (loadedQuestions.length) setQuestions(loadedQuestions);
    };

    loadQuiz();
  }, [quizId]);

  const saveQuizMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await mysqlClient.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let quiz: any = null;
      if (quizId) {
        const { error: quizError } = await mysqlClient
          .from("quizzes")
          .update({
            subject_id: selectedSubject,
            title,
            description,
            time_limit_minutes: timeLimit,
            difficulty_level: difficultyLevel,
            is_published: isPublished,
          })
          .eq("id", quizId);
        if (quizError) throw quizError;

        const { data: oldQuestions } = await mysqlClient
          .from("questions")
          .select("id")
          .eq("quiz_id", quizId);
        const oldQuestionIds = (oldQuestions || []).map((question: any) => question.id);
        if (oldQuestionIds.length) {
          await mysqlClient.from("options").delete().in("question_id", oldQuestionIds);
          await mysqlClient.from("questions").delete().eq("quiz_id", quizId);
        }
        quiz = { id: quizId };
      } else {
        const { data: createdQuiz, error: quizError } = await mysqlClient
          .from("quizzes")
          .insert({
            subject_id: selectedSubject,
            title,
            description,
            time_limit_minutes: timeLimit,
            difficulty_level: difficultyLevel,
            is_published: isPublished,
            created_by: user.id,
          })
          .select()
          .single();

        if (quizError) throw quizError;
        quiz = createdQuiz;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: question, error: questionError } = await mysqlClient
          .from("questions")
          .insert({
            quiz_id: quiz.id,
            question_text: q.text,
            question_order: i,
            marks: q.marks,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        const optionsToInsert = q.options.map((opt, idx) => ({
          question_id: question.id,
          option_text: opt.text,
          is_correct: opt.isCorrect,
          option_order: idx,
        }));

        const { error: optionsError } = await mysqlClient
          .from("options")
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      return quiz;
    },
    onSuccess: () => {
      toast({ title: quizId ? "Quiz updated!" : "Quiz created!" });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: quizId ? "Error updating quiz" : "Error creating quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        text: "",
        marks: 1,
        options: [
          { id: crypto.randomUUID(), text: "", isCorrect: true },
          { id: crypto.randomUUID(), text: "", isCorrect: false },
          { id: crypto.randomUUID(), text: "", isCorrect: false },
          { id: crypto.randomUUID(), text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId: string, field: string, value: string | number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text } : opt
              ),
            }
          : q
      )
    );
  };

  const setCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) => ({
                ...opt,
                isCorrect: opt.id === optionId,
              })),
            }
          : q
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject) {
      toast({ title: "Select a subject", variant: "destructive" });
      return;
    }
    
    if (!title.trim()) {
      toast({ title: "Enter a quiz title", variant: "destructive" });
      return;
    }

    const hasEmptyQuestions = questions.some(
      (q) => !q.text.trim() || q.options.some((o) => !o.text.trim())
    );

    if (hasEmptyQuestions) {
      toast({
        title: "Fill in all questions and options",
        variant: "destructive",
      });
      return;
    }

    saveQuizMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SubjectSelector
            selectedSemester={selectedSemester}
            selectedSubject={selectedSubject}
            onSemesterChange={setSelectedSemester}
            onSubjectChange={setSelectedSubject}
          />

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="timeLimit">Time (min)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={1}
                max={180}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
              />
            </div>

            <div>
              <Label>Level</Label>
              <Select
                value={String(difficultyLevel)}
                onValueChange={(v) => setDifficultyLevel(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LABELS.map((label, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="published" className="text-sm">Publish</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Questions</h3>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={question.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Q{qIndex + 1}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Marks:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={question.marks}
                    onChange={(e) =>
                      updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)
                    }
                    className="w-14 h-7 text-sm"
                  />
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Textarea
                value={question.text}
                onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                placeholder="Question text"
                rows={2}
                required
              />

              <div className="grid gap-2">
                {question.options.map((option, oIndex) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      option.isCorrect
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setCorrectOption(question.id, option.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        option.isCorrect
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOption(question.id, option.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      className="flex-1 h-8"
                      required
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="submit"
        disabled={saveQuizMutation.isPending}
        className="w-full"
      >
        {saveQuizMutation.isPending ? "Saving..." : quizId ? "Save Quiz" : "Create Quiz"}
      </Button>
    </form>
  );
};

export default QuizForm;



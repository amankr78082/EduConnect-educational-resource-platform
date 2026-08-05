import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, FileText, Download, Search, Calendar, BookOpen, ChevronDown, ChevronRight, FolderOpen, Lock, Lightbulb,
} from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

interface PreviousPaper {
  id: string;
  title: string;
  year: number;
  exam_type: string;
  file_url: string | null;
  solution_text: string | null;
  solution_file_url: string | null;
  semester: number;
  subject_id: string;
  subjects?: { name: string; code: string } | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  end_sem: "End Semester",
  mid_sem: "Mid Semester",
  supplementary: "Supplementary",
};

const PreviousYearPapers = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();
  const { hasPremium } = useSubscription(user?.id);
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSemesters, setExpandedSemesters] = useState<Record<number, boolean>>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  // Free tier: 1 most-recent paper per subject
  const FREE_PAPERS_PER_SUBJECT = 1;

  // Fetch all subjects
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["all-subjects"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("subjects")
        .select("id, name, code, semester")
        .order("semester")
        .order("name");
      if (error) throw error;
      return data as Subject[];
    },
    enabled: isReady && !!user,
  });

  // Fetch papers
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["previous-papers"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("previous_papers")
        .select("*, subjects(name, code)")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as PreviousPaper[];
    },
    enabled: isReady && !!user,
  });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  // Group subjects by semester
  const subjectsBySemester: Record<number, Subject[]> = {};
  allSubjects.forEach((s) => {
    if (!subjectsBySemester[s.semester]) subjectsBySemester[s.semester] = [];
    subjectsBySemester[s.semester].push(s);
  });

  // Group papers by subject_id
  const papersBySubject: Record<string, PreviousPaper[]> = {};
  papers.forEach((p) => {
    if (!papersBySubject[p.subject_id]) papersBySubject[p.subject_id] = [];
    papersBySubject[p.subject_id].push(p);
  });

  // Filter papers
  const filterPapers = (subjectPapers: PreviousPaper[]) => {
    return subjectPapers.filter((p) => {
      if (selectedExamType !== "all" && p.exam_type !== selectedExamType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  };

  // Check if subject matches search
  const subjectMatchesSearch = (subject: Subject) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return subject.name.toLowerCase().includes(q) || subject.code.toLowerCase().includes(q);
  };

  const toggleSemester = (sem: number) => {
    setExpandedSemesters((prev) => ({ ...prev, [sem]: !prev[sem] }));
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const toggleSolution = (paperId: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [paperId]: !prev[paperId] }));
  };

  const semesters = [1, 2, 3, 4];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Previous Year Papers
          </h1>
          <p className="text-muted-foreground mt-1">
            RGPV MCA previous year question papers — semester & subject wise
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject or paper title..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="end_sem">End Semester</SelectItem>
                  <SelectItem value="mid_sem">Mid Semester</SelectItem>
                  <SelectItem value="supplementary">Supplementary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading papers...</div>
        ) : (
          <div className="space-y-4">
            {semesters.map((sem) => {
              const semSubjects = (subjectsBySemester[sem] || []).filter(subjectMatchesSearch);
              if (semSubjects.length === 0 && searchQuery) return null;

              const isExpanded = expandedSemesters[sem];

              return (
                <Card key={sem} className="overflow-hidden">
                  <button
                    onClick={() => toggleSemester(sem)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-display">Semester {sem}</h2>
                        <p className="text-sm text-muted-foreground">
                          {semSubjects.length} subjects
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 space-y-2">
                      {semSubjects.map((subject) => {
                        const subjectPapers = filterPapers(papersBySubject[subject.id] || []);
                        const totalPapers = (papersBySubject[subject.id] || []).length;
                        const isSubjectExpanded = expandedSubjects[subject.id];

                        return (
                          <div key={subject.id} className="border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleSubject(subject.id)}
                              className="w-full flex items-center justify-between p-3 hover:bg-accent/20 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <FolderOpen className="h-4 w-4 text-primary" />
                                <div>
                                  <span className="font-medium text-sm">{subject.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({subject.code})</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={totalPapers > 0 ? "default" : "outline"} className="text-xs">
                                  {totalPapers} {totalPapers === 1 ? "paper" : "papers"}
                                </Badge>
                                {isSubjectExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>

                            {isSubjectExpanded && (
                              <div className="border-t bg-muted/20 p-3">
                                {subjectPapers.length === 0 ? (
                                  <div className="text-center py-6">
                                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      {totalPapers === 0
                                        ? "No papers uploaded yet for this subject"
                                        : "No papers match your current filter"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {subjectPapers.map((paper, idx) => {
                                      const locked = !hasPremium(paper.semester) && idx >= FREE_PAPERS_PER_SUBJECT;
                                      return (
                                      <div key={paper.id} className={`rounded-lg border bg-card transition-colors ${locked ? "opacity-75" : "hover:bg-accent/30"}`}>
                                        <div className="flex items-center justify-between gap-3 p-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                              <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm">{paper.title}</p>
                                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-xs">
                                                  <Calendar className="h-3 w-3 mr-1" />
                                                  {paper.year}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                  {EXAM_TYPE_LABELS[paper.exam_type] || paper.exam_type}
                                                </Badge>
                                                {(paper.solution_text || paper.solution_file_url) && (
                                                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                                    Solution available
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap justify-end gap-2">
                                            {locked ? (
                                              <Button size="sm" variant="outline" onClick={() => {
                                                toast.error("Premium required", {
                                                  description: "Upgrade to access more papers",
                                                  action: { label: "Upgrade", onClick: () => navigate("/subscription") },
                                                });
                                              }}>
                                                <Lock className="h-3 w-3 mr-1" /> Premium
                                              </Button>
                                            ) : paper.file_url ? (
                                              <Button size="sm" variant="outline" asChild>
                                                <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                                                  <Download className="h-4 w-4 mr-1" /> Paper
                                                </a>
                                              </Button>
                                            ) : (
                                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                                Coming Soon
                                              </Badge>
                                            )}
                                            {!locked && paper.solution_text && (
                                              <Button size="sm" variant="outline" onClick={() => toggleSolution(paper.id)}>
                                                <Lightbulb className="h-4 w-4 mr-1" />
                                                {expandedSolutions[paper.id] ? "Hide Solution" : "View Solution"}
                                              </Button>
                                            )}
                                            {!locked && paper.solution_file_url && (
                                              <Button size="sm" variant="outline" asChild>
                                                <a href={paper.solution_file_url} target="_blank" rel="noopener noreferrer">
                                                  <Download className="h-4 w-4 mr-1" /> Solution PDF
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        {!locked && paper.solution_text && expandedSolutions[paper.id] && (
                                          <div className="border-t bg-emerald-50/50 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                              <Lightbulb className="h-4 w-4" />
                                              Teacher Solution / Answer Hint
                                            </div>
                                            <div className="whitespace-pre-wrap rounded-lg border border-emerald-100 bg-background p-3 text-sm leading-6 text-muted-foreground">
                                              {paper.solution_text}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PreviousYearPapers;



import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Loader2, Lightbulb, Download } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - i);

const PaperUploadForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR - 1));
  const [examType, setExamType] = useState("end_sem");
  const [file, setFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [solutionText, setSolutionText] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-for-papers"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("subjects")
        .select("id, name, code, semester")
        .order("semester")
        .order("name");
      if (error) throw error;
      return data as Subject[];
    },
  });

  const { data: papers = [], isLoading: papersLoading } = useQuery({
    queryKey: ["previous-papers-manage"],
    queryFn: async () => {
      const { data, error } = await mysqlClient
        .from("previous_papers")
        .select("*, subjects(name, code)")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mysqlClient.from("previous_papers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["previous-papers-manage"] });
      queryClient.invalidateQueries({ queryKey: ["previous-papers"] });
      toast({ title: "Paper deleted" });
    },
  });

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title) {
      toast({ title: "Missing fields", description: "Please fill title and select subject", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      let fileUrl: string | null = null;
      let solutionFileUrl: string | null = null;

      if (file) {
        const filePath = `papers/${Date.now()}_${file.name}`;
        const { error: uploadError } = await mysqlClient.storage
          .from("educational-content")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = mysqlClient.storage
          .from("educational-content")
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      if (solutionFile) {
        const solutionPath = `paper-solutions/${Date.now()}_${solutionFile.name}`;
        const { error: solutionUploadError } = await mysqlClient.storage
          .from("educational-content")
          .upload(solutionPath, solutionFile);
        if (solutionUploadError) throw solutionUploadError;

        const { data: solutionUrlData } = mysqlClient.storage
          .from("educational-content")
          .getPublicUrl(solutionPath);
        solutionFileUrl = solutionUrlData.publicUrl;
      }

      const { data: { user } } = await mysqlClient.auth.getUser();

      const { error } = await mysqlClient.from("previous_papers").insert({
        title,
        subject_id: subjectId,
        year: Number(year),
        exam_type: examType,
        file_url: fileUrl,
        semester: selectedSubject?.semester || 1,
        solution_text: solutionText.trim() || null,
        solution_file_url: solutionFileUrl,
        uploaded_by: user?.id || null,
      });

      if (error) throw error;

      toast({ title: "Paper uploaded!", description: `${title} (${year}) added successfully.` });
      setTitle("");
      setFile(null);
      setSolutionFile(null);
      setSolutionText("");
      queryClient.invalidateQueries({ queryKey: ["previous-papers-manage"] });
      queryClient.invalidateQueries({ queryKey: ["previous-papers"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const groupedBySubject = subjects.reduce<Record<number, Subject[]>>((acc, s) => {
    if (!acc[s.semester]) acc[s.semester] = [];
    acc[s.semester].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Previous Year Paper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paper Title *</Label>
                <Input
                  placeholder="e.g. Operating Systems End Sem 2023"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(groupedBySubject).sort().map((sem) => (
                      <div key={sem}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Semester {sem}
                        </div>
                        {groupedBySubject[Number(sem)].map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} - {s.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_sem">End Semester</SelectItem>
                    <SelectItem value="mid_sem">Mid Semester</SelectItem>
                    <SelectItem value="supplementary">Supplementary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Upload the question paper PDF (optional — you can add the file later)</p>
            </div>
            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <Label>Optional Answers / Solution</Label>
                  <p className="text-xs text-muted-foreground">
                    Add solutions only when needed. Students will see them with this PYQ.
                  </p>
                </div>
              </div>
              <Textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Write answer hints, marking scheme, or full solution here..."
                className="min-h-28"
              />
              <div className="space-y-2">
                <Label>Solution PDF</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">Optional. Use this for handwritten or detailed solutions.</p>
              </div>
            </div>
            <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading..." : "Upload Paper"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing papers list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploaded Papers ({papers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {papersLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : papers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No papers uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {papers.map((paper: any) => (
                <div key={paper.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{paper.title}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                        <Badge variant="secondary" className="text-xs">{paper.subjects?.code}</Badge>
                        <Badge variant="secondary" className="text-xs">Sem {paper.semester}</Badge>
                        {(paper.solution_text || paper.solution_file_url) && (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                            Solution added
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {paper.solution_file_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={paper.solution_file_url} target="_blank" rel="noopener noreferrer" title="Download solution">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(paper.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperUploadForm;



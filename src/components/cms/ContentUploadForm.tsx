import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectSelector } from "./SubjectSelector";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Video, BookOpen, Loader2 } from "lucide-react";

type ContentType = "notes" | "pdf" | "video";

interface Unit {
  id: string;
  subject_id: string;
  unit_number: number;
  name: string;
}

interface SyllabusTopic {
  id: string;
  unit_id: string;
  title: string;
  topic_order: number;
}

interface ContentUploadFormProps {
  onSuccess: () => void;
}

export const ContentUploadForm = ({ onSuccess }: ContentUploadFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<ContentType>("notes");
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [notesContent, setNotesContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUnits = async () => {
      setSelectedUnit(null);
      setSelectedTopic(null);
      setUnits([]);
      setTopics([]);

      if (!selectedSubject) return;

      const { data, error } = await mysqlClient
        .from("units")
        .select("id, subject_id, unit_number, name")
        .eq("subject_id", selectedSubject)
        .order("unit_number");

      if (error) {
        toast({ title: "Error", description: "Unable to load units", variant: "destructive" });
        return;
      }

      setUnits((data || []) as Unit[]);
    };

    loadUnits();
  }, [selectedSubject]);

  useEffect(() => {
    const loadTopics = async () => {
      setSelectedTopic(null);
      setTopics([]);

      if (!selectedUnit) return;

      const { data, error } = await mysqlClient
        .from("syllabus_topics")
        .select("id, unit_id, title, topic_order")
        .eq("unit_id", selectedUnit)
        .order("topic_order");

      if (error) {
        toast({ title: "Error", description: "Unable to load topics", variant: "destructive" });
        return;
      }

      setTopics((data || []) as SyllabusTopic[]);
    };

    loadTopics();
  }, [selectedUnit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast({ title: "Error", description: "Please upload a PDF file", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject) {
      toast({ title: "Error", description: "Please select a subject", variant: "destructive" });
      return;
    }

    if (!selectedUnit || !selectedTopic) {
      toast({ title: "Error", description: "Please select unit and topic for drill-down navigation", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await mysqlClient.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let fileUrl = null;

      if (contentType === "pdf" && pdfFile) {
        const fileName = `${Date.now()}-${pdfFile.name}`;
        const { data: uploadData, error: uploadError } = await mysqlClient.storage
          .from("educational-content")
          .upload(fileName, pdfFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = mysqlClient.storage
          .from("educational-content")
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }

      const { error } = await mysqlClient.from("content").insert({
        title,
        description,
        content_type: contentType,
        subject_id: selectedSubject,
        unit_id: selectedUnit,
        syllabus_topic_id: selectedTopic,
        created_by: user.id,
        notes_content: contentType === "notes" ? notesContent : null,
        video_url: contentType === "video" ? videoUrl : null,
        file_url: contentType === "pdf" ? fileUrl : null,
        approval_status: "pending",
      });

      if (error) throw error;

      toast({ title: "Submitted", description: "Content sent to admin for approval." });
      
      // Reset form
      setTitle("");
      setDescription("");
      setNotesContent("");
      setVideoUrl("");
      setPdfFile(null);
      setSelectedUnit(null);
      setSelectedTopic(null);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SubjectSelector
        selectedSemester={selectedSemester}
        selectedSubject={selectedSubject}
        onSemesterChange={setSelectedSemester}
        onSubjectChange={setSelectedSubject}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={selectedUnit || ""}
            onValueChange={(value) => setSelectedUnit(value || null)}
            disabled={!selectedSubject || units.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={!selectedSubject ? "Select subject first" : units.length === 0 ? "No units found" : "Select unit"} />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  Unit {unit.unit_number}: {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Topic</Label>
          <Select
            value={selectedTopic || ""}
            onValueChange={(value) => setSelectedTopic(value || null)}
            disabled={!selectedUnit || topics.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={!selectedUnit ? "Select unit first" : topics.length === 0 ? "No topics found" : "Select topic"} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.topic_order}. {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content Type</Label>
        <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="notes">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Notes
              </div>
            </SelectItem>
            <SelectItem value="pdf">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF Document
              </div>
            </SelectItem>
            <SelectItem value="video">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Link
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter content title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the content"
          rows={2}
        />
      </div>

      {contentType === "notes" && (
        <div className="space-y-2">
          <Label htmlFor="notes">Notes Content</Label>
          <Textarea
            id="notes"
            value={notesContent}
            onChange={(e) => setNotesContent(e.target.value)}
            placeholder="Enter your notes content here..."
            rows={8}
            required
          />
        </div>
      )}

      {contentType === "video" && (
        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL</Label>
          <Input
            id="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            required
          />
          <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo link</p>
        </div>
      )}

      {contentType === "pdf" && (
        <div className="space-y-2">
          <Label htmlFor="pdf">PDF File</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="pdf"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              required={contentType === "pdf"}
            />
            <label htmlFor="pdf" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {pdfFile ? (
                <p className="text-sm font-medium">{pdfFile.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
                </>
              )}
            </label>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Content
          </>
        )}
      </Button>
    </form>
  );
};



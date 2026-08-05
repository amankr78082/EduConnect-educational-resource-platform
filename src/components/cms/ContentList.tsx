import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { SubjectSelector } from "./SubjectSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { FileText, Video, BookOpen, Trash2, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: "notes" | "pdf" | "video";
  file_url: string | null;
  video_url: string | null;
  notes_content: string | null;
  created_at: string;
  subject_id: string;
  uploaded_by: string | null;
  approval_status: string | null;
  review_notes: string | null;
  subjects: {
    name: string;
    code: string;
    semester: number;
  };
}

interface ContentListProps {
  refreshTrigger: number;
  showDeleteButton?: boolean;
}

export const ContentList = ({ refreshTrigger, showDeleteButton = true }: ContentListProps) => {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      let query = mysqlClient
        .from("content")
        .select(`*, subjects(name, code, semester)`)
        .order("created_at", { ascending: false });

      if (selectedSubject) {
        query = query.eq("subject_id", selectedSubject);
      } else if (selectedSemester) {
        query = query.eq("subjects.semester", selectedSemester);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out items where subjects is null (happens when semester filter applied)
        const filtered = data.filter((c) => c.subjects !== null) as Content[];
        setContents(filtered);
      }
      setLoading(false);
    };

    fetchContents();

    const onActivity = () => fetchContents();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [selectedSemester, selectedSubject, refreshTrigger]);

  const handleDelete = async (id: string) => {
    const { error } = await mysqlClient.from("content").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete content", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Content removed successfully" });
      setContents((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "notes":
        return <BookOpen className="w-5 h-5" />;
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "notes":
        return "bg-edu-teal/10 text-edu-teal border-edu-teal/20";
      case "pdf":
        return "bg-edu-orange/10 text-edu-orange border-edu-orange/20";
      case "video":
        return "bg-edu-indigo/10 text-edu-indigo border-edu-indigo/20";
      default:
        return "";
    }
  };

  const getStatusVariant = (status?: string | null) => {
    if (status === "approved") return "default";
    if (status === "rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <SubjectSelector
        selectedSemester={selectedSemester}
        selectedSubject={selectedSubject}
        onSemesterChange={setSelectedSemester}
        onSubjectChange={setSelectedSubject}
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading content...</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {selectedSemester || selectedSubject ? "No content found for the selected filters" : "Select a semester to view content"}
        </div>
      ) : (
        <div className="grid gap-4">
          {contents.map((content) => (
            <Card key={content.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getTypeColor(content.content_type)}`}>
                  {getIcon(content.content_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{content.title}</h3>
                    <Badge variant="outline" className="shrink-0">
                      {content.subjects.code}
                    </Badge>
                    <Badge variant={getStatusVariant(content.approval_status)} className="shrink-0 capitalize">
                      {content.approval_status || "pending"}
                    </Badge>
                  </div>
                  {content.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{content.description}</p>
                  )}
                  {content.approval_status === "rejected" && content.review_notes && (
                    <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      Admin note: {content.review_notes}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(content.created_at), "MMM d, yyyy")}
                    </span>
                    <span>Semester {content.subjects.semester}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {content.content_type === "video" && content.video_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={content.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {content.content_type === "pdf" && content.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {showDeleteButton && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(content.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};



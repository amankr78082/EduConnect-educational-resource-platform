import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookmarkPlus, FileText } from "lucide-react";

interface TopicRow {
  id: string;
  title: string;
  page_number: number | null;
  content_id: string;
  content_title: string;
  subject_id: string;
  subject_name: string;
  semester: number;
}

const TopicJumpWidget = () => {
  const [topics, setTopics] = useState<TopicRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await mysqlClient
        .from("content_topics")
        .select("id, title, page_number, content_id, content:content_id(title, subject_id, content_type, subjects:subject_id(name, semester))")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!data) return;
      const rows: TopicRow[] = data
        .map((t: any) => t.content && t.content.subjects ? {
          id: t.id,
          title: t.title,
          page_number: t.page_number,
          content_id: t.content_id,
          content_title: t.content.title,
          subject_id: t.content.subject_id,
          subject_name: t.content.subjects.name,
          semester: t.content.subjects.semester,
        } : null)
        .filter(Boolean) as TopicRow[];
      setTopics(rows);
    })();
  }, []);

  if (topics.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookmarkPlus className="w-4 h-4 text-primary" /> Jump to a Topic
        </CardTitle>
        <CardDescription>PDF khulega bilkul us page pe jahan topic shuru hota hai</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            to={`/syllabus?sem=${t.semester}&subject=${t.subject_id}&content=${t.content_id}${t.page_number ? `&page=${t.page_number}` : ""}`}
            className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors flex items-start gap-2"
          >
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {t.subject_name} • {t.content_title}{t.page_number ? ` • Page ${t.page_number}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopicJumpWidget;



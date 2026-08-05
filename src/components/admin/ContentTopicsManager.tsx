import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";

interface ContentItem { id: string; title: string; content_type: string; file_url: string | null; }
interface Topic { id: string; content_id: string; title: string; page_number: number | null; topic_order: number; }

export const ContentTopicsManager = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selContent, setSelContent] = useState<string>("");
  const [newTopic, setNewTopic] = useState({ title: "", page_number: 1 });
  const [showPreview, setShowPreview] = useState(false);

  const selectedContent = contents.find(c => c.id === selContent);
  const previewUrl = selectedContent?.file_url
    ? `${selectedContent.file_url}#page=${newTopic.page_number}&toolbar=0&navpanes=0`
    : null;

  const loadContents = async () => {
    const { data } = await mysqlClient.from("content").select("id, title, content_type, file_url").in("content_type", ["pdf", "notes"]).order("created_at", { ascending: false });
    setContents((data || []) as ContentItem[]);
  };

  const loadTopics = async () => {
    if (!selContent) { setTopics([]); return; }
    const { data } = await mysqlClient.from("content_topics").select("*").eq("content_id", selContent).order("topic_order");
    setTopics(data || []);
  };

  useEffect(() => { loadContents(); }, []);
  useEffect(() => { loadTopics(); }, [selContent]);

  const addTopic = async () => {
    if (!selContent) return toast.error("Select content");
    if (!newTopic.title.trim()) return toast.error("Topic title required");
    const { error } = await mysqlClient.from("content_topics").insert({
      content_id: selContent,
      title: newTopic.title,
      page_number: newTopic.page_number,
      topic_order: topics.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Topic added");
    setNewTopic({ title: "", page_number: newTopic.page_number + 1 });
    loadTopics();
  };

  const removeTopic = async (id: string) => {
    const { error } = await mysqlClient.from("content_topics").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadTopics();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookmarkPlus className="w-5 h-5 text-primary" /> PDF Topic Anchors</CardTitle>
        <CardDescription>Add clickable topics that jump to a specific page in the PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Content (PDF / Notes)</Label>
          <Select value={selContent} onValueChange={setSelContent}>
            <SelectTrigger><SelectValue placeholder="Select content" /></SelectTrigger>
            <SelectContent>
              {contents.map(c => (
                <SelectItem key={c.id} value={c.id}>[{c.content_type}] {c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selContent && (
          <>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-7">
                <Label className="text-xs">Topic Title</Label>
                <Input placeholder="Variables and Data Types" value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">PDF Page #</Label>
                <Input type="number" min={1} value={newTopic.page_number} onChange={e => setNewTopic({ ...newTopic, page_number: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="col-span-2">
                <Button onClick={addTopic} className="w-full"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {previewUrl && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 text-xs">
                  <span>Preview: page {newTopic.page_number}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(s => !s)}>
                    {showPreview ? "Hide" : "Show"} preview
                  </Button>
                </div>
                {showPreview && (
                  <iframe key={previewUrl} src={previewUrl} className="w-full h-96 bg-background" title="PDF page preview" />
                )}
              </div>
            )}
            {!selectedContent?.file_url && selectedContent && (
              <p className="text-xs text-muted-foreground">No file URL on this content — preview unavailable.</p>
            )}

            <div className="space-y-2">
              {topics.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Page {t.page_number}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeTopic(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {topics.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No topics yet</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};



import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, FileText, GraduationCap, Loader2, PlaySquare, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ContentApproval {
  id: string;
  title: string;
  description: string | null;
  content_type: "notes" | "pdf" | "video";
  file_url: string | null;
  video_url: string | null;
  approval_status: string | null;
  created_at: string;
  created_by: string | null;
  subjects?: { name: string; code: string; semester: number } | null;
}

const AdminContentApprovals = () => {
  const { user, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentApproval[]>([]);
  const [busy, setBusy] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  const loadItems = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setBusy(true);
    const { data, error } = await mysqlClient
      .from("content")
      .select("*, subjects(name, code, semester)")
      .order("created_at", { ascending: false });
    if (error) toast.error("Unable to load content approvals");
    else setItems((data || []) as ContentApproval[]);
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const onActivity = () => loadItems(true);
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [loadItems]);

  const reviewContent = async (id: string, status: "approved" | "rejected") => {
    setProcessing(id);
    const { error } = await mysqlClient
      .from("content")
      .update({
        approval_status: status,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        review_notes: status === "approved" ? null : "Rejected by admin",
      })
      .eq("id", id);

    if (error) toast.error("Review failed");
    else {
      toast.success(status === "approved" ? "Content approved" : "Content rejected");
      await loadItems(true);
    }
    setProcessing(null);
  };

  const filteredItems = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) =>
      `${item.title} ${item.description || ""} ${item.subjects?.name || ""} ${item.subjects?.code || ""} ${item.approval_status || ""}`
        .toLowerCase()
        .includes(text),
    );
  }, [items, query]);

  const pendingCount = items.filter((item) => (item.approval_status || "pending") === "pending").length;
  const approvedCount = items.filter((item) => item.approval_status === "approved").length;
  const rejectedCount = items.filter((item) => item.approval_status === "rejected").length;

  if (loading || busy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <nav className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071733] text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display font-bold leading-tight">Content Approval Center</p>
                <p className="text-xs text-muted-foreground">Review teacher uploads before students see them</p>
              </div>
            </Link>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <ClipboardCheck className="mr-1 h-3 w-3" /> Admin Review
          </Badge>
        </div>
      </nav>

      <main className="container space-y-6 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Pending Review", pendingCount],
            ["Approved Content", approvedCount],
            ["Rejected Content", rejectedCount],
          ].map(([label, value]) => (
            <Card key={label as string} className="rounded-3xl">
              <CardContent className="p-5">
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search content, subject, status..." className="pl-10" />
        </div>

        <div className="grid gap-4">
          {filteredItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No content found</CardContent></Card>
          ) : (
            filteredItems.map((item) => {
              const status = item.approval_status || "pending";
              return (
                <Card key={item.id} className="rounded-3xl">
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                          {status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{item.content_type}</Badge>
                        {item.subjects && <Badge variant="outline">{item.subjects.code} | Sem {item.subjects.semester}</Badge>}
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          {item.content_type === "video" ? <PlaySquare className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.subjects?.name || "Subject not mapped"}</p>
                          {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.video_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.video_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Preview</a>
                        </Button>
                      )}
                      {item.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Preview</a>
                        </Button>
                      )}
                      <Button size="sm" disabled={processing === item.id || status === "approved"} onClick={() => reviewContent(item.id, "approved")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" disabled={processing === item.id || status === "rejected"} onClick={() => reviewContent(item.id, "rejected")}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminContentApprovals;



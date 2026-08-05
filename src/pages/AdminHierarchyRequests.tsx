import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, Loader2, Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import HierarchyRequestDiff from "@/components/admin/HierarchyRequestDiff";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Eye } from "lucide-react";

const AdminHierarchyRequests = () => {
  const { user, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const load = async () => {
    const { data } = await mysqlClient.from("hierarchy_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const getRequestTitle = (request: any) => (
    request.payload?.title ||
    request.payload?.request_type ||
    `${request.action_type || "request"} ${request.target_table}`
  );

  const getRequestSubtitle = (request: any) => (
    request.payload?.category_label ||
    request.payload?.target_label ||
    request.target_table
  );

  const decide = async (req: any, approve: boolean) => {
    setBusy(req.id);
    try {
      if (approve && req.payload?.auto_publish === true) {
        if (req.action_type === "create") {
          const { error } = await mysqlClient.from(req.target_table).insert(req.payload);
          if (error) throw error;
        } else if (req.action_type === "update" && req.target_id) {
          const { error } = await mysqlClient.from(req.target_table).update(req.payload).eq("id", req.target_id);
          if (error) throw error;
        }
      }
      const { error: uErr } = await mysqlClient.from("hierarchy_requests").update({
        status: approve ? "approved" : "rejected",
        review_notes: reviewNotes[req.id] || null,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", req.id);
      if (uErr) throw uErr;
      toast.success(approve ? (req.payload?.auto_publish ? "Approved & published" : "Approved for action") : "Rejected");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><Card className="max-w-md"><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Admin only.</CardDescription></CardHeader><CardContent><Button asChild><Link to="/dashboard">Dashboard</Link></Button></CardContent></Card></div>;

  const pending = requests.filter((r) => r.status === "pending");
  const past = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><GraduationCap className="w-6 h-6 text-primary-foreground" /></div>
              <span className="font-display text-xl font-bold">Hierarchy Approvals</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container py-8 space-y-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge className="w-fit border-white/20 bg-white/10 text-white hover:bg-white/10">Admin Review Desk</Badge>
                <h1 className="font-display text-3xl font-bold md:text-4xl">Maintenance approvals</h1>
                <p className="text-sm leading-6 text-blue-100 md:text-base">
                  Review academic corrections, broken resources, syllabus indexing requests, and content quality reports submitted by the maintenance team.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <ShieldCheck className="mb-3 h-8 w-8 text-blue-100" />
                <p className="text-sm font-semibold">Admin controls final publishing</p>
                <p className="mt-1 text-xs text-blue-100">Maintenance can request. Admin approves or rejects.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Pending ({pending.length})</h2>
          {pending.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground">No pending requests.</CardContent></Card> :
            <div className="grid gap-4">
              {pending.map((r) => (
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge>{r.action_type}</Badge> <span>{getRequestTitle(r)}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {getRequestSubtitle(r)} - {new Date(r.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <HierarchyRequestDiff request={r} />
                    {r.notes && <p className="text-sm"><strong>Submitter notes:</strong> {r.notes}</p>}
                    <Textarea placeholder="Review notes (optional)" value={reviewNotes[r.id] || ""} onChange={(e) => setReviewNotes({ ...reviewNotes, [r.id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" /> Raw JSON</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Raw payload</DialogTitle>
                            <DialogDescription>Exact request payload submitted by maintenance.</DialogDescription>
                          </DialogHeader>
                          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto max-h-96">{JSON.stringify(r.payload, null, 2)}</pre>
                        </DialogContent>
                      </Dialog>
                      <Button onClick={() => decide(r, true)} disabled={busy === r.id} className="flex-1">
                        {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Approve</>}
                      </Button>
                      <Button onClick={() => decide(r, false)} disabled={busy === r.id} variant="destructive" className="flex-1">
                        <X className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">History</h2>
            <div className="space-y-2">
              {past.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center justify-between text-sm">
                    <div>
                      <Badge variant={r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
                      <span className="ml-2">{getRequestTitle(r)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.reviewed_at || r.created_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminHierarchyRequests;



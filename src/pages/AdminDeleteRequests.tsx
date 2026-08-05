import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GraduationCap, LogOut, Loader2, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteReq {
  id: string;
  table_name: string;
  record_id: string;
  record_label: string | null;
  reason: string;
  status: string;
  requested_by: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  requester_name?: string | null;
}

const AdminDeleteRequests = () => {
  const { user, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeleteReq[]>([]);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  const fetchAll = async () => {
    const { data } = await mysqlClient
      .from("delete_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map((d) => d.requested_by))];
    const { data: profiles } = await mysqlClient
      .from("profiles").select("user_id, full_name").in("user_id", userIds);
    const map = new Map(profiles?.map((p) => [p.user_id, p.full_name]));
    setRequests(data.map((d) => ({ ...d, requester_name: map.get(d.requested_by) || null })));
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const approve = async (req: DeleteReq) => {
    setWorking(req.id);
    // Actually delete the record
    const { error: delErr } = await mysqlClient
      .from(req.table_name as never)
      .delete()
      .eq("id", req.record_id);
    if (delErr) {
      toast.error("Delete fail: " + delErr.message);
      setWorking(null);
      return;
    }
    await mysqlClient.from("delete_requests").update({
      status: "approved",
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      review_notes: "Approved & deleted",
    }).eq("id", req.id);
    toast.success("Approved & deleted");
    fetchAll();
    setWorking(null);
  };

  const reject = async (req: DeleteReq) => {
    setWorking(req.id);
    await mysqlClient.from("delete_requests").update({
      status: "rejected",
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
      review_notes: "Rejected by admin",
    }).eq("id", req.id);
    toast.success("Rejected");
    fetchAll();
    setWorking(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  const renderCard = (r: DeleteReq) => (
    <Card key={r.id} className="border-l-4" style={{
      borderLeftColor: r.status === "pending" ? "hsl(var(--chart-4))" : r.status === "approved" ? "hsl(var(--chart-2))" : "hsl(var(--destructive))",
    }}>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">{r.table_name}</Badge>
              <span className="font-medium text-sm">{r.record_label || r.record_id}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1"><span className="font-medium">Reason:</span> {r.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Requested by {r.requester_name || "Unknown"} • {new Date(r.created_at).toLocaleString()}
            </p>
            {r.review_notes && <p className="text-xs text-muted-foreground italic mt-1">Note: {r.review_notes}</p>}
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2">
              <Button size="sm" disabled={working === r.id} onClick={() => approve(r)}>
                <CheckCircle className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" disabled={working === r.id} onClick={() => reject(r)}>
                <XCircle className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          ) : (
            <Badge variant={r.status === "approved" ? "default" : "destructive"} className="capitalize">{r.status}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Delete Requests</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await mysqlClient.auth.signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="container py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-destructive" /> Delete Requests
          </h1>
          <p className="text-muted-foreground">Review staff delete requests</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending"><Clock className="w-3 h-3 mr-1" />Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved"><CheckCircle className="w-3 h-3 mr-1" />Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected"><XCircle className="w-3 h-3 mr-1" />Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No pending requests</CardContent></Card> : pending.map(renderCard)}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3 mt-4">
            {approved.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">None yet</CardContent></Card> : approved.map(renderCard)}
          </TabsContent>
          <TabsContent value="rejected" className="space-y-3 mt-4">
            {rejected.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">None</CardContent></Card> : rejected.map(renderCard)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDeleteRequests;



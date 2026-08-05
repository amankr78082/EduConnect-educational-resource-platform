import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, GraduationCap, Loader2, Plus, Clock, CheckCircle2, XCircle, Search, Download, Wrench, Link2Off, BookOpenCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const STATUS_META: Record<string, { variant: "default" | "destructive" | "secondary"; icon: any; label: string }> = {
  pending: { variant: "secondary", icon: Clock, label: "Pending review" },
  approved: { variant: "default", icon: CheckCircle2, label: "Approved" },
  rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
};

const FRIENDLY: Record<string, string> = {
  universities: "University", courses: "Course", branches: "Branch", schemes: "Scheme", subjects: "Subject",
};

const MaintenanceDashboard = () => {
  const { user, isMaintenance, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const { data } = await mysqlClient
        .from("hierarchy_requests")
        .select("*")
        .eq("requested_by", user.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setBusy(false);
    })();
  }, [user]);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (actionFilter !== "all" && r.action_type !== actionFilter) return false;
      if (targetFilter !== "all" && r.target_table !== targetFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (q) {
        const hay = `${r.action_type} ${r.target_table} ${r.notes || ""} ${r.review_notes || ""} ${JSON.stringify(r.payload || {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, search, actionFilter, targetFilter, statusFilter, dateFrom, dateTo]);

  const grouped = useMemo(() => ({
    pending: filtered.filter(r => r.status === "pending"),
    approved: filtered.filter(r => r.status === "approved"),
    rejected: filtered.filter(r => r.status === "rejected"),
  }), [filtered]);

  const exportData = (format: "csv" | "json") => {
    if (filtered.length === 0) return toast.error("No requests to export");
    const ts = new Date().toISOString().slice(0, 10);
    let blob: Blob;
    let filename: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
      filename = `maintenance-requests-${ts}.json`;
    } else {
      const headers = ["id", "action_type", "target_table", "status", "notes", "review_notes", "payload", "created_at", "reviewed_at"];
      const escape = (v: any) => {
        const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const rows = [headers.join(",")].concat(filtered.map(r => headers.map(h => escape(r[h])).join(",")));
      blob = new Blob([rows.join("\n")], { type: "text/csv" });
      filename = `maintenance-requests-${ts}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} request(s)`);
  };

  const resetFilters = () => {
    setSearch(""); setActionFilter("all"); setTargetFilter("all"); setStatusFilter("all"); setDateFrom(""); setDateTo("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isMaintenance && !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Card className="max-w-md"><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Maintenance role required.</CardDescription></CardHeader><CardContent><Button asChild><Link to="/dashboard">Dashboard</Link></Button></CardContent></Card></div>;
  }

  const RequestCard = ({ r }: { r: any }) => {
    const meta = STATUS_META[r.status] || STATUS_META.pending;
    const Icon = meta.icon;
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base capitalize">{r.payload?.request_type || r.action_type} {FRIENDLY[r.target_table] || r.target_table}</CardTitle>
              <CardDescription className="text-xs">
                Submitted {new Date(r.created_at).toLocaleString()}
                {r.reviewed_at && ` - Reviewed ${new Date(r.reviewed_at).toLocaleString()}`}
              </CardDescription>
            </div>
            <Badge variant={meta.variant} className="gap-1"><Icon className="w-3 h-3" /> {meta.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">{JSON.stringify(r.payload, null, 2)}</pre>
          {r.notes && <p className="text-xs"><strong>Your notes:</strong> {r.notes}</p>}
          {r.review_notes && (
            <div className="text-xs p-2 rounded border-l-2 border-primary bg-primary/5">
              <strong>Admin review:</strong> {r.review_notes}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const Empty = ({ msg }: { msg: string }) => (
    <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">{msg}</CardContent></Card>
  );

  const hasActiveFilters = search || actionFilter !== "all" || targetFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><GraduationCap className="w-6 h-6 text-primary-foreground" /></div>
              <span className="font-display text-xl font-bold">My Maintenance Requests</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportData("csv")}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("json")}>Export as JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild size="sm"><Link to="/maintenance/requests"><Plus className="w-4 h-4 mr-2" /> New Request</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8 space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 text-white shadow-xl">
          <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">Maintenance Workspace</Badge>
          <h1 className="mt-4 font-display text-3xl font-bold">Academic Quality & Correction Desk</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            Submit syllabus additions, spelling corrections, broken video reports, and content quality issues for admin approval.
            Maintenance suggests changes; Admin reviews and publishes.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4"><Wrench className="mb-2 h-5 w-5" /><p className="font-semibold">Hierarchy corrections</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><Link2Off className="mb-2 h-5 w-5" /><p className="font-semibold">Broken resource reports</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><BookOpenCheck className="mb-2 h-5 w-5" /><p className="font-semibold">Syllabus quality checks</p></div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-bold">{grouped.pending.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Approved</div><div className="text-2xl font-bold text-primary">{grouped.approved.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Rejected</div><div className="text-2xl font-bold text-destructive">{grouped.rejected.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search payload, notes, admin review..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                </SelectContent>
              </Select>
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger><SelectValue placeholder="Target" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All targets</SelectItem>
                  <SelectItem value="universities">University</SelectItem>
                  <SelectItem value="courses">Course</SelectItem>
                  <SelectItem value="branches">Branch</SelectItem>
                  <SelectItem value="schemes">Scheme</SelectItem>
                  <SelectItem value="subjects">Subject</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{filtered.length} of {requests.length} match</span>
                <Button size="sm" variant="ghost" className="h-7" onClick={resetFilters}>Clear filters</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {busy ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({grouped.pending.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({grouped.approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({grouped.rejected.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-3 mt-4">
              {filtered.length === 0 ? <Empty msg={hasActiveFilters ? "No matching requests." : "You haven't submitted any requests yet."} /> : filtered.map(r => <RequestCard key={r.id} r={r} />)}
            </TabsContent>
            <TabsContent value="pending" className="space-y-3 mt-4">
              {grouped.pending.length === 0 ? <Empty msg="No pending requests." /> : grouped.pending.map(r => <RequestCard key={r.id} r={r} />)}
            </TabsContent>
            <TabsContent value="approved" className="space-y-3 mt-4">
              {grouped.approved.length === 0 ? <Empty msg="No approved requests yet." /> : grouped.approved.map(r => <RequestCard key={r.id} r={r} />)}
            </TabsContent>
            <TabsContent value="rejected" className="space-y-3 mt-4">
              {grouped.rejected.length === 0 ? <Empty msg="No rejected requests." /> : grouped.rejected.map(r => <RequestCard key={r.id} r={r} />)}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default MaintenanceDashboard;



import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, GraduationCap, LogOut, Loader2, History, Filter } from "lucide-react";

interface LogRow {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  actor_id: string | null;
  summary: string | null;
  created_at: string;
  actor_name?: string | null;
}

const ACTION_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

const AdminAuditLog = () => {
  const { user, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filter, setFilter] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  const loadLogs = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setBusy(true);
    const { data } = await mysqlClient
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!data) {
      setBusy(false);
      return;
    }
    const ids = [...new Set(data.map((d) => d.actor_id).filter(Boolean) as string[])];
    const { data: profs } = ids.length
      ? await mysqlClient.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] };
    const map = new Map(profs?.map((p) => [p.user_id, p.full_name]));
    setLogs(data.map((d) => ({ ...d, actor_name: d.actor_id ? map.get(d.actor_id) : null })));
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!isAdmin) return;
    const onActivity = () => loadLogs(true);
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [isAdmin, loadLogs]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  const tables = Array.from(new Set(logs.map((l) => l.table_name)));
  const filtered = logs.filter((l) =>
    (tableFilter === "all" || l.table_name === tableFilter) &&
    (filter === "" || (l.summary || "").toLowerCase().includes(filter.toLowerCase()) || (l.actor_name || "").toLowerCase().includes(filter.toLowerCase()))
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
              <span className="font-display text-xl font-bold">Audit Log</span>
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
            <History className="w-7 h-7 text-primary" /> Recent Staff Activity
          </h1>
          <p className="text-muted-foreground">Every important database action from admin, teacher, student and maintenance workflows.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search summary or actor..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button size="sm" variant={tableFilter === "all" ? "default" : "outline"} onClick={() => setTableFilter("all")}>All</Button>
            {tables.map((t) => (
              <Button key={t} size="sm" variant={tableFilter === t ? "default" : "outline"} onClick={() => setTableFilter(t)}>
                {t}
              </Button>
            ))}
          </div>
        </div>

        {busy ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No activity yet</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((l) => (
              <Card key={l.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge variant={ACTION_COLOR[l.action] || "outline"}>{l.action}</Badge>
                    <Badge variant="outline" className="capitalize">{l.table_name}</Badge>
                    <span className="text-sm truncate">{l.summary}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{l.actor_name || "system"}</span>
                    <span>|</span>
                    <span>{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAuditLog;




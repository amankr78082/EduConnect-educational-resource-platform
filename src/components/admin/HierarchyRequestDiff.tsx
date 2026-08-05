import { useEffect, useState, useCallback } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  request: {
    action_type: string;
    target_table: string;
    target_id: string | null;
    payload: Record<string, any>;
    diff_snapshot?: { current?: Record<string, any> | null; proposed?: Record<string, any> | null } | null;
  };
}

const FRIENDLY_LABELS: Record<string, string> = {
  universities: "University", courses: "Course", branches: "Branch", schemes: "Scheme", subjects: "Subject",
};

const HierarchyRequestDiff = ({ request }: Props) => {
  const [current, setCurrent] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSnapshot, setUsingSnapshot] = useState(false);

  const load = useCallback(async () => {
    if (request.action_type !== "update" || !request.target_id) return;
    setLoading(true);
    setError(null);
    setUsingSnapshot(false);
    try {
      const { data, error } = await mysqlClient
        .from(request.target_table as any)
        .select("*")
        .eq("id", request.target_id)
        .maybeSingle();
      if (error) throw error;
      if (!data && request.diff_snapshot?.current) {
        setCurrent(request.diff_snapshot.current);
        setUsingSnapshot(true);
      } else {
        setCurrent(data as any);
      }
    } catch (e: any) {
      if (request.diff_snapshot?.current) {
        setCurrent(request.diff_snapshot.current);
        setUsingSnapshot(true);
        setError(`Live fetch failed (${e.message || "error"}); showing snapshot.`);
      } else {
        setError(e.message || "Failed to fetch current record");
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  const fields = Object.keys(request.payload || {});
  const isUpdate = request.action_type === "update";

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 flex items-center justify-between text-xs gap-2">
        <span className="font-medium">
          {isUpdate ? "Field-by-field diff" : "Request payload preview"} -{" "}
          {FRIENDLY_LABELS[request.target_table] || request.target_table}
          {usingSnapshot && <Badge variant="outline" className="ml-2 text-[10px]">snapshot</Badge>}
        </span>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {isUpdate && !loading && (
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={load}>
              <RotateCcw className="w-3 h-3 mr-1" /> Retry
            </Button>
          )}
        </div>
      </div>
      {error && (
        <div className="px-3 py-2 bg-destructive/10 text-destructive text-xs flex items-center gap-2 border-b">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
      <table className="w-full text-xs">
        <thead className="bg-muted/30">
          <tr className="text-left">
            <th className="p-2 font-medium w-1/4">Field</th>
            {isUpdate && <th className="p-2 font-medium w-1/3">Current</th>}
            <th className="p-2 font-medium">Proposed</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((key) => {
            const proposed = request.payload[key];
            const existing = current?.[key];
            const changed = isUpdate && JSON.stringify(existing) !== JSON.stringify(proposed);
            return (
              <tr key={key} className="border-t align-top">
                <td className="p-2 font-mono text-muted-foreground">{key}</td>
                {isUpdate && (
                  <td className="p-2 font-mono break-all">
                    {existing === undefined || existing === null ? (
                      <span className="text-muted-foreground italic">-</span>
                    ) : (String(existing))}
                  </td>
                )}
                <td className="p-2 font-mono break-all">
                  <span className={changed ? "bg-primary/10 px-1 rounded" : ""}>
                    {proposed === null || proposed === undefined ? (
                      <span className="text-muted-foreground italic">-</span>
                    ) : (String(proposed))}
                  </span>
                  {changed && <Badge variant="outline" className="ml-2 text-[10px]">changed</Badge>}
                  {!isUpdate && <Badge variant="outline" className="ml-2 text-[10px]">new</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HierarchyRequestDiff;



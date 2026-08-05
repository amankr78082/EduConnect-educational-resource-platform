import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/integrations/mysql/client";

export interface RealtimeActivity {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  actor_id: string | null;
  summary: string | null;
  created_at: string;
}

const notifyTables = new Set([
  "content",
  "previous_papers",
  "quizzes",
  "live_sessions",
  "subscriptions",
  "payments",
  "teacher_assignments",
  "hierarchy_requests",
  "delete_requests",
]);

export const REALTIME_ACTIVITY_EVENT = "educonnect:activity";

export function useRealtimeActivity() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventsUrl = `${API_BASE_URL.replace(/\/$/, "")}/events`;
    const source = new EventSource(eventsUrl);

    source.onmessage = (event) => {
      const activity = JSON.parse(event.data) as RealtimeActivity;

      queryClient.invalidateQueries();
      window.dispatchEvent(new CustomEvent<RealtimeActivity>(REALTIME_ACTIVITY_EVENT, { detail: activity }));

      if (notifyTables.has(activity.table_name)) {
        toast.info(activity.summary || "EduConnect data updated", {
          description: "Dashboard and connected pages are refreshing automatically.",
        });
      }
    };

    source.onerror = () => {
      queryClient.invalidateQueries();
    };

    return () => source.close();
  }, [queryClient]);
}



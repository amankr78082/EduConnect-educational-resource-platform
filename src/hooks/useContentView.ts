import { mysqlClient } from "@/integrations/mysql/client";

export const trackContentView = async (contentId: string, subjectId: string) => {
  const { data: { user } } = await mysqlClient.auth.getUser();
  if (!user) return;

  // Upsert content view (ignore if already viewed)
  await mysqlClient
    .from("content_views")
    .upsert(
      { user_id: user.id, content_id: contentId },
      { onConflict: "user_id,content_id" }
    );

  // Update enrollment progress
  await mysqlClient.rpc("update_enrollment_progress", {
    p_user_id: user.id,
    p_subject_id: subjectId,
  });
};



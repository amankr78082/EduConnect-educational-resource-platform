import { useState, useEffect } from "react";
import { mysqlClient } from "@/integrations/mysql/client";

interface Subscription {
  id: string;
  semester: number;
  plan_type: string;
  status: string;
  purchased_at: string;
  expires_at: string | null;
}

export const useSubscription = (userId: string | undefined) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchData = async () => {
      const [subRes, usageRes] = await Promise.all([
        mysqlClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active"),
        mysqlClient
          .from("quiz_daily_usage")
          .select("attempts_count")
          .eq("user_id", userId)
          .eq("usage_date", new Date().toISOString().split("T")[0])
          .maybeSingle(),
      ]);

      if (subRes.data) setSubscriptions(subRes.data as Subscription[]);
      if (usageRes.data) setDailyUsage(usageRes.data.attempts_count || 0);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const hasPremium = (semester: number) =>
    subscriptions.some((s) => s.semester === semester && s.plan_type === "premium");

  const canAccessSubject = (subjectIsFree: boolean, semester: number) =>
    subjectIsFree || hasPremium(semester);

  const FREE_QUIZ_LIMIT = 20;
  const PREMIUM_QUIZ_LIMIT = 50;

  const getQuizLimit = (semester: number) =>
    hasPremium(semester) ? PREMIUM_QUIZ_LIMIT : FREE_QUIZ_LIMIT;

  const canTakeQuiz = (semester: number) => {
    return true;
  };

  const remainingQuizzes = (semester: number) => {
    const limit = getQuizLimit(semester);
    return Math.max(0, limit - dailyUsage);
  };

  const requestSubscription = async (
    semester: number,
    payment?: {
      amount?: number;
      payment_method?: string;
      transaction_id?: string;
      payment_screenshot_url?: string | null;
    }
  ) => {
    if (!userId) return null;
    const { error } = await mysqlClient.from("subscriptions").upsert(
      {
        user_id: userId,
        semester,
        plan_type: "premium",
        status: "pending",
        amount: payment?.amount ?? 299,
        purchased_at: new Date().toISOString(),
        notes: payment?.transaction_id ? `Transaction ID: ${payment.transaction_id}` : "Payment verification pending",
      },
      { onConflict: "user_id,semester" }
    );
    if (error) return { data: null, error };

    const { data: subscription } = await mysqlClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("semester", semester)
      .maybeSingle();

    if (subscription && payment) {
      const { error: paymentError } = await mysqlClient.from("payments").insert({
        user_id: userId,
        subscription_id: (subscription as any).id,
        amount: payment.amount ?? 299,
        payment_method: payment.payment_method || "UPI",
        transaction_id: payment.transaction_id || null,
        payment_status: "pending",
        payment_screenshot_url: payment.payment_screenshot_url || null,
        paid_at: new Date().toISOString(),
      });
      if (paymentError) return { data: subscription, error: paymentError };
    }

    return { data: subscription, error: null };
  };

  const incrementQuizUsage = async (count: number = 1) => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await mysqlClient
      .from("quiz_daily_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();

    if (existing) {
      await mysqlClient
        .from("quiz_daily_usage")
        .update({ attempts_count: (existing.attempts_count || 0) + count })
        .eq("id", existing.id);
    } else {
      await mysqlClient
        .from("quiz_daily_usage")
        .insert({ user_id: userId, usage_date: today, attempts_count: count });
    }
    setDailyUsage((prev) => prev + count);
  };

  return {
    subscriptions,
    loading,
    hasPremium,
    canAccessSubject,
    canTakeQuiz,
    remainingQuizzes,
    getQuizLimit,
    dailyUsage,
    requestSubscription,
    incrementQuizUsage,
    FREE_QUIZ_LIMIT,
    PREMIUM_QUIZ_LIMIT,
  };
};



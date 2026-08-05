import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Crown, ExternalLink, IndianRupee, Phone, User, XCircle } from "lucide-react";
import { toast } from "sonner";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";

interface SubscriptionRequest {
  id: string;
  user_id: string;
  semester: number;
  plan_type: string;
  status: string;
  purchased_at: string;
  notes: string | null;
  profile?: { full_name: string | null; user_id: string; phone?: string | null; semester?: number | null } | null;
  payment?: {
    id: string;
    amount: number;
    payment_method: string | null;
    transaction_id: string | null;
    payment_status: string;
    payment_screenshot_url: string | null;
  } | null;
}

const AdminSubscriptionManager = () => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await mysqlClient
      .from("subscriptions")
      .select("*")
      .order("purchased_at", { ascending: false });

    if (error) {
      toast.error("Failed to load subscription requests");
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data || []).map((request: any) => request.user_id))];
    const { data: profiles } = await mysqlClient
      .from("profiles")
      .select("user_id, full_name, phone, semester")
      .in("user_id", userIds);

    const { data: payments } = await mysqlClient
      .from("payments")
      .select("*")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
    const paymentMap = new Map((payments || []).map((payment: any) => [payment.subscription_id, payment]));

    setRequests(
      (data || []).map((request: any) => ({
        ...request,
        profile: profileMap.get(request.user_id) || null,
        payment: paymentMap.get(request.id) || null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const onActivity = () => fetchRequests();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const { data: { user } } = await mysqlClient.auth.getUser();

    const { error } = await mysqlClient
      .from("subscriptions")
      .update({
        status: "active",
        activated_by: user?.id || null,
        notes: `Approved on ${new Date().toLocaleDateString()}`,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to approve");
    } else {
      await mysqlClient
        .from("payments")
        .update({
          payment_status: "success",
          verified_by: user?.id || null,
          verified_at: new Date().toISOString(),
        })
        .eq("subscription_id", id);
      toast.success("Subscription approved");
      fetchRequests();
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const { error } = await mysqlClient
      .from("subscriptions")
      .update({
        status: "cancelled",
        notes: `Rejected on ${new Date().toLocaleDateString()}`,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to reject");
    } else {
      await mysqlClient
        .from("payments")
        .update({ payment_status: "failed" })
        .eq("subscription_id", id);
      toast.success("Subscription rejected");
      fetchRequests();
    }
    setProcessing(null);
  };

  const pending = requests.filter((request) => request.status === "pending");
  const active = requests.filter((request) => request.status === "active");
  const cancelled = requests.filter((request) => request.status === "cancelled" || request.status === "expired");

  const renderRequest = (request: SubscriptionRequest) => (
    <Card
      key={request.id}
      className="border-l-4"
      style={{
        borderLeftColor:
          request.status === "pending"
            ? "hsl(var(--chart-4))"
            : request.status === "active"
              ? "hsl(var(--chart-2))"
              : "hsl(var(--destructive))",
      }}
    >
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{request.profile?.full_name || "Unknown Student"}</p>
              <p className="text-xs text-muted-foreground">Semester {request.semester} - {request.plan_type}</p>
              {request.profile?.phone && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {request.profile.phone}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Requested: {new Date(request.purchased_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {request.status === "pending" ? (
              <>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={processing === request.id}
                  onClick={() => handleApprove(request.id)}
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs"
                  disabled={processing === request.id}
                  onClick={() => handleReject(request.id)}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Reject
                </Button>
              </>
            ) : (
              <Badge variant={request.status === "active" ? "default" : "destructive"} className="text-xs">
                {request.status === "active" && <CheckCircle className="mr-1 h-3 w-3" />}
                {request.status === "cancelled" && <XCircle className="mr-1 h-3 w-3" />}
                {request.status}
              </Badge>
            )}
          </div>
        </div>

        {request.notes && (
          <p className="mt-2 text-xs italic text-muted-foreground">{request.notes}</p>
        )}

        {request.payment && (
          <div className="mt-3 grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Amount:</span>
              <span>{request.payment.amount}</span>
            </div>
            <div><span className="font-medium">Method:</span> {request.payment.payment_method || "UPI"}</div>
            <div><span className="font-medium">Transaction:</span> {request.payment.transaction_id || "Not provided"}</div>
            <div><span className="font-medium">Payment status:</span> {request.payment.payment_status}</div>
            {request.payment.payment_screenshot_url && (
              <div className="sm:col-span-2 rounded-lg border bg-background p-2">
                <p className="mb-2 text-xs font-semibold">Payment screenshot submitted by student</p>
                <a href={request.payment.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={request.payment.payment_screenshot_url}
                    alt="Student payment screenshot"
                    className="max-h-56 w-full rounded-md border object-contain bg-muted/40"
                  />
                </a>
                <Button variant="outline" size="sm" asChild className="mt-2 w-full">
                  <a href={request.payment.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open Full Screenshot
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            <Clock className="mr-1 h-3 w-3" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><Clock className="mx-auto mb-2 h-10 w-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">No pending requests</p></CardContent></Card>
          ) : pending.map(renderRequest)}
        </TabsContent>

        <TabsContent value="active" className="mt-4 space-y-3">
          {active.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><Crown className="mx-auto mb-2 h-10 w-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">No active subscriptions</p></CardContent></Card>
          ) : active.map(renderRequest)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {cancelled.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><XCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">No rejected requests</p></CardContent></Card>
          ) : cancelled.map(renderRequest)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptionManager;


